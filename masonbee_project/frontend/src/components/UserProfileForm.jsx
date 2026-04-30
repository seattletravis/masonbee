import { useEffect, useState } from 'react';
import * as api from '../api/client';
import './UserProfileForm.css';

function UserProfileForm({ isOpen, onClose }) {
	const [formData, setFormData] = useState({
		display_name: '',
		bio: '',
		friend_request_notifications: true,
	});

	const [avatarPreview, setAvatarPreview] = useState(null);
	const [avatarFile, setAvatarFile] = useState(null);

	useEffect(() => {
		if (!isOpen) return;

		async function loadProfile() {
			try {
				const data = await api.get('/api/profile/');
				setFormData({
					display_name: data.display_name || '',
					bio: data.bio || '',
					friend_request_notifications: data.friend_request_notifications,
				});
				setAvatarPreview(data.avatar || null);
			} catch (err) {
				console.error('Failed to load profile', err);
			}
		}

		loadProfile();
	}, [isOpen]);

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value,
		}));
	};

	const handleAvatarChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			setAvatarFile(file);
			setAvatarPreview(URL.createObjectURL(file));
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		try {
			// Update profile fields
			await api.put('/api/profile/', formData);

			// Upload avatar if selected
			if (avatarFile) {
				const form = new FormData();
				form.append('avatar', avatarFile);
				await api.post('/api/profile/avatar/', form, true);
			}

			onClose();
		} catch (err) {
			console.error('Profile update failed', err);
		}
	};

	if (!isOpen) return null;

	return (
		<div className='profile-form-modal'>
			<div className='profile-form-container'>
				<h2>Edit Profile</h2>

				<form onSubmit={handleSubmit}>
					<label>
						Display Name
						<input
							type='text'
							name='display_name'
							value={formData.display_name}
							onChange={handleChange}
						/>
					</label>

					<label>
						Bio
						<textarea name='bio' value={formData.bio} onChange={handleChange} />
					</label>

					<div className='profile-form-buttons'>
						<button type='button' className='cancel-btn' onClick={onClose}>
							Cancel
						</button>
						<button type='submit' className='save-btn'>
							Save Changes
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

export default UserProfileForm;
