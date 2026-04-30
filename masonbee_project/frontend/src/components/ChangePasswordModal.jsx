import { useState } from 'react';
import * as api from '../api/client';
import './ChangePasswordModal.css';

function ChangePasswordModal({ isOpen, onClose }) {
	const [oldPassword, setOldPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	if (!isOpen) return null;

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setSuccess('');

		if (newPassword !== confirmPassword) {
			setError('New passwords do not match');
			return;
		}

		try {
			await api.post('/api/change-password/', {
				old_password: oldPassword,
				new_password: newPassword,
			});

			setSuccess('Password updated successfully');
			setTimeout(() => {
				onClose();
			}, 800);
		} catch (err) {
			setError(err.response?.data?.error || 'Failed to update password');
		}
	};

	return (
		<div className='password-modal-backdrop'>
			<div className='password-modal'>
				<h2>Change Password</h2>

				{error && <p className='password-error'>{error}</p>}
				{success && <p className='password-success'>{success}</p>}

				<form onSubmit={handleSubmit}>
					<label>
						Current Password
						<input
							type='password'
							value={oldPassword}
							onChange={(e) => setOldPassword(e.target.value)}
							required
						/>
					</label>

					<label>
						New Password
						<input
							type='password'
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							required
						/>
					</label>

					<label>
						Confirm New Password
						<input
							type='password'
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
						/>
					</label>

					<div className='password-buttons'>
						<button type='button' className='cancel-btn' onClick={onClose}>
							Cancel
						</button>
						<button type='submit' className='save-btn'>
							Update Password
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

export default ChangePasswordModal;
