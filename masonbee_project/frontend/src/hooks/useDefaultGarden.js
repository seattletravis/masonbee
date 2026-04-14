// src/hooks/useDefaultGarden.js
import { post } from '../api/client';
import { useAuthContext } from '../auth/AuthProvider';

export default function useDefaultGarden(setError) {
	const { setDefaultGarden } = useAuthContext();

	const setDefault = async (garden) => {
		try {
			if (garden === null) {
				// Clear default
				await post('/api/gardens/default/', { garden_id: null });
				setDefaultGarden(null);
				return;
			}

			// Set new default
			await post('/api/gardens/default/', { garden_id: garden.id });
			setDefaultGarden(garden);
		} catch (err) {
			setError('Unable to set default garden.');
		}
	};

	return { setDefault };
}
