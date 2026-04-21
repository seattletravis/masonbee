import { useEffect, useState } from 'react';
import * as api from '../api/client';
import UserProfileForm from '../components/UserProfileForm';
import './MyProfilePage.css';
import './PageWrapperGlobal.css';

function MyProfilePage() {
	const [profile, setProfile] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [isFormOpen, setIsFormOpen] = useState(false);

	useEffect(() => {
		let mounted = true;

		async function loadProfile() {
			setLoading(true);
			setError('');

			try {
				const data = await api.get('/api/profile/');
				if (mounted) setProfile(data);
			} catch (err) {
				if (mounted) setError('Unable to load profile.');
			} finally {
				if (mounted) setLoading(false);
			}
		}

		loadProfile();
		return () => (mounted = false);
	}, []);

	const handleProfileUpdated = () => {
		// Reload profile after saving
		api.get('/api/profile/').then(setProfile);
	};

	return (
		<div className='page-wrapper profile-page'>
			<div className='profile-page-header'>
				<h1>My Profile</h1>
				<p>Manage your account details and preferences.</p>
			</div>

			{loading ? (
				<p>Loading…</p>
			) : error ? (
				<p className='profile-page-error'>{error}</p>
			) : (
				<div className='profile-card'>
					<h2 className='profile-name'>
						{profile.display_name || 'No display name set'}
					</h2>

					<p className='profile-bio'>{profile.bio || 'No bio added yet.'}</p>

					<div className='profile-details'>
						<p>
							<strong>Friend Request Notifications:</strong>{' '}
							{profile.friend_request_notifications ? 'On' : 'Off'}
						</p>
					</div>

					<button
						className='profile-edit-button'
						onClick={() => setIsFormOpen(true)}>
						Edit Profile
					</button>
				</div>
			)}

			<UserProfileForm
				isOpen={isFormOpen}
				onClose={() => {
					setIsFormOpen(false);
					handleProfileUpdated();
				}}
			/>
		</div>
	);
}

export default MyProfilePage;
