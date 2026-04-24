import { useState, useEffect } from 'react';
import './BeeNotesEntryForm.css';

export default function BeeNotesEntryForm({ onCreated, onClose, editingNote }) {
	const isEditing = Boolean(editingNote);

	// const [eventType, setEventType] = useState('');
	const [eventType, setEventType] = useState(
		editingNote ? editingNote.event_type : '',
	);
	// const [beehouseId, setBeehouseId] = useState('');
	const [beehouseId, setBeehouseId] = useState(
		editingNote ? editingNote.beehouse : '',
	);
	// const [notes, setNotes] = useState('');
	const [notes, setNotes] = useState(editingNote ? editingNote.notes : '');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [userBeehouses, setUserBeehouses] = useState([]);

	const API_BASE = import.meta.env.VITE_API_BASE_URL;
	const token = localStorage.getItem('access');

	const EVENT_TYPES = [
		{ value: 'emergence', label: 'Emergence Observed' },
		{ value: 'activated', label: 'Activated - Added dormant bees' },
		{ value: 'deactivated', label: 'Deactivated - Removed dormant bees' },
		{ value: 'tubes_added', label: 'Tubes Added' },
		{ value: 'cleaned', label: 'Cleaned' },
		{ value: 'parasite_check', label: 'Parasite Check' },
		{ value: 'tubes_replaced', label: 'Tubes Replaced' },
		{ value: 'winterized', label: 'Winterized' },
		{ value: 'maintenance', label: 'Maintenance' },
		{ value: 'installed', label: 'Installed' },
		{ value: 'uninstalled', label: 'Uninstalled' },
		{ value: 'destroyed', label: 'Destroyed' },
		{ value: 'other', label: 'Other' },
	];

	useEffect(() => {
		if (editingNote) {
			setEventType(editingNote.event_type);
			setBeehouseId(editingNote.beehouse);
			setNotes(editingNote.notes || '');
		}
	}, [editingNote]);

	// Load all user beehouses
	useEffect(() => {
		async function loadBeehouses() {
			try {
				const res = await fetch(`${API_BASE}/api/beehouses/`, {
					headers: { Authorization: `Bearer ${token}` },
				});

				if (!res.ok) return;

				const data = await res.json();
				setUserBeehouses(data);
			} catch (err) {
				console.error('Failed to load beehouses', err);
			}
		}

		if (token) loadBeehouses();
	}, [API_BASE, token]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');

		if (!eventType) {
			setError('Event type is required.');
			return;
		}

		if (!beehouseId) {
			setError('Please select a beehouse.');
			return;
		}

		setLoading(true);

		const payload = {
			event_type: eventType,
			beehouse: Number(beehouseId),
			notes: notes.trim(),
		};

		try {
			let res;

			if (isEditing) {
				// ⭐ UPDATE EXISTING NOTE
				res = await fetch(
					`${API_BASE}/api/beehouse-events/${editingNote.id}/`,
					{
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${token}`,
						},
						body: JSON.stringify(payload),
					},
				);
			} else {
				// ⭐ CREATE NEW NOTE
				res = await fetch(`${API_BASE}/api/beehouse-events/`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify(payload),
				});
			}

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.detail || 'Failed to save bee note.');
			}

			onCreated?.(data);

			// ⭐ Reset form only after creating
			if (!isEditing) {
				setEventType('');
				setBeehouseId('');
				setNotes('');
			}
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<form className='bee-notes-entry-form' onSubmit={handleSubmit}>
			<h3>Add Beenote</h3>

			{error && <div className='error-text'>{error}</div>}

			<div className='form-grid'>
				<label>
					Event Type *
					<select
						required
						value={eventType}
						onChange={(e) => setEventType(e.target.value)}>
						<option value=''>Select event</option>
						{EVENT_TYPES.map((t) => (
							<option key={t.value} value={t.value}>
								{t.label}
							</option>
						))}
					</select>
				</label>

				<label>
					Associated Beehouse *
					<select
						required
						value={beehouseId}
						onChange={(e) => setBeehouseId(e.target.value)}>
						<option value=''>Select beehouse</option>
						{userBeehouses.map((b) => (
							<option key={b.id} value={b.id}>
								{b.name || `Beehouse ${b.id}`}
							</option>
						))}
					</select>
				</label>

				<label className='full-width'>
					Notes (optional)
					<textarea
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						rows={4}
						placeholder='Add details about the event...'
					/>
				</label>

				{/* ⭐ Buttons Row */}
				<div className='form-actions'>
					<button type='submit' disabled={loading}>
						{loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Note'}
					</button>

					<button type='button' className='cancel-button' onClick={onClose}>
						Cancel
					</button>
				</div>
			</div>
		</form>
	);
}
