import { useState } from 'react';
import { post } from '../api/client';
import './Register.css';

export default function Register() {
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');

	async function handleSubmit(e) {
		e.preventDefault();
		setError('');

		try {
			const response = await post('/api/register/', {
				username,
				email,
				password,
			});

			// If backend returned a status code outside 200–299,
			// your post() helper likely returns { detail: "...error..." }
			if (response?.detail) {
				// Map backend messages to nicer UI messages
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

			// SUCCESS — backend returned 201
			window.location.assign('/check-email');
		} catch (err) {
			console.error('REGISTER ERROR:', err);
			setError('Something went wrong. Please try again.');
		}
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
