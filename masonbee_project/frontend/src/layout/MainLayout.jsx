import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuthContext } from '../auth/AuthProvider';
import PublicHeader from './PublicHeader';
import './MainLayout.css';

function MainLayout() {
	const location = useLocation();
	const { isAuthenticated, defaultGarden, hasPinnedGardens, loading } =
		useAuthContext();

	// Pages that should NOT show the navbar
	const publicPages = [
		'/login',
		'/register',
		'/check-email',
		'/email-verified',
	];

	const isPublicPage = publicPages.includes(location.pathname);

	return (
		<div className={`layout-container ${isPublicPage ? 'no-nav' : ''}`}>
			{/* Authenticated users get the navbar */}
			{isAuthenticated && !loading && (
				<Navbar
					defaultGarden={defaultGarden}
					hasPinnedGardens={hasPinnedGardens}
				/>
			)}

			{/* Public pages get the friendly nature-themed header */}
			{!isAuthenticated && isPublicPage && <PublicHeader />}

			<main className='layout-content'>
				<Outlet />
			</main>
		</div>
	);
}

export default MainLayout;
