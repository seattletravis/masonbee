import { useEffect, useState } from 'react';
import './BeehouseNotesList.css';
export default function BeehouseNotesList({ beehouseId }) {
	const [notes, setNotes] = useState([]);
	const [loading, setLoading] = useState(true);

	const API_BASE = import.meta.env.VITE_API_BASE_URL;
	const token = localStorage.getItem('access');

	useEffect(() => {
		async function loadNotes() {
			try {
				const res = await fetch(
					`${API_BASE}/api/beehouse-events/?beehouse=${beehouseId}`,
					{
						headers: { Authorization: `Bearer ${token}` },
					},
				);

				const data = await res.json();
				setNotes(data);
			} catch (err) {
				console.error('Failed to load notes', err);
			} finally {
				setLoading(false);
			}
		}

		loadNotes();
	}, [beehouseId, API_BASE, token]);

	if (loading) return <p>Loading notes…</p>;

	if (notes.length === 0) return <p>No notes for this beehouse yet.</p>;

	return (
		<div className='beehouse-notes-list'>
			{notes.map((n) => (
				<div key={n.id} className='note-card'>
					<p>
						<strong>{n.event_type.replace('_', ' ')}</strong>
					</p>
					{n.notes && <p>{n.notes}</p>}
					<p className='note-date'>
						{new Date(n.created_at).toLocaleDateString()}
					</p>
				</div>
			))}
		</div>
	);
}
