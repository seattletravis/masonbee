// src/pages/Login.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../auth/AuthProvider';
import './Login.css';

export default function Login() {
	const { login, user, loading: authLoading, loginError } = useAuthContext();
	const navigate = useNavigate();

	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [localError, setLocalError] = useState(null);

	useEffect(() => {
		document.title = 'Login';
		setLocalError(localStorage.getItem('loginError'));
	}, []);

	useEffect(() => {
		if (!authLoading && user) {
			navigate('/dashboard', { replace: true });
		}
	}, [authLoading, user, navigate]);

	useEffect(() => {
		setLocalError(loginError);
	}, [loginError]);

	async function handleSubmit(event) {
		event.preventDefault();
		setSubmitting(true);
		localStorage.removeItem('loginError');
		setLocalError(null);

		try {
			await login(username, password);
			navigate('/dashboard', { replace: true });
		} catch (err) {
			// loginError already set globally + persisted
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className='login-container'>
			<h2 className='login-title'>Sign In</h2>

			<form onSubmit={handleSubmit} className='login-form'>
				<input
					type='text'
					placeholder='Username'
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					className='login-input'
					autoComplete='username'
					disabled={submitting}
					required
				/>

				<input
					type='password'
					placeholder='Password'
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className='login-input'
					autoComplete='current-password'
					disabled={submitting}
					required
				/>

				{localError && <p className='login-error'>{localError}</p>}

				<button type='submit' className='login-button' disabled={submitting}>
					{submitting ? 'Signing in...' : 'Login'}
				</button>
			</form>

			<p className='login-footer'>
				Don’t have an account? <a href='/register'>Create one</a>
			</p>
		</div>
	);
}
