import { Link } from 'react-router-dom';
import PublicHeader from '../layout/PublicHeader';
import './LandingPage.css';
import './Login.css';

export default function LandingPage() {
	return (
		<div className='landing-wrapper'>
			{/* Public Header at the top */}
			<PublicHeader />

			{/* Center card (same style as login) */}
			<div className='login-container landing-container'>
				<div className='landing-features'>
					<ul className='landing-feature-list'>
						<li>
							<strong>Bee Prediction & Forecasting</strong> — Know when your
							mason bees will awaken based on temperature trends.
						</li>
						<li>
							<strong>Beehouse Manager</strong> — Track your beehouses,
							emergence, maintenance, and seasonal activity.
						</li>
						<li>
							<strong>Journal & Notes</strong> — Log bloom cycles, bee
							sightings, weather notes, and garden observations.
						</li>
						<li>
							<strong>Community Gardens Manager</strong> — Stay connected with
							your local gardens and keep your favorites pinned.
						</li>
					</ul>
				</div>

				<div className='landing-cta'>
					<Link to='/register' className='login-button landing-register-btn'>
						Create Your Free Account
					</Link>

					<p className='login-footer landing-login-footer'>
						Already registered? <Link to='/login'>Log in</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
