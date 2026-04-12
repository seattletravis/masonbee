import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
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

const categoryLabelMap = CATEGORY_OPTIONS.reduce((accumulator, option) => {
	accumulator[option.value] = option.label;
	return accumulator;
}, {});

function normalizeEntries(payload) {
	if (Array.isArray(payload)) {
		return payload;
	}

	if (Array.isArray(payload?.results)) {
		return payload.results;
	}

	return [];
}

function truncateNotes(notes) {
	if (!notes) {
		return 'No notes yet.';
	}

	if (notes.length <= 200) {
		return notes;
	}

	return `${notes.slice(0, 200).trimEnd()}...`;
}

function getGardenName(entry) {
	if (typeof entry?.garden_name === 'string' && entry.garden_name.trim()) {
		return entry.garden_name;
	}

	if (
		typeof entry?.garden_display === 'string' &&
		entry.garden_display.trim()
	) {
		return entry.garden_display;
	}

	if (typeof entry?.garden_label === 'string' && entry.garden_label.trim()) {
		return entry.garden_label;
	}

	if (typeof entry?.garden === 'object' && entry.garden?.name) {
		return entry.garden.name;
	}

	if (typeof entry?.garden_details?.name === 'string') {
		return entry.garden_details.name;
	}

	return '';
}

function Journal() {
	const { id: routeGardenId } = useParams();
	const [entries, setEntries] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState('');
	const [deleteError, setDeleteError] = useState('');
	const [entryBeingEdited, setEntryBeingEdited] = useState(null);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [deletingEntryId, setDeletingEntryId] = useState(null);

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

	const displayedEntries = useMemo(() => {
		const filteredEntries = routeGardenId
			? entries.filter(
					(entry) => String(entry.garden) === String(routeGardenId),
				)
			: entries;

		return [...filteredEntries].sort((firstEntry, secondEntry) => {
			const firstDate = new Date(
				firstEntry.date || firstEntry.created_at || 0,
			).getTime();
			const secondDate = new Date(
				secondEntry.date || secondEntry.created_at || 0,
			).getTime();

			return secondDate - firstDate;
		});
	}, [entries, routeGardenId]);

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
	};

	const handleDelete = async (entryId) => {
		const confirmed = window.confirm(
			'Delete this journal entry? This action cannot be undone.',
		);

		if (!confirmed) {
			return;
		}

		setDeletingEntryId(entryId);
		setDeleteError('');

		try {
			await deleteJournalEntry(entryId);
			setEntries((currentEntries) =>
				currentEntries.filter((entry) => entry.id !== entryId),
			);
		} catch (error) {
			setDeleteError(
				error?.response?.data?.detail ||
					error?.response?.data?.message ||
					'Unable to delete this entry right now.',
			);
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

					<button
						type='button'
						className='journal-button journal-button-primary'
						onClick={handleCreateClick}>
						New Entry
					</button>
				</header>

				{loadError ? (
					<p className='journal-feedback error'>{loadError}</p>
				) : null}
				{deleteError ? (
					<p className='journal-feedback error'>{deleteError}</p>
				) : null}

				{isLoading ? (
					<div className='journal-state-card'>
						<p>Loading journal entries...</p>
					</div>
				) : null}

				{!isLoading && displayedEntries.length === 0 ? (
					<div className='journal-state-card'>
						<h2>No entries yet</h2>
						<p>
							Start your journal with a note about recent bee activity, blooms,
							or garden maintenance.
						</p>
					</div>
				) : null}

				{!isLoading && displayedEntries.length > 0 ? (
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

									{gardenName ? (
										<p className='journal-garden-label'>Garden: {gardenName}</p>
									) : null}

									<p className='journal-card-notes'>
										{truncateNotes(entry.notes)}
									</p>

									<div className='journal-card-actions'>
										<button
											type='button'
											className='journal-button journal-button-secondary'
											onClick={() => handleEditClick(entry)}>
											Edit
										</button>
										<button
											type='button'
											className='journal-button journal-button-danger'
											onClick={() => handleDelete(entry.id)}
											disabled={deletingEntryId === entry.id}>
											{deletingEntryId === entry.id ? 'Deleting...' : 'Delete'}
										</button>
									</div>
								</article>
							);
						})}
					</div>
				) : null}
			</div>

			<JournalEntryForm
				isOpen={isFormOpen}
				onClose={handleCloseForm}
				onSubmitSuccess={async () => {
					await loadEntries();
				}}
				entry={entryBeingEdited}
			/>
		</div>
	);
}

export default Journal;
