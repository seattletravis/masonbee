import './CheckEmail.css';

export default function CheckEmail() {
	return (
		<div className='checkemail-container'>
			<h2 className='checkemail-title'>Verify Your Email</h2>

			<p className='checkemail-message'>
				We’ve sent a verification link to your email address. Please open your
				inbox and click the link to activate your account.
			</p>

			<p className='checkemail-subtext'>
				Didn’t receive the email?
				<a href='/resend-verification' className='checkemail-link'>
					Resend verification
				</a>
			</p>
		</div>
	);
}
