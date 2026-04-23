// src/auth/AuthProvider.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import useAuth from './useAuth';
import { get } from '../api/client';

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
		loading, // ⭐ from useAuth — tells us when auth is ready
		error,
	} = useAuth();

	// ------------------------------------------------------------
	// Persistent state
	// ------------------------------------------------------------
	const [hydrating, setHydrating] = useState(true);

	const [defaultGarden, setDefaultGarden] = useState(
		JSON.parse(localStorage.getItem('defaultGarden')) || null,
	);

	const [pinned, setPinned] = useState(
		JSON.parse(localStorage.getItem('pinnedGardens')) || {},
	);

	const hasPinnedGardens = Object.keys(pinned).length > 0;

	// ------------------------------------------------------------
	// Persist to localStorage
	// ------------------------------------------------------------
	useEffect(() => {
		localStorage.setItem('defaultGarden', JSON.stringify(defaultGarden));
	}, [defaultGarden]);

	useEffect(() => {
		localStorage.setItem('pinnedGardens', JSON.stringify(pinned));
	}, [pinned]);

	// ------------------------------------------------------------
	// Hydrate from backend AFTER authentication is fully ready
	// ------------------------------------------------------------
	useEffect(() => {
		async function hydrateFromBackend() {
			// ⭐ DO NOT HYDRATE until auth is fully initialized
			if (loading) return;
			if (!isAuthenticated) {
				setHydrating(false);
				return;
			}
			if (!access || !refreshToken) {
				setHydrating(false);
				return;
			}

			try {
				const [watched, def] = await Promise.all([
					get('/api/gardens/watched/'),
					get('/api/gardens/default/'),
				]);

				// ⭐ Normalize pinned gardens
				let watchedList = [];
				if (Array.isArray(watched)) watchedList = watched;
				else if (watched?.results) watchedList = watched.results;

				const lookup = {};
				watchedList.forEach((record) => {
					const id = String(record.garden?.id);
					if (id) lookup[id] = record;
				});

				setPinned(lookup);
				setDefaultGarden(def || null);
			} catch (err) {
				// Ignore 401 — happens if token expired before refresh
				if (err?.status !== 401) {
					console.error('Unable to load saved garden preferences', err);
				}
			}

			setHydrating(false);
		}

		hydrateFromBackend();
	}, [loading, isAuthenticated, access, refreshToken]);

	// ------------------------------------------------------------
	// Wrapped logout clears everything
	// ------------------------------------------------------------
	const wrappedLogout = () => {
		logout();
		setPinned({});
		setDefaultGarden(null);
		localStorage.removeItem('pinnedGardens');
		localStorage.removeItem('defaultGarden');
	};

	// ------------------------------------------------------------
	// Context value
	// ------------------------------------------------------------
	const value = {
		login,
		logout: wrappedLogout,
		refresh,
		access,
		refreshToken,
		isAuthenticated,
		loading,
		error,
		hydrating,
		defaultGarden,
		setDefaultGarden,
		pinned,
		setPinned,
		hasPinnedGardens,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
