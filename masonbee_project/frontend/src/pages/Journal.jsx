import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { deleteJournalEntry, getJournalEntries } from '../api/journal';
import JournalEntryForm from '../components/JournalEntryForm';
import './Journal.css';

const CATEGORY_OPTIONS = [
	{ value: 'bee_activity', label: 'Bee Activity' },
	{ value: 'bloom', label: 'Bloom / Flowering' },
	{ value: 'maintenance', label: 'Maintenance' },
	{ value: 'observation', label: 'General Observation' },
	{ value: 'weather', label: 'Weather Note' },
	{ value: 'other', label: 'Other' },
];

const categoryLabelMap = CATEGORY_OPTIONS.reduce((acc, option) => {
	acc[option.value] = option.label;
	return acc;
}, {});

function normalizeEntries(payload) {
	if (Array.isArray(payload)) return payload;
	if (Array.isArray(payload?.results)) return payload.results;
	return [];
}

function truncateNotes(notes) {
	if (!notes) return 'No notes yet.';
	if (notes.length <= 200) return notes;
	return `${notes.slice(0, 200).trimEnd()}...`;
}

function getGardenName(entry) {
	if (entry?.garden_name?.trim()) return entry.garden_name;
	if (entry?.garden_display?.trim()) return entry.garden_display;
	if (entry?.garden_label?.trim()) return entry.garden_label;
	if (entry?.garden?.name) return entry.garden.name;
	if (entry?.garden_details?.name) return entry.garden_details.name;
	return '';
}

