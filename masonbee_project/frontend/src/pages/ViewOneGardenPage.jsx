import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as api from '../api/client';
import { useAuthContext } from '../auth/AuthProvider';
import SingleGardenMap from '../components/SingleGardenMap';
import useUserLocation from '../hooks/useUserLocation';
import GardenMetadata from '../components/GardenMetadata';
import JournalEntryForm from '../components/JournalEntryForm';
import './ViewOneGardenPage.css';
import './PageWrapperGlobal.css';

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

	const { defaultGarden, setDefaultGarden, pinned, setPinned, gardenLoading } =
		useAuthContext();

	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState('');
	const [garden, setGarden] = useState(null);
	const [journalEntries, setJournalEntries] = useState([]);

	const isDefault = defaultGarden?.id === Number(id);
	const isPinned = Boolean(pinned[String(id)]);

	const [isSavingDefault, setIsSavingDefault] = useState(false);
	const [isSavingPin, setIsSavingPin] = useState(false);
	const [actionError, setActionError] = useState('');
	const [editingEntry, setEditingEntry] = useState(null);

	const { location: userLocation } = useUserLocation(true);

	// ------------------------------------------------------------
	// Load garden + journal entries
	// ------------------------------------------------------------
	const loadGardenPage = useCallback(async () => {
		setIsLoading(true);
		setLoadError('');

		try {
			const [gardenData, journalData] = await Promise.all([
				api.get(`/api/gardens/${id}/`),
				api.get(`/api/journal/?garden=${id}`),
			]);

			setGarden(gardenData || null);
			setJournalEntries(normalizeCollection(journalData));
		} catch (error) {
			setLoadError(
				getErrorMessage(error, 'Unable to load this garden right now.'),
			);
		} finally {
			setIsLoading(false);
		}
	}, [id]);

	useEffect(() => {
		if (!gardenLoading) loadGardenPage();
	}, [id, gardenLoading]);

	// ------------------------------------------------------------
	// Sorted journal entries
	// ------------------------------------------------------------
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
	// Navigation handlers
	// ------------------------------------------------------------
	const handleLogJournal = useCallback(() => {
		navigate(`/journal?gardenId=${id}&returnTo=/gardens/${id}`);
	}, [id, navigate]);

	// ------------------------------------------------------------
	// Pin / Unpin
	// ------------------------------------------------------------
	const handleTogglePin = useCallback(async () => {
		setIsSavingPin(true);
		setActionError('');

		try {
			if (!isPinned) {
				const result = await api.post(`/api/gardens/${id}/pin/`, {});
				setPinned({
					...pinned,
					[String(result.garden.id)]: result,
				});
			} else {
				await api.del(`/api/gardens/${id}/unpin/`);
				const updated = { ...pinned };
				delete updated[String(id)];
				setPinned(updated);
			}
		} catch (error) {
			setActionError(
				getErrorMessage(error, 'Unable to update the pinned state.'),
			);
		} finally {
			setIsSavingPin(false);
		}
	}, [id, isPinned, pinned, setPinned]);

	// ------------------------------------------------------------
	// Set Default Garden
	// ------------------------------------------------------------
	async function handleSetDefault() {
		setIsSavingDefault(true);
		setActionError('');

		try {
			if (isDefault) {
				await api.post('/api/gardens/default/', { garden_id: null });
				setDefaultGarden(null);
			} else {
				await api.post('/api/gardens/default/', { garden_id: Number(id) });
				const fullGarden = await api.get(`/api/gardens/${id}/`);
				setDefaultGarden(fullGarden);
			}
		} catch (error) {
			setActionError(
				getErrorMessage(error, 'Unable to update default garden.'),
			);
		} finally {
			setIsSavingDefault(false);
		}
	}

	// ------------------------------------------------------------
	// Render states
	// ------------------------------------------------------------
	if (gardenLoading || isLoading) {
		return (
			<div className='page-wrapper view-one-garden-page'>
				<div className='journal-state-card'>
					<p>Loading garden details...</p>
				</div>
			</div>
		);
	}

	if (loadError) {
		return (
			<div className='page-wrapper view-one-garden-page'>
				<p className='journal-feedback error'>{loadError}</p>
			</div>
		);
	}

	if (!garden) {
		return (
			<div className='page-wrapper view-one-garden-page'>
				<div className='journal-state-card'>
					<h1 className='journal-title'>Garden not found</h1>
					<p>This garden could not be loaded.</p>
				</div>
			</div>
		);
	}

	// ------------------------------------------------------------
	// MAIN RENDER — CLEAN VERSION (NO BEEHOUSES)
	// ------------------------------------------------------------
	return (
		<div className='page-wrapper view-one-garden-page'>
			<header className='view-one-garden-page__header'>
				<div className='view-one-garden-page__left'>
					<h1>{garden.name || 'Unnamed Garden'}</h1>

					<p className='view-one-garden-page__location'>
						{formatLocation(garden)}
					</p>

					<p className='view-one-garden-page__timestamps'>
						Created {formatTimestamp(garden.created_at)} | Updated{' '}
						{formatTimestamp(garden.updated_at)}
					</p>

					<div className='view-one-garden-page__actions'>
						<button
							className='button button-primary'
							onClick={handleLogJournal}>
							Log Journal Entry
						</button>

						<button
							className='button button-secondary'
							onClick={handleSetDefault}
							disabled={isSavingDefault}>
							{isSavingDefault
								? 'Saving...'
								: isDefault
									? 'Clear Default'
									: 'Set as Default Garden'}
						</button>

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
				</div>

				<div className='view-one-garden-page__right'>
					<div className='view-one-garden-page__badges'>
						{isDefault && (
							<span className='my-garden-card__badge my-garden-card__badge--default'>
								Default
							</span>
						)}

						{isPinned && (
							<span className='my-garden-card__badge my-garden-card__badge--pinned'>
								Pinned
							</span>
						)}
					</div>
				</div>
			</header>

			{actionError && <p className='journal-feedback error'>{actionError}</p>}

			<section className='section view-one-garden-page__map'>
				<h2 className='section-title'>Map</h2>
				<SingleGardenMap garden={garden} userLocation={userLocation} />
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
										onClick={() => setEditingEntry(entry)}>
										Edit
									</button>
								</div>

								{/* INLINE EDIT FORM */}
								{editingEntry?.id === entry.id && (
									<div className='inline-edit-container'>
										<JournalEntryForm
											isOpen={true}
											entry={editingEntry}
											onClose={() => setEditingEntry(null)}
											onSubmitSuccess={async () => {
												await loadGardenPage(); // reload entries
												setEditingEntry(null);
											}}
										/>
									</div>
								)}
							</article>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
