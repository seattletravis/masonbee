import './Dashboard.css';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../auth/AuthProvider';

function Dashboard() {
	const { defaultGarden, hasPinnedGardens } = useAuthContext();

	const showMyGardensCard = Boolean(defaultGarden) || Boolean(hasPinnedGardens);

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
				{showMyGardensCard && (
					<Link to='/my-gardens' className='dashboard-card dashboard-card-link'>
						<h2 className='card-title'>My Gardens</h2>
						<p className='card-text'>
							View and manage your mason bee gardens, houses, and locations.
						</p>
					</Link>
				)}

				{/* My Journal */}
				<Link to='/journal' className='dashboard-card dashboard-card-link'>
					<h2 className='card-title'>My Journal</h2>
					<p className='card-text'>
						Record observations, blooms, weather notes, and bee activity.
					</p>
				</Link>

				{/* Recent Activity */}
				<div className='dashboard-card'>
					<h2 className='card-title'>Recent Activity</h2>
					<p className='card-text'>
						Your latest garden updates, journal entries, and beehouse changes.
					</p>
				</div>

				{/* Bee Awakening Forecast (Weather replacement) */}
				<Link to='/forecasting' className='dashboard-card dashboard-card-link'>
					<h2 className='card-title'>Mason Bee Forecasting</h2>
					<p className='card-text'>
						See when mason bees emerge, become inactive, and when to handle
						cocoons.
					</p>
				</Link>

				{/* Mason Bee Finder */}
				<Link
					to='/masonbee-finder'
					className='dashboard-card dashboard-card-link'>
					<h2 className='card-title'>Mason Bee Finder</h2>
					<p className='card-text'>
						Check your location’s likelihood of supporting mason bees.
					</p>
				</Link>

				{/* Bee Resources */}
				<Link
					to='/bee-resources'
					className='dashboard-card dashboard-card-link'>
					<h2 className='card-title'>Bee Resources</h2>
					<p className='card-text'>
						Guides, tips, and trusted sources for mason bee care.
					</p>
				</Link>

				{/* Seasonal Insights (Coming Soon) */}
				<div className='dashboard-card dashboard-card-disabled'>
					<h2 className='card-title'>Seasonal Insights</h2>
					<p className='card-text'>
						Coming Soon — seasonal trends and guidance.
					</p>
				</div>
			</div>
		</div>
	);
}

export default Dashboard;
