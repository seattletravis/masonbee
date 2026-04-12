import { createContext, useContext } from 'react';
import useAuth from './useAuth';
import { setRefreshHandler } from '../api/client';

const AuthContext = createContext(null);

export function useAuthContext() {
	return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
	const {
		login,
		logout,
		refresh,
		access,
		refreshToken,
		isAuthenticated,
		loading,
		error,
	} = useAuth();

	// Connect the refresh function to the API client
	setRefreshHandler(refresh);

	const value = {
		login,
		logout,
		refresh,
		access,
		refreshToken,
		isAuthenticated,
		loading,
		error,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
