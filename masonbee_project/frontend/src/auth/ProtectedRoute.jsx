import { Navigate } from 'react-router-dom';
import { useAuthContext } from './AuthProvider';

export default function ProtectedRoute({ children }) {
	const { loading, isAuthenticated } = useAuthContext();

	if (loading) {
		return <div>Loading...</div>;
	}

	if (!isAuthenticated) {
		return <Navigate to='/login' replace />;
	}

	return children;
}
