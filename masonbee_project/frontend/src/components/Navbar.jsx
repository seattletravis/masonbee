import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthContext } from '../auth/AuthProvider';
import './Navbar.css';

function Navbar({ defaultGarden, hasPinnedGardens }) {
	const { isAuthenticated, logout } = useAuthContext();
	const location = useLocation();
	const [isOpen, setIsOpen] = useState(false);

	const showMyGardens = defaultGarden || hasPinnedGardens;

	useEffect(() => {
		setIsOpen(false);
	}, [location.pathname]);

	const toggleMenu = () => setIsOpen((prev) => !prev);

	const handleLogout = () => {
		setIsOpen(false);
		if (typeof logout === 'function') logout();
	};

	const authenticated = isAuthenticated === true;

	return (
		<nav className='navbar'>
			<div className='nav-left'>
				<Link to='/' className='nav-logo'>
					MasonBee
				</Link>
			</div>

			<div className='nav-right desktop-links'>
				{showMyGardens && (
					<Link to='/my-gardens' className='nav-link'>
						My Gardens
					</Link>
				)}

				{authenticated && (
					<>
						<Link to='/garden-finder' className='nav-link'>
							Garden Finder
						</Link>

						<Link to='/dashboard' className='nav-link'>
							Dashboard
						</Link>
					</>
				)}

				{!authenticated && (
					<Link to='/login' className='nav-link'>
						Login
					</Link>
				)}

				{authenticated && (
					<button type='button' className='nav-button' onClick={handleLogout}>
						Logout
					</button>
				)}
			</div>

			<button
				type='button'
				className={`hamburger mobile-only ${isOpen ? 'open' : ''}`}
				onClick={toggleMenu}
				aria-label='Toggle navigation menu'
				aria-expanded={isOpen}>
				<div className='bar' />
				<div className='bar' />
				<div className='bar' />
			</button>

			{isOpen && (
				<div className='mobile-menu'>
					{showMyGardens && (
						<Link to='/my-gardens' className='mobile-link'>
							My Gardens
						</Link>
					)}

					{authenticated && (
						<>
							<Link to='/garden-finder' className='mobile-link'>
								Garden Finder
							</Link>

							<Link to='/dashboard' className='mobile-link'>
								Dashboard
							</Link>
						</>
					)}

					{!authenticated && (
						<Link to='/login' className='mobile-link'>
							Login
						</Link>
					)}

					{authenticated && (
						<button
							type='button'
							className='mobile-button'
							onClick={handleLogout}>
							Logout
						</button>
					)}
				</div>
			)}
		</nav>
	);
}

export default Navbar;
