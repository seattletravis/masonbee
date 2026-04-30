import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MyGardenCard from '../components/MyGardenCard';
import { useAuthContext } from '../auth/AuthProvider';
import { get } from '../api/client';
import './MyGardensPage.css';
import './PageWrapperGlobal.css';
import { pinGarden, unpinGarden, setDefaultGardenAPI } from '../api/gardens';

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
		hydrating,
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

	const handleSetDefault = async (garden) => {
		// CLEAR DEFAULT
		if (garden === null) {
			await setDefaultGardenAPI(null);
			setDefaultGarden(null);
			return;
		}

		// SET DEFAULT
		await setDefaultGardenAPI(garden.id);
		setDefaultGarden(garden);

		// Ensure default is pinned locally
		const updated = { ...pinned };
		if (!updated[garden.id]) {
			updated[garden.id] = { garden };
		}
		setPinned(updated);
	};

	const handleTogglePin = async (garden) => {
		const id = String(garden.id);

		if (pinned[id]) {
			await unpinGarden(id);

			const updated = { ...pinned };
			delete updated[id];
			setPinned(updated);
			return;
		}

		const record = await pinGarden(id);
		setPinned({ ...pinned, [id]: record });
	};

	useEffect(() => {
		async function hydrate() {
			// 1. Hydrate default garden
			if (defaultGarden?.id) {
				const full = await get(`/api/gardens/${defaultGarden.id}/`);
				if (full) setDefaultGarden(full);
			}

			// 2. Hydrate pinned gardens immutably
			const updatedPinned = {};

			for (const key of Object.keys(pinned)) {
				const record = pinned[key];
				const g = record?.garden;

				if (g?.id) {
					const full = await get(`/api/gardens/${g.id}/`);
					updatedPinned[key] = { garden: full || g };
				} else {
					updatedPinned[key] = record;
				}
			}

			setPinned(updatedPinned);
		}

		hydrate();
	}, [defaultGarden?.id, Object.keys(pinned).join(',')]);

	useEffect(() => {
		if (!hydrating && !isAuthenticated) {
			navigate('/login');
		}
	}, [hydrating, isAuthenticated, navigate]);

	return (
		<div className='page-wrapper my-gardens-page'>
			<header className='page-header'>
				<div>
					<h1>My Gardens</h1>
					<p>
						Keep your go-to garden close, jump into your journal, and add bee
						notes without leaving this page.
					</p>
				</div>
			</header>
			{hydrating && <p className='my-gardens-loading'>Loading your gardens…</p>}

			{!hydrating && (
				<>
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
						<section className='my-gardens-empty-state'>
							<h2 className='section-title'>No saved gardens yet</h2>
							<p>
								{isAuthenticated
									? 'Browse gardens to pin your favorites or choose a default garden.'
									: 'Sign in and browse gardens to start building your garden list.'}
							</p>
							<Link
								to='/garden-finder'
								className='button button-primary find-garden-button'>
								Find a Garden
							</Link>
						</section>
					)}
				</>
			)}
		</div>
	);
}

export default MyGardensPage;
