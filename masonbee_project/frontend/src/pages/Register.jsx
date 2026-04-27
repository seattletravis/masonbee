import { useState, useEffect } from 'react';
import { post } from '../api/client';
import './Register.css';
import { buildUrl } from '../api/client';

export default function Register() {
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');

	// Username availability state
	const [usernameAvailable, setUsernameAvailable] = useState(null);
	const [checking, setChecking] = useState(false);
	const [lastChecked, setLastChecked] = useState(''); // prevents flicker

	// -------------------------------
	// Username Availability Checker
	// -------------------------------
	useEffect(() => {
		if (!username) {
			setUsernameAvailable(null);
			setLastChecked('');
			return;
		}

		setChecking(true);

		const timeout = setTimeout(async () => {
			try {
				const res = await fetch(
					buildUrl(`/api/check-username/?username=${username}`),
				);
				const data = await res.json();

				setUsernameAvailable(data.available);
				setLastChecked(username);
			} catch {
				setUsernameAvailable(null);
			}

			setChecking(false);
		}, 500);

		return () => clearTimeout(timeout);
	}, [username]);

	// -------------------------------
	// Registration Submit Handler
	// -------------------------------
	async function handleSubmit(e) {
		e.preventDefault();
		setError('');

		try {
			const response = await post('/api/register/', {
				username,
				email,
				password,
			});

			if (response?.detail) {
				const msg = response.detail;

				if (msg.includes('required')) {
					setError('Please fill out all fields.');
				} else if (msg.includes('Username already taken')) {
					setError('That username is already in use.');
				} else if (msg.includes('Email already in use')) {
					setError('That email is already registered.');
				} else if (msg.toLowerCase().includes('password')) {
					setError('Your password does not meet requirements.');
				} else {
					setError(msg || 'Registration failed.');
				}

				return;
			}

			// SUCCESS
			window.location.assign('/check-email');
		} catch (err) {
			console.error('REGISTER ERROR:', err);
			setError('Something went wrong. Please try again.');
		}
	}

	// -------------------------------
	// Render
	// -------------------------------
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

				{/* Username Status Messages */}
				{username && checking && <p className='username-check'>Checking...</p>}

				{username &&
					!checking &&
					lastChecked === username &&
					usernameAvailable === false && (
						<p className='username-error'>That username is already taken.</p>
					)}

				{username &&
					!checking &&
					lastChecked === username &&
					usernameAvailable === true && (
						<p className='username-ok'>Username is available!</p>
					)}

				<input
					type='email'
					required
					placeholder='Email'
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

				{error && <p className='register-error'>{error}</p>}

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
