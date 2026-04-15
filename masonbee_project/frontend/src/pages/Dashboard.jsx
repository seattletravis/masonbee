import './Dashboard.css';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../auth/AuthProvider';

function Dashboard() {
	const { defaultGarden, hasPinnedGardens } = useAuthContext();

	const showMyGardensCard = Boolean(defaultGarden) || Boolean(hasPinnedGardens);

	return (
		<div className='dashboard page'>
			<header className='dashboard-header'>
				<h1 className='dashboard-title'>Dashboard</h1>
				<p className='dashboard-subtitle'>
					Welcome back — here’s what’s happening in your garden.
				</p>
			</header>

			<div className='dashboard-grid'>
				{showMyGardensCard && (
					<Link to='/my-gardens' className='dashboard-card dashboard-card-link'>
						<h2 className='card-title'>My Gardens</h2>
						<p className='card-text'>
							View and manage your mason bee gardens, houses, and locations.
						</p>
					</Link>
				)}

				<div className='dashboard-card'>
					<h2 className='card-title'>Recent Activity</h2>
					<p className='card-text'>
						Track bee house events, lifecycle updates, and seasonal changes.
					</p>
				</div>

				<div className='dashboard-card'>
					<h2 className='card-title'>Seasonal Insights</h2>
					<p className='card-text'>
						See what’s happening this season and what to prepare for next.
					</p>
				</div>

				<div className='dashboard-card'>
					<h2 className='card-title'>Weather & Conditions</h2>
					<p className='card-text'>
						Local weather patterns that influence mason bee activity.
					</p>
				</div>

				<div className='dashboard-card'>
					<h2 className='card-title'>Photos & Notes</h2>
					<p className='card-text'>
						Upload observations, track changes, and document your garden.
					</p>
				</div>

				<div className='dashboard-card'>
					<h2 className='card-title'>Analytics</h2>
					<p className='card-text'>
						Data visualizations and trends from your garden’s activity.
					</p>
				</div>

				<Link to='/journal' className='dashboard-card dashboard-card-link'>
					<h2 className='card-title'>My Journal</h2>
					<p className='card-text'>
						Record observations, blooms, weather notes, and bee activity.
					</p>
				</Link>
			</div>
		</div>
	);
}

export default Dashboard;
