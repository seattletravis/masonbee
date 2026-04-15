import { Link, useNavigate } from 'react-router-dom';
import MyGardenCard from '../components/MyGardenCard';
import { useAuthContext } from '../auth/AuthProvider';
import './MyGardensPage.css';

function MyGardensPage() {
	const navigate = useNavigate();
	const {
		defaultGarden,
		setDefaultGarden,
		pinned,
		hasPinnedGardens,
		isAuthenticated,
	} = useAuthContext();

	// Normalize pinned gardens (AuthProvider already ensures clean shape)
	const pinnedGardens = Object.values(pinned || {}).map(
		(record) => record.garden,
	);

	const defaultGardenId = defaultGarden?.id;
	const pinnedGardensWithoutDefault = pinnedGardens.filter(
		(g) => g.id !== defaultGardenId,
	);

	const showEmptyState =
		!defaultGarden && pinnedGardensWithoutDefault.length === 0;

	const handleViewGarden = (garden) => {
		navigate(`/garden/${garden.id}`);
	};

	const handleLogJournal = (garden) => {
		navigate(`/journal/new?gardenId=${garden.id}`);
	};

	const handleAddBeeNotes = (garden) => {
		navigate(`/beehouse-notes/new?gardenId=${garden.id}`);
	};

	const handleSetDefault = (garden) => {
		setDefaultGarden(garden);
	};

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

			{defaultGarden && (
				<section className='my-gardens-page__hero'>
					<h2 className='section-title'>Default Garden</h2>
					<MyGardenCard
						garden={defaultGarden}
						isDefault
						isPinned={Boolean(pinned[defaultGardenId])}
						onViewGarden={handleViewGarden}
						onLogJournal={handleLogJournal}
						onAddBeeNotes={handleAddBeeNotes}
						onSetDefault={handleSetDefault}
					/>
				</section>
			)}

			{pinnedGardensWithoutDefault.length > 0 && (
				<section className='my-gardens-page__pinned'>
					<h2 className='section-title'>Pinned Gardens</h2>
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
							/>
						))}
					</div>
				</section>
			)}

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

			<div className='my-gardens-page__browse'>
				<Link to='/garden-finder' className='my-gardens-page__browse-link'>
					<span className='button button-secondary'>Browse More Gardens</span>
				</Link>
			</div>
		</div>
	);
}

export default MyGardensPage;