function Journal() {
	const { id: routeGardenId } = useParams();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const gardenIdFromQuery = searchParams.get('gardenId');
	const returnTo = searchParams.get('returnTo');

	const [entries, setEntries] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState('');
	const [deleteError, setDeleteError] = useState('');
	const [entryBeingEdited, setEntryBeingEdited] = useState(null);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [deletingEntryId, setDeletingEntryId] = useState(null);
	const [selectedGardenId, setSelectedGardenId] = useState('all');
	const [confirmingId, setConfirmingId] = useState(null);
	const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
	const [editingEntry, setEditingEntry] = useState(null);

	const loadEntries = useCallback(async () => {
		setIsLoading(true);
		setLoadError('');

		try {
			const data = await getJournalEntries();
			setEntries(normalizeEntries(data));
		} catch (error) {
			setLoadError(
				error?.response?.data?.detail ||
					error?.response?.data?.message ||
					'Unable to load journal entries right now.',
			);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadEntries();
	}, [loadEntries]);

	// ⭐ Auto-open form when coming from My Gardens
	useEffect(() => {
		if (gardenIdFromQuery) {
			setEntryBeingEdited(null);
			setIsFormOpen(true);
		}
	}, [gardenIdFromQuery]);

	const gardenOptions = useMemo(() => {
		const map = new Map();

		for (const entry of entries) {
			const id = entry.garden;
			const name = getGardenName(entry) || `Garden ${id}`;
			if (id && !map.has(id)) {
				map.set(id, { id, name });
			}
		}

		return Array.from(map.values());
	}, [entries]);

	const displayedEntries = useMemo(() => {
		let filtered = entries;

		if (routeGardenId) {
			filtered = filtered.filter(
				(entry) => String(entry.garden) === String(routeGardenId),
			);
		} else if (selectedGardenId !== 'all') {
			filtered = filtered.filter(
				(entry) => String(entry.garden) === String(selectedGardenId),
			);
		}

		return [...filtered].sort((a, b) => {
			const firstDate = new Date(a.date || a.created_at || 0).getTime();
			const secondDate = new Date(b.date || b.created_at || 0).getTime();
			return secondDate - firstDate;
		});
	}, [entries, routeGardenId, selectedGardenId]);

	const handleCreateClick = () => {
		setEntryBeingEdited(null);
		setDeleteError('');
		setIsFormOpen(true);
	};

	const handleEditClick = (entry) => {
		setEntryBeingEdited(entry);
		setDeleteError('');
		setIsFormOpen(true);
	};

	const handleCloseForm = () => {
		setEntryBeingEdited(null);
		setIsFormOpen(false);

		if (returnTo) {
			navigate(returnTo);
		}
	};

	const handleDelete = async (id) => {
		try {
			setDeletingEntryId(id);
			await deleteJournalEntry(id);
			await loadEntries();
		} catch (err) {
			setDeleteError('Unable to delete entry.');
		} finally {
			setDeletingEntryId(null);
		}
	};

	return (
		<div className='journal page'>
			<div className='journal-shell'>
				<header className='journal-header'>
					<div>
						<h1 className='journal-title'>Journal</h1>
						<p className='journal-subtitle'>
							Track blooms, bee activity, maintenance, and seasonal notes.
						</p>
					</div>

					<div
						style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
						{!routeGardenId && gardenOptions.length > 0 && (
							<select
								className='journal-garden-select'
								value={selectedGardenId}
								onChange={(e) => setSelectedGardenId(e.target.value)}>
								<option value='all'>All Gardens</option>
								{gardenOptions.map((g) => (
									<option key={g.id} value={g.id}>
										{g.name}
									</option>
								))}
							</select>
						)}

						<button
							type='button'
							className='journal-button journal-button-primary'
							onClick={handleCreateClick}>
							New Entry
						</button>
					</div>
				</header>

				{loadError && <p className='journal-feedback error'>{loadError}</p>}
				{deleteError && <p className='journal-feedback error'>{deleteError}</p>}

				{isLoading && (
					<div className='journal-state-card'>
						<p>Loading journal entries...</p>
					</div>
				)}

				{!isLoading && displayedEntries.length === 0 && (
					<div className='journal-state-card'>
						<h2>No entries yet</h2>
						<p>
							Start your journal with a note about recent bee activity, blooms,
							or garden maintenance.
						</p>
					</div>
				)}

				{!isLoading && displayedEntries.length > 0 && (
					<div className='journal-grid'>
						{displayedEntries.map((entry) => {
							const gardenName = getGardenName(entry);

							return (
								<article key={entry.id} className='journal-card'>
									<div className='journal-card-top'>
										<div>
											<p className='journal-card-date'>{entry.date}</p>
											<h2 className='journal-card-title'>{entry.title}</h2>
										</div>
										<span className='journal-category-badge'>
											{categoryLabelMap[entry.category] || entry.category}
										</span>
									</div>

									{gardenName && (
										<p className='journal-garden-label'>Garden: {gardenName}</p>
									)}

									<p className='journal-card-notes'>
										{truncateNotes(entry.notes)}
									</p>

									<div className='journal-card-actions'>
										<button
											type='button'
											className='journal-button journal-button-secondary'
											onClick={() => setEditingEntry(entry)}>
											Edit
										</button>

										{confirmingDeleteId === entry.id ? (
											<>
												<button
													type='button'
													className='journal-button journal-button-danger'
													onClick={() => handleDelete(entry.id)}>
													Confirm Delete
												</button>

												<button
													type='button'
													className='journal-button'
													onClick={() => setConfirmingDeleteId(null)}>
													Cancel
												</button>
											</>
										) : (
											<button
												type='button'
												className='journal-button journal-button-danger'
												onClick={() => setConfirmingDeleteId(entry.id)}
												disabled={deletingEntryId === entry.id}>
												{deletingEntryId === entry.id
													? 'Deleting...'
													: 'Delete'}
											</button>
										)}
									</div>

									{/* INLINE EDIT FORM */}
									{editingEntry?.id === entry.id && (
										<div className='inline-edit-container'>
											<JournalEntryForm
												isOpen={true}
												entry={editingEntry}
												onClose={() => setEditingEntry(null)}
												onSubmitSuccess={async () => {
													await loadEntries(); // reload journal list
													setEditingEntry(null);
												}}
											/>
										</div>
									)}
								</article>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}

export default Journal;
