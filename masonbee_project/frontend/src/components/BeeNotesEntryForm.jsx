import { useState } from 'react';
import './BeeNotesEntryForm.css';

export default function BeeNotesEntryForm({
	gardenId,
	beehouses = [],
	onCreated,
}) {
	const [eventType, setEventType] = useState('');
	const [beehouseId, setBeehouseId] = useState('');
	const [notes, setNotes] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

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

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');

		if (!eventType) {
			setError('Event type is required.');
			return;
		}

		setLoading(true);

		const payload = {
			event_type: eventType,
			beehouse: beehouseId ? Number(beehouseId) : null,
			notes: notes.trim(),
		};

		try {
			const res = await fetch('/api/beehouse-events/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('access')}`,
				},
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.detail || 'Failed to create bee note.');
			}

			const data = await res.json();
			onCreated && onCreated(data);

			setEventType('');
			setBeehouseId('');
			setNotes('');
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
					Associated Beehouse (optional)
					<select
						value={beehouseId}
						onChange={(e) => setBeehouseId(e.target.value)}>
						<option value=''>None</option>
						{beehouses.map((b) => (
							<option key={b.id} value={b.id}>
								{b.beehouse_id}
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

				<button type='submit' disabled={loading}>
					{loading ? 'Saving...' : 'Add Note'}
				</button>
			</div>
		</form>
	);
}
