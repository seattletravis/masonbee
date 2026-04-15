import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useEffect, useState } from 'react';
import './MainLayout.css';

function MainLayout() {
	const location = useLocation();
	const pathname = location.pathname;

	const hideNavbar = pathname === '/login';

	// Delay ONLY the login page to avoid first-load flash
	const [ready, setReady] = useState(!hideNavbar);

	useEffect(() => {
		if (hideNavbar) {
			const id = requestAnimationFrame(() => setReady(true));
			return () => cancelAnimationFrame(id);
		} else {
			setReady(true);
		}
	}, [hideNavbar]);

	// If we're on login and not ready yet, render nothing
	if (hideNavbar && !ready) return null;

	return (
		<div className={`layout-container ${hideNavbar ? 'no-nav' : ''}`}>
			{!hideNavbar && <Navbar />}
			<main className='layout-content'>
				<Outlet />
			</main>
		</div>
	);
}

export default MainLayout;
