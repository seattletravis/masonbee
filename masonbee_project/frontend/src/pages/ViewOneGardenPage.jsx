import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as api from '../api/client';
import { useAuthContext } from '../auth/AuthProvider';
import SingleGardenMap from '../components/SingleGardenMap';
import useUserLocation from '../hooks/useUserLocation';
import GardenMetadata from '../components/GardenMetadata';
import BeehouseEntryForm from '../components/BeehouseEntryForm';
import BeeNotesEntryForm from '../components/BeeNotesEntryForm';
import './ViewOneGardenPage.css';

function normalizeCollection(payload) {
	if (Array.isArray(payload)) return payload;
	if (Array.isArray(payload?.results)) return payload.results;
	return [];
}

function getErrorMessage(error, fallbackMessage) {
	return (
		error?.response?.data?.detail ||
		error?.response?.data?.message ||
		error?.message ||
		fallbackMessage
	);
}

function formatTimestamp(value) {
	if (!value) return 'Not available';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'Not available';
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: 'short',
	}).format(date);
}

function formatCoordinates(latitude, longitude) {
	if (latitude == null || longitude == null) return 'Coordinates not available';
	return `${latitude}, ${longitude}`;
}

function formatLocation(garden) {
	if (garden?.address) return garden.address;
	return formatCoordinates(garden?.latitude, garden?.longitude);
}

function formatBeehouseDisplayName(b, garden) {
	if (!b || !garden) return 'Beehouse';
	return `${garden.name} – ${b.beehouse_id}`;
}

function formatBeehouseType(b) {
	return b?.type || b?.beehouse_type || b?.house_type || 'Not listed';
}

function formatBeehouseStatus(b) {
	return b?.status || b?.state || 'Not listed';
}

function formatInspectionDate(b) {
	return formatTimestamp(
		b?.last_inspection_date || b?.last_inspection || b?.inspected_at,
	);
}

function getJournalDate(entry) {
	return entry?.date || entry?.created_at || entry?.updated_at || '';
}

function truncateNotes(notes) {
	if (!notes) return 'No notes yet.';
	if (notes.length <= 180) return notes;
	return `${notes.slice(0, 180).trimEnd()}...`;
}

