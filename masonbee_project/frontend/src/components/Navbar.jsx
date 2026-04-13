import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthContext } from '../auth/AuthProvider';
import './Navbar.css';

function Navbar() {
	const { isAuthenticated, logout, defaultGarden } = useAuthContext();
	const location = useLocation();
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		setIsOpen(false);
	}, [location.pathname]);

	const toggleMenu = () => {
		setIsOpen((prev) => !prev);
	};

	const handleLogout = () => {
		setIsOpen(false);
		if (typeof logout === 'function') {
			logout();
		}
	};

	const authenticated = Boolean(isAuthenticated);

	return (
		<nav className='navbar'>
			<div className='nav-left'>
				<Link to='/' className='nav-logo'>
					MasonBee
				</Link>
			</div>

			<div className='nav-right desktop-links'>
				{defaultGarden && (
					<Link to='/my-garden' className='nav-link'>
						My Garden
					</Link>
				)}

				{authenticated && (
					<Link to='/dashboard' className='nav-link'>
						Dashboard
					</Link>
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
					{defaultGarden && (
						<Link to='/my-garden' className='mobile-link'>
							My Garden
						</Link>
					)}

					{authenticated && (
						<Link to='/dashboard' className='mobile-link'>
							Dashboard
						</Link>
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
