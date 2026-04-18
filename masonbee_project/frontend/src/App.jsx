import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthProvider from './auth/AuthProvider';
import ProtectedRoute from './auth/ProtectedRoute';
import MainLayout from './layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
// import JournalEntryForm from './components/JournalEntryForm';
import MyGardensPage from './pages/MyGardensPage';
import GardenFinderPage from './pages/GardenFinderPage';
import ViewOneGardenPage from './pages/ViewOneGardenPage';
import 'leaflet/dist/leaflet.css';

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
