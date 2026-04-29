import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

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
import Register from './pages/Register';
import CheckEmail from './pages/CheckEmail';
import EmailVerified from './pages/EmailVerified';
import AboutPage from './pages/AboutPage';
import PublicRoute from './auth/PublicRoute';

export default function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<Routes>
					<Route element={<MainLayout />}>
						{/* 🔒 AUTHENTICATED ROUTES */}
						<Route
							path='/dashboard'
							element={
								<ProtectedRoute>
									<Dashboard />
								</ProtectedRoute>
							}
						/>

						<Route
							path='/journal'
							element={
								<ProtectedRoute>
									<Journal />
								</ProtectedRoute>
							}
						/>

						<Route
							path='/gardens/:id'
							element={
								<ProtectedRoute>
									<ViewOneGardenPage />
								</ProtectedRoute>
							}
						/>

						<Route
							path='/my-gardens'
							element={
								<ProtectedRoute>
									<MyGardensPage />
								</ProtectedRoute>
							}
						/>

						<Route
							path='/profile'
							element={
								<ProtectedRoute>
									<MyProfilePage />
								</ProtectedRoute>
							}
						/>

						<Route
							path='/forecasting'
							element={
								<ProtectedRoute>
									<MasonBeeForecasting />
								</ProtectedRoute>
							}
						/>

						<Route
							path='/finder'
							element={
								<ProtectedRoute>
									<MasonBeeFinder />
								</ProtectedRoute>
							}
						/>

						<Route
							path='/resources'
							element={
								<ProtectedRoute>
									<ResourcesPage />
								</ProtectedRoute>
							}
						/>

						<Route
							path='/beehouse'
							element={
								<ProtectedRoute>
									<BeehousePage />
								</ProtectedRoute>
							}
						/>

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

						{/* 🌼 PUBLIC ROUTES */}
						<Route
							path='/login'
							element={
								<PublicRoute>
									<Login />
								</PublicRoute>
							}
						/>

						<Route
							path='/register'
							element={
								<PublicRoute>
									<Register />
								</PublicRoute>
							}
						/>

						<Route path='/check-email' element={<CheckEmail />} />
						<Route path='/email-verified' element={<EmailVerified />} />
						<Route path='/about' element={<AboutPage />} />

						{/* DEFAULT REDIRECT */}
						<Route path='/' element={<Navigate to='/login' replace />} />
					</Route>
				</Routes>
			</BrowserRouter>
		</AuthProvider>
	);
}
