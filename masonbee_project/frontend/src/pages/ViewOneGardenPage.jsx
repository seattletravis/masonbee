import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as api from '../api/client';
import { useAuthContext } from '../auth/AuthProvider';
import SingleGardenMap from '../components/SingleGardenMap';
import useUserLocation from '../hooks/useUserLocation';
import GardenMetadata from '../components/GardenMetadata';
import BeehouseEntryForm from '../components/BeehouseEntryForm';
import BeeNotesEntryForm from '../components/BeeNotesEntryForm';
import './ViewOneGardenPage.css';
import './PageWrapperGlobal.css';
import BeehouseNotesList from '../components/BeehouseNotesList';

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

// function formatBeehouseStatus(b) {
// 	return b?.status || b?.state || 'Not listed';
// }

function formatBeehouseBiologicalStatus(b) {
	switch (b.beehouse_status) {
		case 'active':
			return 'Active bees present';
		case 'cocoons':
			return 'Will be loaded with cocoons';
		default:
			return 'Inactive';
	}
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
	const [editingNote, setEditingNote] = useState(null);
	const handleEditNote = (note) => {
		lastScrollYRef.current = window.scrollY; // ⭐ capture scroll position
		setEditingNote(note);
		setShowBeeNotesForm(true);
	};

	const [openNotesFor, setOpenNotesFor] = useState(null);

	const toggleNotes = (id) => {
		setOpenNotesFor(openNotesFor === id ? null : id);
	};

	const lastScrollYRef = useRef(0);

	const { id } = useParams();
	const navigate = useNavigate();
	const formRef = useRef(null);

	// ⭐ AuthProvider global state
	const { defaultGarden, setDefaultGarden, pinned, setPinned, gardenLoading } =
		useAuthContext();

	// ⭐ Local UI state
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState('');
	const [garden, setGarden] = useState(null);
	const [beehouses, setBeehouses] = useState([]);
	const [journalEntries, setJournalEntries] = useState([]);
	const isDefault = defaultGarden?.id === Number(id);
	const isPinned = Boolean(pinned[String(id)]);

	const [isSavingDefault, setIsSavingDefault] = useState(false);
	const [isSavingPin, setIsSavingPin] = useState(false);
	const [actionError, setActionError] = useState('');

	const { location: userLocation } = useUserLocation(true);
	const [showBeehouseForm, setShowBeehouseForm] = useState(false);
	const [showBeeNotesForm, setShowBeeNotesForm] = useState(false);
	const [showBeehouseList, setShowBeehouseList] = useState(false);
	const [editingBeehouse, setEditingBeehouse] = useState(null);
	const formIsOpen = showBeehouseForm || showBeeNotesForm;

	useEffect(() => {
		if ((showBeehouseForm || showBeeNotesForm) && formRef.current) {
			const y =
				formRef.current.getBoundingClientRect().top + window.scrollY - 20;

			window.scrollTo({ top: y, behavior: 'smooth' });
		}
	}, [showBeehouseForm, showBeeNotesForm]);

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

	const handleAddBeehouse = () => {
		lastScrollYRef.current = window.scrollY; // ⭐ remember where user was
		setEditingBeehouse(null);
		setShowBeehouseForm(true);

		setTimeout(() => {
			formRef.current?.scrollIntoView({
				behavior: 'smooth',
				block: 'start',
			});
		}, 50);
	};

	const handleEditBeehouse = useCallback((beehouse) => {
		lastScrollYRef.current = window.scrollY; // ⭐ remember where user was
		setEditingBeehouse(beehouse); // load existing data
		setShowBeehouseForm(true); // open the form
		// ⭐ Scroll to the form anchor
		setTimeout(() => {
			formRef.current?.scrollIntoView({
				behavior: 'smooth',
				block: 'start',
			});
		}, 50);
	}, []);

	// ------------------------------------------------------------
	// ⭐ Pin / Unpin
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
	// ⭐ Set Default Garden (Option B)
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
	// ⭐ Render states
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
	// ⭐ Main Render
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

					{/* BUTTONS STAY ON THE LEFT */}
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
			<section className='section view-one-garden-page__beehouses'>
				{/* Header */}
				<div className='section-header'>
					<div className='section-header-left'>
						<h2 className='section-title'>Beehouses</h2>

						<button
							className='collapse-toggle'
							onClick={() => setShowBeehouseList((prev) => !prev)}>
							{showBeehouseList
								? 'Hide Beehouses List'
								: 'Expand My Beehouses List'}
						</button>
					</div>

					<div className='section-header-actions'>
						{/* Add Beehouse button — hidden when ANY form is open */}
						{!showBeehouseForm && !showBeeNotesForm && (
							<button
								className='button button-small'
								onClick={handleAddBeehouse}>
								Add Beehouse
							</button>
						)}

						{/* Add Bee Note button — hidden when ANY form is open */}
						{!showBeehouseForm && !showBeeNotesForm && (
							<button
								className='button button-small'
								onClick={() => {
									lastScrollYRef.current = window.scrollY; // ⭐ capture scroll position
									setEditingNote(null); // ensure fresh note
									setShowBeeNotesForm(true); // open the form
								}}>
								Add Bee Note
							</button>
						)}
					</div>
				</div>

				{/* Description (moved OUT of header for proper layout) */}
				<p className='section-description'>
					All beehouse locations entered here are private and only you can see
					them. The data is used to predict mason bee scores for the "Mason Bee
					Finder" page.
				</p>

				{/* Bee Notes Entry Form */}
				<div ref={formRef}>
					{showBeeNotesForm && (
						<BeeNotesEntryForm
							gardenId={id}
							beehouses={beehouses}
							editingNote={editingNote}
							onCreated={async () => {
								await loadGardenPage();
								setShowBeeNotesForm(false);
								setEditingNote(null);
							}}
							onClose={() => {
								setShowBeeNotesForm(false);
								setEditingNote(null);

								setTimeout(() => {
									window.scrollTo({
										top: lastScrollYRef.current || 0,
										behavior: 'smooth',
									});
								}, 50);
							}}
						/>
					)}

					{/* Beehouse Entry Form */}
					{showBeehouseForm && (
						<BeehouseEntryForm
							onClose={() => {
								setShowBeehouseForm(false);
								setEditingBeehouse(null);

								// ⭐ Scroll back to the anchor
								setTimeout(() => {
									window.scrollTo({
										top: lastScrollYRef.current || 0,
										behavior: 'smooth',
									});
								}, 50);
							}}
							gardenId={id}
							editingBeehouse={editingBeehouse}
							onCreated={async () => {
								await loadGardenPage();
								setShowBeehouseForm(false);
								setEditingBeehouse(null);

								// ⭐ Scroll back to the anchor
								setTimeout(() => {
									window.scrollTo({
										top: lastScrollYRef.current || 0,
										behavior: 'smooth',
									});
								}, 50);
							}}
						/>
					)}
				</div>

				{/* Collapsible Beehouse List - BEEHOUSE CARD HERE */}
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
											<h3 className='journal-card-title'>{b.name}</h3>
											{b.garden_description && (
												<p className='journal-card-subtitle'>
													{b.garden_description}
												</p>
											)}
										</div>
									</div>

									<p>
										<strong>Type:</strong> {formatBeehouseType(b)}
									</p>
									<p>
										<strong>Bee Status:</strong>{' '}
										{formatBeehouseBiologicalStatus(b)}
									</p>

									<div className='journal-card-actions'>
										<button
											className='journal-button journal-button-secondary'
											disabled={formIsOpen}
											onClick={() => !formIsOpen && handleEditBeehouse(b)}>
											Edit
										</button>

										{/* ⭐ Show Notes button — only if this beehouse has notes */}
										{b.event_count > 0 && (
											<button
												className='journal-button journal-button-secondary'
												disabled={formIsOpen}
												onClick={() => !formIsOpen && toggleNotes(b.id)}>
												{openNotesFor === b.id
													? `Hide Notes (${b.event_count})`
													: `Show Notes (${b.event_count})`}
											</button>
										)}
									</div>

									{/* ⭐ Collapsible Notes Section */}
									{openNotesFor === b.id && (
										<BeehouseNotesList
											beehouseId={b.id}
											onEditNote={handleEditNote}
											formIsOpen={formIsOpen}
										/>
									)}
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
										Edit
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
