import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthProvider from './auth/AuthProvider';
import ProtectedRoute from './auth/ProtectedRoute';
import MainLayout from './layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import MyGardensPage from './pages/MyGardensPage';
import GardenFinderPage from './pages/GardenFinderPage';
import ViewOneGardenPage from './pages/ViewOneGardenPage';
import MyProfilePage from './pages/MyProfilePage';
import MasonBeeForecasting from './pages/MasonBeeForecasting';
import 'leaflet/dist/leaflet.css';
import MasonBeeFinder from './pages/MasonBeeFinder';
import ResourcesPage from './pages/ResourcesPage';
import BeehousePage from './pages/BeehousePage';

export default function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<Routes>
					<Route element={<MainLayout />}>
						<Route path='/login' element={<Login />} />

						<Route
							path='/dashboard'
							element={
								<ProtectedRoute>
									<Dashboard />
								</ProtectedRoute>
							}
						/>

						{/* NEW ROUTES */}
						<Route
							path='/journal'
							element={
								<ProtectedRoute>
									<Journal />
								</ProtectedRoute>
							}
						/>
						<Route path='/gardens/:id' element={<ViewOneGardenPage />} />

						<Route path='/my-gardens' element={<MyGardensPage />} />

						<Route path='/profile' element={<MyProfilePage />} />
						<Route path='/forecasting' element={<MasonBeeForecasting />} />
						<Route path='/finder' element={<MasonBeeFinder />} />
						<Route path='/resources' element={<ResourcesPage />} />
						<Route path='/beehouse' element={<BeehousePage />} />

						<Route
							path='/garden/:id/journal'
							element={
								<ProtectedRoute>
									<Journal />
								</ProtectedRoute>
							}
						/>
						<Route
							path='/garden-finder'
							element={
								<ProtectedRoute>
									<GardenFinderPage />
								</ProtectedRoute>
							}
						/>

						<Route path='/' element={<Login />} />
					</Route>
				</Routes>
			</BrowserRouter>
		</AuthProvider>
	);
}
