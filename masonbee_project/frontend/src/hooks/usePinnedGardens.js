// src/hooks/usePinnedGardens.js
import { useCallback } from 'react';
import { post, del } from '../api/client';

export default function usePinnedGardens(pinned, setPinned, setError) {
	const togglePin = useCallback(
		async (garden) => {
			const id = String(garden.id);
			setError('');

			try {
				if (pinned[id]) {
					await del(`/api/gardens/${id}/unpin/`);
					setPinned((prev) => {
						const next = { ...prev };
						delete next[id];
						return next;
					});
				} else {
					const record = await post(`/api/gardens/${id}/pin/`);
					setPinned((prev) => ({ ...prev, [id]: record }));
				}
			} catch {
				setError('Unable to update pinned gardens.');
			}
		},
		[pinned, setPinned, setError],
	);

	return { togglePin };
}
