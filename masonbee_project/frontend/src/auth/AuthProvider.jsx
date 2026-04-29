// src/auth/AuthProvider.jsx
import { createContext, useContext } from 'react';
import useAuth from './useAuth';

const AuthContext = createContext(null);

export function useAuthContext() {
	return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
	const {
		login,
		logout,
		access,
		refreshToken,
		isAuthenticated,
		loading,
		loginError,
	} = useAuth();

	const value = {
		login,
		logout,
		access,
		refreshToken,
		isAuthenticated,
		loading,
		loginError,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