export default function ViewOneGardenPage() {
	const { id } = useParams();
	const navigate = useNavigate();

	// ⭐ AuthProvider global state
	const { defaultGarden, setDefaultGarden, pinned, setPinned, gardenLoading } =
		useAuthContext();

	// ⭐ Local UI state
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState('');
	const [garden, setGarden] = useState(null);
	const [beehouses, setBeehouses] = useState([]);
	const [journalEntries, setJournalEntries] = useState([]);
	const [isPinned, setIsPinned] = useState(false);
	const [isDefault, setIsDefault] = useState(false);
	const [isSavingDefault, setIsSavingDefault] = useState(false);
	const [isSavingPin, setIsSavingPin] = useState(false);
	const [actionError, setActionError] = useState('');

	const { location: userLocation } = useUserLocation(true);
	const [showBeehouseForm, setShowBeehouseForm] = useState(false);
	const [showBeeNotesForm, setShowBeeNotesForm] = useState(false);
	const [showBeehouseList, setShowBeehouseList] = useState(false);

	// ------------------------------------------------------------
	// ⭐ Load all data for this garden
	// ------------------------------------------------------------
	const loadGardenPage = useCallback(async () => {
		setIsLoading(true);
		setLoadError('');

		try {
			const [gardenData, journalData, beehouseData] = await Promise.all([
				api.get(`/api/gardens/${id}/`),
				api.get(`/api/journal/?garden=${id}`),
				api.get(`/api/beehouses/?garden=${id}`),
			]);

			setGarden(gardenData || null);
			setJournalEntries(normalizeCollection(journalData));
			setBeehouses(normalizeCollection(beehouseData));

			// ⭐ Compute default from AuthProvider
			setIsDefault(defaultGarden?.id === Number(id));

			// ⭐ Compute pinned from AuthProvider
			const pinnedRecord = pinned[String(id)];
			setIsPinned(Boolean(pinnedRecord));
		} catch (error) {
			setLoadError(
				getErrorMessage(error, 'Unable to load this garden right now.'),
			);
		} finally {
			setIsLoading(false);
		}
	}, [id, defaultGarden, pinned]);

	useEffect(() => {
		if (!gardenLoading) loadGardenPage();
	}, [id, gardenLoading]);

	// ------------------------------------------------------------
	// ⭐ Sorted lists
	// ------------------------------------------------------------
	const sortedBeehouses = useMemo(
		() =>
			[...beehouses].sort((a, b) =>
				String(a?.name || '').localeCompare(String(b?.name || '')),
			),
		[beehouses],
	);

	const sortedJournalEntries = useMemo(
		() =>
			[...journalEntries].sort((a, b) => {
				const first = new Date(getJournalDate(a) || 0).getTime();
				const second = new Date(getJournalDate(b) || 0).getTime();
				return second - first;
			}),
		[journalEntries],
	);

	// ------------------------------------------------------------
	// ⭐ Navigation handlers
	// ------------------------------------------------------------
	const handleLogJournal = useCallback(() => {
		navigate(`/journal?gardenId=${id}&returnTo=/gardens/${id}`);
	}, [id, navigate]);

	const handleAddBeeNotes = useCallback(() => {
		navigate(`/beehouses/new?gardenId=${id}`);
	}, [id, navigate]);

	const handleEditEntry = useCallback(
		(entryId) => {
			navigate(`/journal?gardenId=${id}&editEntryId=${entryId}`);
		},
		[id, navigate],
	);

	// ------------------------------------------------------------
	// ⭐ Pin / Unpin
	// ------------------------------------------------------------
	const handleTogglePin = useCallback(async () => {
		setIsSavingPin(true);
		setActionError('');

		try {
			if (!isPinned) {
				// ⭐ PIN
				const result = await api.post(`/api/gardens/${id}/pin/`, {});
				if (result?.id) {
					setPinned({
						...pinned,
						[String(result.garden.id)]: result,
					});
				}
			} else {
				// ⭐ UNPIN
				await api.del(`/api/gardens/${id}/unpin/`);
				const updated = { ...pinned };
				delete updated[String(id)];
				setPinned(updated);
			}

			await loadGardenPage();
		} catch (error) {
			setActionError(
				getErrorMessage(error, 'Unable to update the pinned state right now.'),
			);
		} finally {
			setIsSavingPin(false);
		}
	}, [id, isPinned, pinned, setPinned, loadGardenPage]);

	// ------------------------------------------------------------
	// ⭐ Set Default Garden (Option B)
	// ------------------------------------------------------------
	async function handleSetDefault() {
		setIsSavingDefault(true);
		setActionError('');

		try {
			// ⭐ Step 1 — backend update
			await api.post('/api/gardens/default/', {
				garden_id: Number(id),
			});

			// ⭐ Step 2 — fetch full garden
			const fullGarden = await api.get(`/api/gardens/${id}/`);

			// ⭐ Step 3 — update global context
			setDefaultGarden(fullGarden);

			// ⭐ Step 4 — refresh UI
			await loadGardenPage();
		} catch (error) {
			setActionError(
				getErrorMessage(
					error,
					'Unable to set this as the default garden right now.',
				),
			);
		} finally {
			setIsSavingDefault(false);
		}
	}

	// ------------------------------------------------------------
	// ⭐ Render states
	// ------------------------------------------------------------
	if (gardenLoading || isLoading) {
		return (
			<div className='page view-one-garden-page'>
				<div className='journal-state-card'>
					<p>Loading garden details...</p>
				</div>
			</div>
		);
	}

	if (loadError) {
		return (
			<div className='page view-one-garden-page'>
				<p className='journal-feedback error'>{loadError}</p>
			</div>
		);
	}

	if (!garden) {
		return (
			<div className='page view-one-garden-page'>
				<div className='journal-state-card'>
					<h1 className='journal-title'>Garden not found</h1>
					<p>This garden could not be loaded.</p>
				</div>
			</div>
		);
	}

	// ------------------------------------------------------------
	// ⭐ Main Render
	// ------------------------------------------------------------
	return (
		<div className='page view-one-garden-page'>
			<header className='view-one-garden-page__header'>
				<div>
					<h1>{garden.name || 'Unnamed Garden'}</h1>
					<p className='view-one-garden-page__location'>
						{formatLocation(garden)}
					</p>
					<p className='view-one-garden-page__timestamps'>
						Created {formatTimestamp(garden.created_at)} | Updated{' '}
						{formatTimestamp(garden.updated_at)}
					</p>
				</div>

				<div className='view-one-garden-page__actions'>
					<button className='button button-primary' onClick={handleLogJournal}>
						Log Journal Entry
					</button>

					{!isDefault && (
						<button
							className='button button-secondary'
							onClick={handleSetDefault}
							disabled={isSavingDefault}>
							{isSavingDefault ? 'Saving...' : 'Set as Default Garden'}
						</button>
					)}

					<button
						className='button button-secondary'
						onClick={handleTogglePin}
						disabled={isSavingPin}>
						{isSavingPin
							? 'Saving...'
							: isPinned
								? 'Unpin Garden'
								: 'Pin Garden'}
					</button>
				</div>
			</header>

			{actionError && <p className='journal-feedback error'>{actionError}</p>}
			<section className='section view-one-garden-page__map'>
				<h2 className='section-title'>Map</h2>
				<SingleGardenMap garden={garden} userLocation={userLocation} />
			</section>
			<section className='section view-one-garden-page__beehouses'>
				{/* Header */}
				<div className='section-header'>
					<div className='section-header-left'>
						<h2 className='section-title'>Beehouses</h2>

						<button
							className='collapse-toggle'
							onClick={() => setShowBeehouseList((prev) => !prev)}>
							{showBeehouseList ? 'Hide Beehouse List' : 'Expand Beehouse List'}
						</button>
					</div>

					<div className='section-header-actions'>
						{/* Add Beehouse button (hidden when Bee Notes form is open) */}
						{!showBeeNotesForm && (
							<button
								className='button button-small'
								onClick={() => setShowBeehouseForm((prev) => !prev)}>
								{showBeehouseForm ? 'Cancel' : 'Add Beehouse'}
							</button>
						)}

						{/* Add Bee Notes button (hidden when Beehouse form is open) */}
						{!showBeehouseForm && (
							<button
								className='button button-small'
								onClick={() => setShowBeeNotesForm((prev) => !prev)}>
								{showBeeNotesForm ? 'Cancel' : 'Add Bee Note'}
							</button>
						)}
					</div>
				</div>

				{/* Description (moved OUT of header for proper layout) */}
				<p className='section-description'>
					All beehouse locations entered here are private and only you can see
					them. The data is used to determine mason bee population densities for
					the "Probability of Finding Mason Bees" map.
				</p>

				{/* Bee Notes Entry Form */}
				{showBeeNotesForm && (
					<BeeNotesEntryForm
						gardenId={id}
						beehouses={beehouses}
						onCreated={async () => {
							await loadGardenPage();
							setShowBeeNotesForm(false);
						}}
					/>
				)}

				{/* Beehouse Entry Form */}
				{showBeehouseForm && (
					<BeehouseEntryForm
						gardenId={id}
						onCreated={async () => {
							await loadGardenPage();
							setShowBeehouseForm(false);
						}}
					/>
				)}

				{/* Collapsible Beehouse List */}
				{showBeehouseList &&
					(sortedBeehouses.length === 0 ? (
						<div className='journal-state-card'>
							<p>No beehouses have been added to this garden yet.</p>
						</div>
					) : (
						<div className='journal-grid'>
							{sortedBeehouses.map((b) => (
								<article key={b.id} className='journal-card'>
									<div className='journal-card-top'>
										<div>
											<h3 className='journal-card-title'>
												{garden?.name} – {b.beehouse_id}
											</h3>
											<p className='journal-card-date'>
												Last inspection: {formatInspectionDate(b)}
											</p>
										</div>
									</div>

									<p>
										<strong>Type:</strong> {formatBeehouseType(b)}
									</p>
									<p>
										<strong>Status:</strong> {formatBeehouseStatus(b)}
									</p>

									<div className='journal-card-actions'>
										<button
											className='journal-button journal-button-secondary'
											onClick={() => setShowBeeNotesForm(true)}>
											Add Bee Note
										</button>
									</div>
								</article>
							))}
						</div>
					))}
			</section>

			<section className='section view-one-garden-page__metadata'>
				<h2 className='section-title'>Garden Metadata</h2>

				<GardenMetadata
					garden={garden}
					isPinned={isPinned}
					isDefault={isDefault}
					userLocation={userLocation}
				/>
			</section>

			<section className='section view-one-garden-page__journal'>
				<h2 className='section-title'>Journal Entries</h2>

				{sortedJournalEntries.length === 0 ? (
					<div className='journal-state-card'>
						<p>No journal entries have been logged for this garden yet.</p>
					</div>
				) : (
					<div className='journal-grid'>
						{sortedJournalEntries.map((entry) => (
							<article key={entry.id} className='journal-card'>
								<div className='journal-card-top'>
									<div>
										<p className='journal-card-date'>
											{formatTimestamp(getJournalDate(entry))}
										</p>
										<h3 className='journal-card-title'>
											{entry.title || 'Untitled Entry'}
										</h3>
									</div>

									<span className='journal-category-badge'>
										{entry.category}
									</span>
								</div>

								<p>
									<strong>Category:</strong> {entry.category}
								</p>

								<p className='journal-card-notes'>
									{truncateNotes(entry.notes)}
								</p>

								<div className='journal-card-actions'>
									<button
										className='journal-button journal-button-secondary'
										onClick={() => handleEditEntry(entry.id)}>
										Edit Entry
									</button>
								</div>
							</article>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
