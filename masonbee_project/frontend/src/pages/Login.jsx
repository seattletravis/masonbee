import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { post, setTokens } from '../api/client';
import { useAuthContext } from '../auth/AuthProvider';
import './Login.css';

export default function Login() {
	const { login } = useAuthContext();
	const navigate = useNavigate();
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		document.title = 'Login';
	}, []);

	async function handleSubmit(event) {
		event.preventDefault();
		setError('');
		setLoading(true);

		try {
			await login(username, password); // ⭐ use the real login function
			navigate('/dashboard'); // ⭐ redirect after successful login
		} catch (err) {
			setError(
				err?.data?.detail || err?.message || 'Login failed. Please try again.',
			);
		} finally {
			setLoading(false);
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
					disabled={loading}
					required
				/>

				<input
					type='password'
					placeholder='Password'
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className='login-input'
					autoComplete='current-password'
					disabled={loading}
					required
				/>

				{error && <p className='login-error'>{error}</p>}

				<button type='submit' className='login-button' disabled={loading}>
					{loading ? 'Signing in...' : 'Login'}
				</button>
			</form>

			<p className='login-footer'>
				Don’t have an account? <a href='/register'>Create one</a>
			</p>
		</div>
	);
}
