import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthProvider from './auth/AuthProvider';
import ProtectedRoute from './auth/ProtectedRoute';
import MainLayout from './layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';

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

						<Route
							path='/garden/:id/journal'
							element={
								<ProtectedRoute>
									<Journal />
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
