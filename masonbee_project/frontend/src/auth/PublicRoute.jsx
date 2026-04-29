// src/auth/PublicRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuthContext } from './AuthProvider';

export default function PublicRoute({ children }) {
	const { isAuthenticated, loading } = useAuthContext();

	if (loading) {
		return <div>Loading...</div>;
	}

	if (isAuthenticated) {
		return <Navigate to='/dashboard' replace />;
	}

	return children;
}
