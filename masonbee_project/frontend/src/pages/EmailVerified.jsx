import { useLocation } from 'react-router-dom';

export default function EmailVerified() {
	const location = useLocation();
	const params = new URLSearchParams(location.search);
	const status = params.get('status');

	let title = 'Email Verified';
	let message =
		'Your email has been successfully verified. You can now log in to your account.';
	let showLogin = true;

	if (status === 'invalid') {
		title = 'Invalid Link';
		message =
			'This verification link is invalid. It may have been corrupted or incomplete.';
		showLogin = false;
	}

	if (status === 'expired') {
		title = 'Verification Link Expired';
		message =
			'This verification link has expired. Please request a new one to continue.';
		showLogin = false;
	}

	return (
		<div
			style={{
				maxWidth: '420px',
				margin: '4rem auto',
				padding: '2rem',
				background: '#ffffff',
				borderRadius: '12px',
				boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
				textAlign: 'center',
			}}>
			<h2
				style={{
					fontSize: '1.6rem',
					marginBottom: '1rem',
					color: '#333',
					fontWeight: '600',
				}}>
				{title}
			</h2>

			<p
				style={{
					fontSize: '1rem',
					color: '#555',
					lineHeight: '1.5',
					marginBottom: '1.5rem',
				}}>
				{message}
			</p>

			{showLogin && (
				<a
					href='/login'
					style={{
						display: 'inline-block',
						padding: '0.75rem 1.25rem',
						background: '#333',
						color: 'white',
						borderRadius: '8px',
						textDecoration: 'none',
						fontWeight: '600',
						fontSize: '1rem',
						transition: 'background 0.2s ease',
					}}>
					Go to Login
				</a>
			)}

			{!showLogin && (
				<a
					href='/resend-verification'
					style={{
						display: 'inline-block',
						padding: '0.75rem 1.25rem',
						background: '#0077cc',
						color: 'white',
						borderRadius: '8px',
						textDecoration: 'none',
						fontWeight: '600',
						fontSize: '1rem',
						transition: 'background 0.2s ease',
					}}>
					Resend Verification Email
				</a>
			)}
		</div>
	);
}
