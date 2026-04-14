// src/hooks/useDefaultGarden.js
import { useCallback } from 'react';
import { post } from '../api/client';

export default function useDefaultGarden(setDefaultGarden, setError) {
	const setDefault = useCallback(
		async (garden) => {
			setError('');

			try {
				const result = await post('/api/gardens/default/', {
					garden_id: garden.id,
				});
				setDefaultGarden(result || garden);
			} catch {
				setError('Unable to set the default garden.');
			}
		},
		[setDefaultGarden, setError],
	);

	return { setDefault };
}
