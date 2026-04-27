import { useState } from 'react';
import { post, setTokens } from '../api/client';
import './Register.css';

export default function Register() {
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');

	async function handleSubmit(e) {
		e.preventDefault();
		setError('');

		const result = await post('/api/register/', {
			username,
			email,
			password,
		});

		if (!result || result.detail) {
			setError(result?.detail || 'Registration failed');
			return;
		}

		// Redirect to the check email page
		window.location.assign('/check-email');
	}

	return (
		<div className='register-container'>
			<h2 className='register-title'>Create an Account</h2>

			<form onSubmit={handleSubmit} className='register-form'>
				<input
					type='text'
					placeholder='Username'
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					className='register-input'
				/>

				<input
					type='email'
					placeholder='Email (optional)'
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className='register-input'
				/>

				<input
					type='password'
					placeholder='Password'
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className='register-input'
				/>

				<button type='submit' className='register-button'>
					Create Account
				</button>
			</form>

			<p className='register-footer'>
				Already have an account? <a href='/login'>Login</a>
			</p>
		</div>
	);
}
