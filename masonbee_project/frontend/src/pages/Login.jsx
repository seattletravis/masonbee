import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { post, setTokens } from '../api/client';
import { useAuthContext } from '../auth/AuthProvider';

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
		<div
			style={{
				minHeight: '100vh',
				display: 'grid',
				placeItems: 'center',
				background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
				padding: '24px',
			}}>
			<div
				style={{
					width: '100%',
					maxWidth: '420px',
					backgroundColor: '#ffffff',
					borderRadius: '16px',
					boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12)',
					padding: '32px',
				}}>
				<h1
					style={{
						margin: '0 0 8px',
						fontSize: '2rem',
						color: '#0f172a',
						textAlign: 'center',
					}}>
					Sign In
				</h1>
				<p
					style={{
						margin: '0 0 24px',
						color: '#475569',
						textAlign: 'center',
					}}>
					Enter your credentials to access your account.
				</p>

				<form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
					<div style={{ display: 'grid', gap: '8px' }}>
						<label
							htmlFor='username'
							style={{ color: '#1e293b', fontWeight: 600 }}>
							Username
						</label>
						<input
							id='username'
							type='text'
							autoComplete='username'
							value={username}
							onChange={(event) => setUsername(event.target.value)}
							disabled={loading}
							required
							style={{
								padding: '12px 14px',
								borderRadius: '10px',
								border: '1px solid #cbd5e1',
								fontSize: '1rem',
								outline: 'none',
							}}
						/>
					</div>

					<div style={{ display: 'grid', gap: '8px' }}>
						<label
							htmlFor='password'
							style={{ color: '#1e293b', fontWeight: 600 }}>
							Password
						</label>
						<input
							id='password'
							type='password'
							autoComplete='current-password'
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							disabled={loading}
							required
							style={{
								padding: '12px 14px',
								borderRadius: '10px',
								border: '1px solid #cbd5e1',
								fontSize: '1rem',
								outline: 'none',
							}}
						/>
					</div>

					{error ? (
						<div
							style={{
								padding: '12px 14px',
								borderRadius: '10px',
								backgroundColor: '#fef2f2',
								color: '#b91c1c',
								border: '1px solid #fecaca',
								fontSize: '0.95rem',
							}}>
							{error}
						</div>
					) : null}

					<button
						type='submit'
						disabled={loading}
						style={{
							marginTop: '8px',
							padding: '12px 16px',
							border: 'none',
							borderRadius: '10px',
							backgroundColor: loading ? '#94a3b8' : '#0f172a',
							color: '#ffffff',
							fontSize: '1rem',
							fontWeight: 700,
							cursor: loading ? 'not-allowed' : 'pointer',
						}}>
						{loading ? 'Signing in...' : 'Login'}
					</button>
				</form>
			</div>
		</div>
	);
}
