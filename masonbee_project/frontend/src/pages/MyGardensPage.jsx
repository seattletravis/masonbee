import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MyGardenCard from '../components/MyGardenCard';
import { useAuthContext } from '../auth/AuthProvider';
import { get } from '../api/client';
import './MyGardensPage.css';

function MyGardensPage() {
	const navigate = useNavigate();

	const [showJournalForm, setShowJournalForm] = useState(false);
	const [journalGardenId, setJournalGardenId] = useState(null);

	const {
		defaultGarden,
		setDefaultGarden,
		pinned,
		setPinned,
		hasPinnedGardens,
		isAuthenticated,
	} = useAuthContext();

	// Normalize pinned gardens (AuthProvider ensures clean shape)
	const pinnedGardens = Object.values(pinned || {}).map(
		(record) => record.garden,
	);

	const defaultGardenId = defaultGarden?.id;
	const pinnedGardensWithoutDefault = pinnedGardens.filter(
		(g) => g.id !== defaultGardenId,
	);

	const showEmptyState =
		!defaultGarden && pinnedGardensWithoutDefault.length === 0;

	// Handlers
	const handleViewGarden = (garden) => {
		navigate(`/gardens/${garden.id}`);
	};

	const handleLogJournal = (garden) => {
		navigate(`/journal?gardenId=${garden.id}&returnTo=/my-gardens`);
	};

	const handleAddBeeNotes = (garden) => {
		navigate(`/beehouse-notes/new?gardenId=${garden.id}`);
	};

	const handleSetDefault = (garden) => {
		setDefaultGarden(garden);
	};

	const handleTogglePin = (garden) => {
		const id = String(garden.id);
		const updated = { ...pinned };
		delete updated[id];
		setPinned(updated);
	};

	useEffect(() => {
		async function hydrate() {
			const updatedPinned = { ...pinned };

			// Hydrate default garden
			if (defaultGarden?.id) {
				const full = await get(`/api/gardens/${defaultGarden.id}/`);
				if (full) setDefaultGarden(full);
			}

			// Hydrate pinned gardens
			for (const key of Object.keys(updatedPinned)) {
				const g = updatedPinned[key]?.garden;
				if (g?.id) {
					const full = await get(`/api/gardens/${g.id}/`);
					if (full) {
						updatedPinned[key].garden = full;
					}
				}
			}

			setPinned(updatedPinned);
		}

		hydrate();
	}, [defaultGarden?.id, Object.keys(pinned).length]);

	useEffect(() => {
		if (!isAuthenticated) {
			navigate('/login');
		}
	}, [isAuthenticated, navigate]);

	return (
		<div className='page my-gardens-page'>
			<header className='page-header'>
				<div>
					<h1>My Gardens</h1>
					<p>
						Keep your go-to garden close, jump into your journal, and add bee
						notes without leaving this page.
					</p>
				</div>
			</header>

			{/* Default Garden */}
			{defaultGarden && (
				<section className='my-gardens-page__hero'>
					<h2 className='section-title'>My Default Garden</h2>
					<MyGardenCard
						garden={defaultGarden}
						isDefault
						isPinned={Boolean(pinned[defaultGardenId])}
						onViewGarden={handleViewGarden}
						onLogJournal={handleLogJournal}
						onAddBeeNotes={handleAddBeeNotes}
						onSetDefault={handleSetDefault}
						onTogglePin={handleTogglePin}
					/>
				</section>
			)}

			{/* Pinned Gardens */}
			{pinnedGardensWithoutDefault.length > 0 && (
				<section className='my-gardens-page__pinned'>
					<h2 className='section-title'>My Pinned Gardens</h2>
					<div className='my-gardens-page__grid'>
						{pinnedGardensWithoutDefault.map((garden) => (
							<MyGardenCard
								key={garden.id}
								garden={garden}
								isDefault={false}
								isPinned
								onViewGarden={handleViewGarden}
								onLogJournal={handleLogJournal}
								onAddBeeNotes={handleAddBeeNotes}
								onSetDefault={handleSetDefault}
								onTogglePin={handleTogglePin}
							/>
						))}
					</div>
				</section>
			)}

			{/* Empty State */}
			{showEmptyState && (
				<section className='my-gardens-page__empty'>
					<h2 className='section-title'>No saved gardens yet</h2>
					<p>
						{isAuthenticated
							? 'Browse gardens to pin your favorites or choose a default garden.'
							: 'Sign in and browse gardens to start building your garden list.'}
					</p>
					<Link to='/garden-finder' className='button button-primary'>
						Find a Garden
					</Link>
				</section>
			)}

			{/* Browse More */}
			<div className='my-gardens-page__browse'>
				<Link to='/garden-finder' className='my-gardens-page__browse-link'>
					<span className='button button-secondary'>Browse More Gardens</span>
				</Link>
			</div>
		</div>
	);
}

export default MyGardensPage;
