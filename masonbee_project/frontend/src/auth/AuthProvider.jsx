// src/auth/AuthProvider.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import useAuth from './useAuth';
import { getUserDefaultGarden, getPinnedGardens } from '../api/gardens';

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
	// GARDEN STATE
	// -------------------------------------------------------------
	const [defaultGarden, setDefaultGarden] = useState(null);
	const [pinned, setPinned] = useState({}); // { [id]: { id, garden } }
	const hasPinnedGardens = Object.keys(pinned).length > 0;

	const [hydrating, setHydrating] = useState(true);

	// -------------------------------------------------------------
	// HYDRATE DEFAULT + PINNED GARDENS ON LOGIN
	// -------------------------------------------------------------
	useEffect(() => {
		async function hydrate() {
			if (!isAuthenticated) {
				setDefaultGarden(null);
				setPinned({});
				setHydrating(false);
				return;
			}

			try {
				// 1. Load default garden
				const dg = await getUserDefaultGarden();
				setDefaultGarden(dg || null);
			} catch {
				setDefaultGarden(null);
			}

			try {
				// 2. Load pinned gardens
				const records = await getPinnedGardens();
				// records = [{ id, garden }, ...]
				const mapped = {};
				for (const r of records) {
					if (r?.garden?.id) {
						mapped[r.garden.id] = r;
					}
				}
				setPinned(mapped);
			} catch {
				setPinned({});
			}

			setHydrating(false);
		}

		hydrate();
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
