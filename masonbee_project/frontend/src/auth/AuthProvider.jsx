// src/auth/AuthProvider.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import useAuth from './useAuth';
import { getUserDefaultGarden } from '../api/gardens';

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

	const [defaultGarden, setDefaultGarden] = useState(null);
	const [gardenLoading, setGardenLoading] = useState(true);

	useEffect(() => {
		async function loadGarden() {
			if (!isAuthenticated) {
				setDefaultGarden(null);
				setGardenLoading(false);
				return;
			}

			const garden = await getUserDefaultGarden();
			setDefaultGarden(garden);
			setGardenLoading(false);
		}

		loadGarden();
	}, [isAuthenticated]);

	const value = {
		login,
		logout,
		refresh,
		access,
		refreshToken,
		isAuthenticated,
		loading,
		error,
		defaultGarden,
		setDefaultGarden,
		gardenLoading,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
