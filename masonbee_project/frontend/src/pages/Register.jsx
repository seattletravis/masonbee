import { useState, useEffect } from 'react';
import { post } from '../api/client';
import { buildUrl } from '../api/client';
import './Register.css';

export default function Register() {
	// Form fields
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');

	// Error message for form submission
	const [error, setError] = useState('');

	// Username availability
	const [usernameAvailable, setUsernameAvailable] = useState(null);
	const [checkingUsername, setCheckingUsername] = useState(false);
	const [lastCheckedUsername, setLastCheckedUsername] = useState('');

	// Email availability
	const [emailAvailable, setEmailAvailable] = useState(null);
	const [checkingEmail, setCheckingEmail] = useState(false);
	const [lastCheckedEmail, setLastCheckedEmail] = useState('');

	// Password strength
	const [passwordStrength, setPasswordStrength] = useState('weak');

	// Show/hide password toggles
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	// ---------------------------------------------------------
	// Password Strength Checker
	// ---------------------------------------------------------
	useEffect(() => {
		if (!password) {
			setPasswordStrength('weak');
			return;
		}

		const hasSpecial = /[^A-Za-z0-9]/.test(password);
		const hasUpper = /[A-Z]/.test(password);
		const hasNumber = /[0-9]/.test(password);

		if (password.length < 8 || !hasSpecial) {
			setPasswordStrength('weak');
		} else if (password.length >= 8 && hasSpecial && (hasUpper || hasNumber)) {
			setPasswordStrength('medium');
		} else if (password.length >= 10 && hasSpecial && hasUpper && hasNumber) {
			setPasswordStrength('strong');
		} else {
			setPasswordStrength('medium');
		}
	}, [password]);

	// ---------------------------------------------------------
	// Username Availability Checker
	// ---------------------------------------------------------
	useEffect(() => {
		if (!username) {
			setUsernameAvailable(null);
			setLastCheckedUsername('');
			return;
		}

		setCheckingUsername(true);

		const timeout = setTimeout(async () => {
			try {
				const res = await fetch(
					buildUrl(`/api/check-username/?username=${username}`),
				);
				const data = await res.json();

				setUsernameAvailable(data.available);
				setLastCheckedUsername(username);
			} catch {
				setUsernameAvailable(null);
			}

			setCheckingUsername(false);
		}, 500);

		return () => clearTimeout(timeout);
	}, [username]);

	// ---------------------------------------------------------
	// Email Availability Checker
	// ---------------------------------------------------------
	useEffect(() => {
		if (!email) {
			setEmailAvailable(null);
			setLastCheckedEmail('');
			return;
		}

		setCheckingEmail(true);

		const timeout = setTimeout(async () => {
			try {
				const res = await fetch(
					buildUrl(`/api/check-email/?email=${encodeURIComponent(email)}`),
				);
				const data = await res.json();

				setEmailAvailable(data.available);
				setLastCheckedEmail(email);
			} catch {
				setEmailAvailable(null);
			}

			setCheckingEmail(false);
		}, 500);

		return () => clearTimeout(timeout);
	}, [email]);

	// ---------------------------------------------------------
	// Submit Handler
	// ---------------------------------------------------------
	async function handleSubmit(e) {
		e.preventDefault();
		setError('');

		if (usernameAvailable === false) {
			setError('That username is already in use.');
			return;
		}
		if (emailAvailable === false) {
			setError('That email is already registered.');
			return;
		}
		if (passwordStrength === 'weak') {
			setError(
				'Password must be at least 8 characters and include a special character.',
			);
			return;
		}
		if (password !== confirmPassword) {
			setError('Passwords do not match.');
			return;
		}

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

			window.location.assign('/check-email');
		} catch (err) {
			console.error('REGISTER ERROR:', err);
			setError('Something went wrong. Please try again.');
		}
	}

	// ---------------------------------------------------------
	// Render
	// ---------------------------------------------------------
	return (
		<div className='register-container'>
			<h2 className='register-title'>Create an Account</h2>

			<form onSubmit={handleSubmit} className='register-form'>
				{/* Username */}
				<input
					type='text'
					placeholder='Username'
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					className='register-input'
					autoComplete='new-username'
				/>

				{username && checkingUsername && (
					<p className='username-check'>Checking username...</p>
				)}

				{username &&
					!checkingUsername &&
					lastCheckedUsername === username &&
					usernameAvailable === false && (
						<p className='username-error'>That username is already taken.</p>
					)}

				{username &&
					!checkingUsername &&
					lastCheckedUsername === username &&
					usernameAvailable === true && (
						<p className='username-ok'>Username is available!</p>
					)}

				{/* Email */}
				<input
					type='email'
					required
					placeholder='Email'
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className='register-input'
					autoComplete='new-email'
				/>

				{email && checkingEmail && (
					<p className='email-check'>Checking email...</p>
				)}

				{email &&
					!checkingEmail &&
					lastCheckedEmail === email &&
					emailAvailable === false && (
						<p className='email-error'>That email is already registered.</p>
					)}

				{email &&
					!checkingEmail &&
					lastCheckedEmail === email &&
					emailAvailable === true && (
						<p className='email-ok'>Email is available!</p>
					)}

				{/* Password */}
				<div className='password-wrapper'>
					<input
						type={showPassword ? 'text' : 'password'}
						placeholder='Password'
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className='register-input'
						autoComplete='new-password'
					/>
					<span
						className='password-toggle'
						onClick={() => setShowPassword(!showPassword)}>
						{showPassword ? '👁️' : '👁️‍🗨️'}
					</span>
				</div>

				{/* Confirm Password */}
				<div className='password-wrapper'>
					<input
						type={showConfirmPassword ? 'text' : 'password'}
						placeholder='Confirm Password'
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						className='register-input'
						autoComplete='confirm-password'
					/>
					<span
						className='password-toggle'
						onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
						{showConfirmPassword ? '👁️' : '👁️‍🗨️'}
					</span>
				</div>

				{confirmPassword && password !== confirmPassword && (
					<p className='password-mismatch'>Passwords do not match.</p>
				)}

				{/* Form Error */}
				{error && <p className='register-error'>{error}</p>}
				{/* Password Strength Meter */}
				<div className='password-strength'>
					<div className={`strength-bar ${passwordStrength}`}></div>
					<p className={`strength-text ${passwordStrength}`}>
						{passwordStrength === 'weak' && 'Weak password'}
						{passwordStrength === 'medium' && 'Medium strength'}
						{passwordStrength === 'strong' && 'Strong password'}
					</p>
				</div>
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
