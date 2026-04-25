// src/pages/BeehousePage.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as api from '../api/client';
import BeehouseEntryForm from '../components/BeehouseEntryForm';
import BeeNotesEntryForm from '../components/BeeNotesEntryForm';
import BeehouseNotesList from '../components/BeehouseNotesList';
import MapPinModal from '../components/MapPinModal';
import './BeehousePage.css';
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

export default function BeehousePage() {
	const [beehouses, setBeehouses] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState('');

	const [showBeehouseForm, setShowBeehouseForm] = useState(true);
	const [isBeehouseFormCollapsed, setIsBeehouseFormCollapsed] = useState(true);
	const [editingBeehouse, setEditingBeehouse] = useState(null);

	const [showBeeNotesForm, setShowBeeNotesForm] = useState(false);
	const [editingNote, setEditingNote] = useState(null);
	const [openNotesFor, setOpenNotesFor] = useState(null);

	const [showMapModal, setShowMapModal] = useState(false);
	const [pendingLatLonSetter, setPendingLatLonSetter] = useState(null);

	const lastScrollYRef = useRef(0);
	const formRef = useRef(null);

	const formIsOpen =
		(showBeehouseForm && !isBeehouseFormCollapsed) || showBeeNotesForm;

	const loadBeehouses = useCallback(async () => {
		setIsLoading(true);
		setLoadError('');

		try {
			const data = await api.get('/api/beehouses/');
			setBeehouses(normalizeCollection(data));
		} catch (error) {
			setLoadError(
				getErrorMessage(error, 'Unable to load your beehouses right now.'),
			);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadBeehouses();
	}, [loadBeehouses]);

	const sortedBeehouses = useMemo(
		() =>
			[...beehouses].sort((a, b) =>
				String(a?.name || '').localeCompare(String(b?.name || '')),
			),
		[beehouses],
	);

	const toggleNotes = (id) => {
		setOpenNotesFor((prev) => (prev === id ? null : id));
	};

	const handleEditNote = (note) => {
		lastScrollYRef.current = window.scrollY;
		setEditingNote(note);
		setShowBeeNotesForm(true);

		setTimeout(() => {
			formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}, 50);
	};

	const handleAddBeehouse = () => {
		lastScrollYRef.current = window.scrollY;
		setEditingBeehouse(null);
		setShowBeehouseForm(true);
		setIsBeehouseFormCollapsed(false);

		setTimeout(() => {
			formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}, 50);
	};

	const handleEditBeehouse = useCallback((beehouse) => {
		lastScrollYRef.current = window.scrollY;
		setEditingBeehouse(beehouse);
		setShowBeehouseForm(true);
		setIsBeehouseFormCollapsed(false);

		setTimeout(() => {
			formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}, 50);
	}, []);

	// ⭐ NEW — Remove Beehouse
	function handleRemoveBeehouse(beehouse) {
		lastScrollYRef.current = window.scrollY;

		setEditingNote({
			beehouse: beehouse.id,
			event_type: 'destroyed',
			notes: '',
		});

		setShowBeeNotesForm(true);

		setTimeout(() => {
			formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}, 50);
	}

	const openMapPicker = (setLatLon) => {
		setPendingLatLonSetter(() => setLatLon);
		setShowMapModal(true);
	};

	const handleMapSelect = (lat, lon) => {
		if (pendingLatLonSetter) pendingLatLonSetter(lat, lon);
		setShowMapModal(false);
	};

	if (isLoading) {
		return (
			<div className='page-wrapper beehouse-page'>
				<div className='journal-state-card'>
					<p>Loading your beehouses...</p>
				</div>
			</div>
		);
	}

	if (loadError) {
		return (
			<div className='page-wrapper beehouse-page'>
				<p className='journal-feedback error'>{loadError}</p>
			</div>
		);
	}

	return (
		<div className='page-wrapper beehouse-page'>
			<header className='beehouse-page__header'>
				<div>
					<h1>My Beehouses</h1>
					<p className='beehouse-page__subtitle'>
						Manage your private beehouses, update their details, and track notes
						and seasonal events.
					</p>
				</div>
			</header>

			<section className='section beehouse-page__forms' ref={formRef}>
				<div className='beehouse-page__forms-inner'>
					<BeehouseEntryForm
						editingBeehouse={editingBeehouse}
						onCreated={async () => {
							await loadBeehouses();
							setEditingBeehouse(null);
							setIsBeehouseFormCollapsed(true);

							setTimeout(() => {
								window.scrollTo({
									top: lastScrollYRef.current || 0,
									behavior: 'smooth',
								});
							}, 50);
						}}
						onClose={() => {
							setEditingBeehouse(null);
							setIsBeehouseFormCollapsed(true);

							setTimeout(() => {
								window.scrollTo({
									top: lastScrollYRef.current || 0,
									behavior: 'smooth',
								});
							}, 50);
						}}
						onOpenMapPicker={openMapPicker}
						isCollapsed={isBeehouseFormCollapsed}
						setIsCollapsed={setIsBeehouseFormCollapsed}
					/>

					{showBeeNotesForm && (
						<div className='beehouse-page__form-card'>
							<h2 className='section-title'>
								{editingNote?.event_type === 'destroyed'
									? 'Remove Beehouse'
									: editingNote
										? 'Edit Bee Note'
										: 'Add Bee Note'}
							</h2>

							<BeeNotesEntryForm
								beehouses={beehouses}
								editingNote={editingNote}
								onCreated={async () => {
									// ⭐ If this was a destroy event, soft-delete the beehouse
									if (editingNote?.event_type === 'destroyed') {
										await api.patch(`/api/beehouses/${editingNote.beehouse}/`, {
											uninstall_date: new Date().toISOString().split('T')[0],
										});
									}

									await loadBeehouses();
									setShowBeeNotesForm(false);
									setEditingNote(null);

									setTimeout(() => {
										window.scrollTo({
											top: lastScrollYRef.current || 0,
											behavior: 'smooth',
										});
									}, 50);
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
						</div>
					)}
				</div>
			</section>

			<section className='section beehouse-page__list'>
				<div className='section-header'>
					<h2 className='section-title'>Your Beehouses</h2>
					<p className='section-description'>
						Expand a beehouse to view or edit its notes.
					</p>
				</div>

				{sortedBeehouses.length === 0 ? (
					<div className='journal-state-card'>
						<p>You haven&apos;t added any beehouses yet.</p>
					</div>
				) : (
					<div className='journal-grid'>
						{sortedBeehouses.map((b) => (
							<article key={b.id} className='journal-card beehouse-card'>
								<div className='journal-card-top'>
									<h3 className='journal-card-title'>
										{b.name || 'Unnamed Beehouse'}
									</h3>

									<div className='beehouse-card__badges'>
										<span className='journal-category-badge'>
											{b.beehouse_type}
										</span>

										<button
											type='button'
											className='beehouse-card__notes-badge'
											disabled={formIsOpen}
											onClick={() => !formIsOpen && toggleNotes(b.id)}>
											{openNotesFor === b.id
												? `Hide Notes (${b.event_count})`
												: `Notes (${b.event_count})`}
										</button>
									</div>
								</div>

								<div className='journal-card-actions'>
									<button
										className='journal-button journal-button-secondary'
										disabled={formIsOpen}
										onClick={() => !formIsOpen && handleEditBeehouse(b)}>
										Edit Beehouse
									</button>

									<button
										className='journal-button journal-button-secondary'
										disabled={formIsOpen}
										onClick={() => {
											if (formIsOpen) return;
											lastScrollYRef.current = window.scrollY;
											setEditingNote(null);
											setShowBeeNotesForm(true);

											setTimeout(() => {
												formRef.current?.scrollIntoView({
													behavior: 'smooth',
													block: 'start',
												});
											}, 50);
										}}>
										Add Bee Note
									</button>

									{/* ⭐ NEW — Remove Beehouse */}
									<button
										className='journal-button journal-button-danger'
										disabled={formIsOpen}
										onClick={() => handleRemoveBeehouse(b)}>
										Remove Beehouse
									</button>
								</div>

								{openNotesFor === b.id && (
									<div className='beehouse-card__notes'>
										<BeehouseNotesList
											beehouseId={b.id}
											onEditNote={handleEditNote}
											formIsOpen={formIsOpen}
										/>
									</div>
								)}
							</article>
						))}
					</div>
				)}
			</section>

			<MapPinModal
				isOpen={showMapModal}
				onClose={() => setShowMapModal(false)}
				onSelect={handleMapSelect}
			/>
		</div>
	);
}
