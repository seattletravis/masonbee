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
		error: loginError,
	} = useAuth();

	// -------------------------------------------------------------
	// GARDEN STATE (needed by MyGardensPage)
	// -------------------------------------------------------------
	const [defaultGarden, setDefaultGarden] = useState(null);
	const [pinned, setPinned] = useState({}); // MUST be an object
	const hasPinnedGardens = Object.keys(pinned).length > 0;

	const [hydrating, setHydrating] = useState(true);

	// -------------------------------------------------------------
	// HYDRATE DEFAULT GARDEN ON LOGIN
	// -------------------------------------------------------------
	useEffect(() => {
		async function loadDefault() {
			if (!isAuthenticated) {
				setDefaultGarden(null);
				setHydrating(false);
				return;
			}

			try {
				const garden = await getUserDefaultGarden();
				setDefaultGarden(garden || null);
			} catch {
				setDefaultGarden(null);
			}

			setHydrating(false);
		}

		loadDefault();
	}, [isAuthenticated]);

	// -------------------------------------------------------------
	// CONTEXT VALUE
	// -------------------------------------------------------------
	const value = {
		// Auth
		login,
		logout,
		refresh,
		access,
		refreshToken,
		isAuthenticated,
		loading,
		loginError,

		// Gardens
		defaultGarden,
		setDefaultGarden,
		pinned,
		setPinned,
		hasPinnedGardens,

		// Hydration state
		hydrating,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
