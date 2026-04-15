// src/auth/AuthProvider.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import useAuth from './useAuth';
import { getUserDefaultGarden } from '../api/gardens';
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
		loading,
		error,
	} = useAuth();

	const [defaultGarden, setDefaultGarden] = useState(null);
	const [gardenLoading, setGardenLoading] = useState(true);

	// 🔹 Global pinned gardens
	const [pinned, setPinned] = useState({});
	const hasPinnedGardens = Object.keys(pinned).length > 0;

	// Load default garden when authenticated
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

	useEffect(() => {
		async function loadPinnedAndDefault() {
			if (!isAuthenticated || !access) {
				setPinned({});
				return;
			}

			try {
				const [watched, def] = await Promise.all([
					get('/api/gardens/watched/'),
					get('/api/gardens/default/'),
				]);

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
				console.error('Unable to load saved garden preferences', err);
			}
		}

		loadPinnedAndDefault();
	}, [isAuthenticated, access]);

	// 🔹 Wrap logout so pinned + default garden reset properly
	const wrappedLogout = () => {
		logout();
		setPinned({});
		setDefaultGarden(null);
	};

	const value = {
		login,
		logout: wrappedLogout,
		refresh,
		access,
		refreshToken,
		isAuthenticated,
		loading,
		error,
		defaultGarden,
		setDefaultGarden,
		gardenLoading,
		pinned,
		setPinned,
		hasPinnedGardens,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
