// src/hooks/useDefaultGarden.js
import { useCallback } from 'react';
import { post } from '../api/client';

export default function useDefaultGarden(setDefaultGarden, setError) {
	const setDefault = async (garden) => {
		try {
			await post('/api/gardens/default/', { garden_id: garden.id });

			// ⭐ Update UI immediately
			setDefaultGarden(garden);
		} catch (err) {
			setError('Unable to set default garden.');
		}
	};

	return { setDefault };
}
