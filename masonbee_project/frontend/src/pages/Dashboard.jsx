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
				{/* My Gardens */}
				<Link to='/my-gardens' className='dashboard-card dashboard-card-link'>
					<h2 className='card-title'>My Gardens</h2>
					<p className='card-text'>
						View and manage your mason bee gardens, houses, and locations.
					</p>
				</Link>

				{/* My Journal */}
				<Link to='/journal' className='dashboard-card dashboard-card-link'>
					<h2 className='card-title'>My Journal</h2>
					<p className='card-text'>
						Record observations, blooms, weather notes, and bee activity.
					</p>
				</Link>

				{/* Bee Awakening Forecast (Weather replacement) */}
				<Link to='/forecasting' className='dashboard-card dashboard-card-link'>
					<h2 className='card-title'>Mason Bee Forecast</h2>
					<p className='card-text'>
						See when mason bees emerge, become inactive, and when to handle
						cocoons.
					</p>
				</Link>

				{/* Mason Bee Finder */}
				<Link to='/finder' className='dashboard-card dashboard-card-link'>
					<h2 className='card-title'>Mason Bee Finder</h2>
					<p className='card-text'>
						Check your location’s likelihood of finding and supporting mason
						bees.
					</p>
				</Link>

				{/* Bee Resources */}
				<Link to='/resources' className='dashboard-card dashboard-card-link'>
					<h2 className='card-title'>Bee Resources</h2>
					<p className='card-text'>
						Guides, plant lists, and how‑to articles for supporting mason bees.
					</p>
				</Link>

				{/* Seasonal Insights (Coming Soon) */}
			</div>
		</div>
	);
}

export default Dashboard;
