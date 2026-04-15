import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useEffect, useState } from 'react';
import { useAuthContext } from '../auth/AuthProvider';
import './MainLayout.css';

function MainLayout() {
	const location = useLocation();
	const { defaultGarden, hasPinnedGardens } = useAuthContext(); // ← Always correct source
	const { loading } = useAuthContext;
	const hideNavbar = location.pathname === '/login' || loading;

	const [ready, setReady] = useState(!hideNavbar);

	useEffect(() => {
		if (hideNavbar) {
			const id = requestAnimationFrame(() => setReady(true));
			return () => cancelAnimationFrame(id);
		} else {
			setReady(true);
		}
	}, [hideNavbar]);

	if (hideNavbar && !ready) return null;

	return (
		<div className={`layout-container ${hideNavbar ? 'no-nav' : ''}`}>
			{!hideNavbar && (
				<Navbar
					defaultGarden={defaultGarden}
					hasPinnedGardens={hasPinnedGardens}
				/>
			)}
			<main className='layout-content'>
				<Outlet />
			</main>
		</div>
	);
}

export default MainLayout;
