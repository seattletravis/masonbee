// src/hooks/useBootstrapGardens.js
import { useEffect, useState, useCallback } from 'react';
import { get, getTokens } from '../api/client';
import { useAuthContext } from '../auth/AuthProvider';

export default function useBootstrapGardens() {
	const {
		loading,
		isAuthenticated,
		pinned,
		setPinned,
		defaultGarden,
		setDefaultGarden,
	} = useAuthContext();

	const [isBootstrapping, setIsBootstrapping] = useState(true);
	const [error, setError] = useState('');

	const loadPinnedAndDefault = useCallback(async () => {
		try {
			const [watched, def] = await Promise.all([
				get('/api/gardens/watched/'),
				get('/api/gardens/default/'),
			]);

			// Normalize watched list
			let watchedList = [];
			if (Array.isArray(watched)) {
				watchedList = watched;
			} else if (watched && Array.isArray(watched.results)) {
				watchedList = watched.results;
			}

			// Convert to lookup
			const lookup = {};
			watchedList.forEach((record) => {
				const id = String(record.garden?.id);
				if (id) lookup[id] = record;
			});

			// 🔹 Write into AuthProvider global state
			setPinned(lookup);
			setDefaultGarden(def || null);
		} catch {
			setError('Unable to load your saved garden preferences.');
		} finally {
			setIsBootstrapping(false);
		}
	}, [setPinned, setDefaultGarden]);

	useEffect(() => {
		if (!isBootstrapping) return;
		if (loading) return;
		if (!isAuthenticated) return;

		const { access } = getTokens();
		if (!access) return;

		// Mark bootstrap as started BEFORE async call
		setIsBootstrapping(false);

		loadPinnedAndDefault();
	}, [loading, isAuthenticated, isBootstrapping, loadPinnedAndDefault]);

	return {
		isBootstrapping,
		error,
		setError,
	};
}
