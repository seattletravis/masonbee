import './Dashboard.css';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../auth/AuthProvider';

function Dashboard() {
	const { defaultGarden, hasPinnedGardens } = useAuthContext();

	return (
		<div className='dashboard page-wrapper'>
			<header className='dashboard-header'>
				<h1 className='dashboard-title'>Dashboard</h1>
				<p className='dashboard-subtitle'>
					Welcome back — here’s what’s happening in your garden.
				</p>
			</header>

			<div className='dashboard-grid'>
				{/* Mason Bee Finder */}
				<Link to='/finder' className='dashboard-card dashboard-card-link'>
					<h2 className='card-title'>MasonBee Finder</h2>
					<p className='card-text'>
						Check your location’s likelihood of finding and supporting
						masonbees. Check other locations as well.
					</p>
				</Link>
				{/* Bee Awakening Forecast (Weather replacement) */}
				<Link to='/forecasting' className='dashboard-card dashboard-card-link'>
					<h2 className='card-title'>MasonBee Forecast</h2>
					<p className='card-text'>
						See when masonbees emerge, become inactive, and when to handle
						cocoons. Check any location.
					</p>
				</Link>

				{/* My Beehouses */}
				<Link to='/beehouse' className='dashboard-card dashboard-card-link'>
					<h2 className='card-title'>My Beehouses</h2>
					<p className='card-text'>
						Add and manage your beehouses, add notes, and track important
						changes.
					</p>
				</Link>

				{/* My Gardens */}
				<Link to='/my-gardens' className='dashboard-card dashboard-card-link'>
					<h2 className='card-title'>My Gardens</h2>
					<p className='card-text'>
						View your default and pinned community gardens all in one page.
						Discussion boards are coming soon for a community garden near you!
					</p>
				</Link>

				{/* My Journal */}
				<Link to='/journal' className='dashboard-card dashboard-card-link'>
					<h2 className='card-title'>My Journal</h2>
					<p className='card-text'>
						Record observations, blooms, weather notes, and bee activity. Keep
						records that help you become a better bee keeper.
					</p>
				</Link>

				{/* My Journal */}
				<Link
					to='/garden-finder'
					className='dashboard-card dashboard-card-link'>
					<h2 className='card-title'>Garden Finder</h2>
					<p className='card-text'>
						Search through our database of Community Gardens and public areas
						suitable for spotting masonbees.
					</p>
				</Link>

				{/* Bee Resources */}
				<Link to='/resources' className='dashboard-card dashboard-card-link'>
					<h2 className='card-title'>Bee Resources</h2>
					<p className='card-text'>
						Guides, plant lists, and how‑to articles for supporting mason bees.
					</p>
				</Link>
			</div>
		</div>
	);
}

export default Dashboard;
