import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './MainLayout.css';

function MainLayout() {
	const location = useLocation();
	const hideNavbar = location.pathname === '/login';

	return (
		<div className='layout-container'>
			{!hideNavbar && <Navbar />}
			<main className='layout-content'>
				<Outlet />
			</main>
		</div>
	);
}

export default MainLayout;
