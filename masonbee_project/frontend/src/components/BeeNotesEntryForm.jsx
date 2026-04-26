import { useState, useEffect } from 'react';
import './BeeNotesEntryForm.css';

export default function BeeNotesEntryForm({
	onCreated,
	onClose,
	editingNote,
	noteFormMode = 'normal', // "normal" | "remove"
	beehouseName,
	beehouseId: forcedBeehouseId,
}) {
	const isEditing = Boolean(editingNote);
	const isRemoveMode = noteFormMode === 'remove';

	const [eventType, setEventType] = useState(
		editingNote ? editingNote.event_type : isRemoveMode ? 'destroyed' : '',
	);

	const [beehouseId, setBeehouseId] = useState(
		editingNote?.beehouse ?? forcedBeehouseId ?? '',
	);

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

	// Load beehouses only in normal mode
	useEffect(() => {
		if (isRemoveMode) return;

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
	}, [API_BASE, token, isRemoveMode]);

	// Sync beehouseId when a beehouse card triggers Add Bee Note
	useEffect(() => {
		if (!isEditing && forcedBeehouseId) {
			setBeehouseId(forcedBeehouseId);
		}
	}, [forcedBeehouseId, isEditing]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');

		if (!beehouseId) {
			setError('Beehouse is required.');
			return;
		}

		if (!notes.trim() && !isRemoveMode) {
			setError('Notes cannot be empty.');
			return;
		}

		setLoading(true);

		const payload = {
			event_type: isRemoveMode ? 'destroyed' : eventType,
			beehouse: Number(beehouseId),
			notes: notes.trim(),
		};

		const isEditingNote = Boolean(editingNote?.id);

		try {
			let res;

			if (isEditingNote) {
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

			if (!isEditingNote) {
				setEventType(isRemoveMode ? 'destroyed' : '');
				setBeehouseId(isRemoveMode ? forcedBeehouseId : '');
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
			<h3>
				{noteFormMode === 'remove'
					? 'Remove Beehouse'
					: isEditing
						? 'Edit Beenote'
						: 'Add Beenote'}
			</h3>

			{isRemoveMode && (
				<div className='remove-warning'>
					You are removing <strong>"{beehouseName}"</strong>. This action cannot
					be undone. Once you submit this form, the beehouse and all associated
					notes will not be accessible.
				</div>
			)}

			{error && <div className='error-text'>{error}</div>}

			<div className='form-grid'>
				{/* Event Type — hidden in remove mode */}
				{!isRemoveMode && (
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
				)}

				{/* Beehouse field — read-only in remove mode */}
				{isRemoveMode ? (
					<label>
						Beehouse
						<input type='text' value={beehouseName} readOnly />
					</label>
				) : (
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
				)}

				<label className='full-width'>
					{isRemoveMode ? 'Reason for removal *' : 'Notes (optional)'}
					<textarea
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						rows={4}
						placeholder={
							isRemoveMode
								? 'Explain why this beehouse is being removed...'
								: 'Add details about the event...'
						}
					/>
				</label>

				<div className='form-actions'>
					<button type='submit' disabled={loading}>
						{loading
							? 'Saving...'
							: isRemoveMode
								? 'Remove Beehouse'
								: isEditing
									? 'Save Changes'
									: 'Add Note'}
					</button>

					<button type='button' className='cancel-button' onClick={onClose}>
						Cancel
					</button>
				</div>
			</div>
		</form>
	);
}
