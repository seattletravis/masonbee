// src/hooks/useBootstrapGardens.js
import { useEffect, useState, useCallback } from 'react';
import { get } from '../api/client';
import { getTokens } from '../api/client';
import { useAuthContext } from '../auth/AuthProvider';

export default function useBootstrapGardens() {
	const { loading, isAuthenticated } = useAuthContext();

	const [pinned, setPinned] = useState({});
	const [defaultGarden, setDefaultGarden] = useState(null);
	const [isBootstrapping, setIsBootstrapping] = useState(true);
	const [error, setError] = useState('');

	const loadPinnedAndDefault = useCallback(async () => {
		try {
			const [watched, def] = await Promise.all([
				get('/api/gardens/watched/'),
				get('/api/gardens/default/'),
			]);

			let watchedList = [];

			if (Array.isArray(watched)) {
				watchedList = watched;
			} else if (watched && Array.isArray(watched.results)) {
				watchedList = watched.results;
			}

			const lookup = {};
			watchedList.forEach((record) => {
				const id = String(record.garden?.id);
				if (id) lookup[id] = record;
			});

			setPinned(lookup);
			setDefaultGarden(def || null);
		} catch {
			setError('Unable to load your saved garden preferences.');
		} finally {
			setIsBootstrapping(false);
		}
	}, []);

	useEffect(() => {
		if (!isBootstrapping) return;

		if (loading) return;
		if (!isAuthenticated) return;

		const { access } = getTokens();
		if (!access) return;

		// Mark bootstrap as started BEFORE the async call
		setIsBootstrapping(false);

		loadPinnedAndDefault();
	}, [loading, isAuthenticated, isBootstrapping, loadPinnedAndDefault]);

	return {
		pinned,
		setPinned,
		defaultGarden,
		setDefaultGarden,
		isBootstrapping,
		error,
		setError,
	};
}
