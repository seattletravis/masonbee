import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as api from '../api/client';
import './JournalEntryForm.css';

function normalizeGardens(payload) {
	if (Array.isArray(payload)) return payload;
	if (Array.isArray(payload?.results)) return payload.results;
	return [];
}

function buildInitialFormState(entry, routeGardenId) {
	return {
		title: entry?.title || '',
		date: entry?.date || new Date().toISOString().split('T')[0],
		category: entry?.category || 'general',
		garden: entry?.garden || routeGardenId || '',
		notes: entry?.notes || '',
	};
}

export default function JournalEntryForm({
	isOpen,
	onClose,
	onSubmitSuccess,
	entry,
}) {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	// returnTo=/gardens/:id
	const returnTo = searchParams.get('returnTo') || null;
	const routeGardenId = searchParams.get('gardenId') || null;

	const isEditing = Boolean(entry?.id);
	const isGardenLocked = Boolean(routeGardenId);

	const [formData, setFormData] = useState(
		buildInitialFormState(entry, routeGardenId),
	);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState('');

	const [gardens, setGardens] = useState([]);
	const [isLoadingGardens, setIsLoadingGardens] = useState(false);
	const [gardensError, setGardensError] = useState('');

	const [selectedGarden, setSelectedGarden] = useState(null);

	// ------------------------------------------------------------
	// Load form state when entry changes OR form opens
	// ------------------------------------------------------------
	useEffect(() => {
		if (!isOpen) return;

		setFormData(buildInitialFormState(entry, routeGardenId));
		setSubmitError('');
	}, [entry, isOpen, routeGardenId]);

	// ------------------------------------------------------------
	// Load gardens (only when not locked)
	// ------------------------------------------------------------
	useEffect(() => {
		if (!isOpen || isGardenLocked) return;

		let isMounted = true;

		async function loadGardens() {
			setIsLoadingGardens(true);
			setGardensError('');

			try {
				const response = await api.get('/api/gardens/');
				if (isMounted) setGardens(normalizeGardens(response));
			} catch (error) {
				if (isMounted) {
					setGardensError(
						error?.response?.data?.detail ||
							error?.response?.data?.message ||
							'Unable to load gardens right now.',
					);
				}
			} finally {
				if (isMounted) setIsLoadingGardens(false);
			}
		}

		loadGardens();
		return () => {
			isMounted = false;
		};
	}, [isGardenLocked, isOpen]);

	// ------------------------------------------------------------
	// Load locked garden details
	// ------------------------------------------------------------
	useEffect(() => {
		if (!routeGardenId) return;

		let isMounted = true;

		async function loadGarden() {
			try {
				const data = await api.get(`/api/gardens/${routeGardenId}/`);
				if (isMounted) setSelectedGarden(data);
			} catch (err) {
				console.error('Failed to load garden', err);
			}
		}

		loadGarden();
		return () => {
			isMounted = false;
		};
	}, [routeGardenId]);

	// ------------------------------------------------------------
	// Garden name for locked mode
	// ------------------------------------------------------------
	const selectedGardenName = useMemo(() => {
		if (!isGardenLocked) return '';

		if (selectedGarden?.name) return selectedGarden.name;
		if (entry?.garden_name) return entry.garden_name;
		if (entry?.garden && typeof entry.garden === 'object' && entry.garden.name)
			return entry.garden.name;

		return `Garden #${routeGardenId}`;
	}, [isGardenLocked, selectedGarden, entry, routeGardenId]);

	// ------------------------------------------------------------
	// Cancel handler (respects returnTo)
	// ------------------------------------------------------------
	function handleCancel() {
		if (returnTo) {
			navigate(returnTo);
			return;
		}
		onClose();
	}

	// ------------------------------------------------------------
	// Form change handler
	// ------------------------------------------------------------
	const handleChange = (event) => {
		const { name, value } = event.target;

		setFormData((current) => ({
			...current,
			[name]: value,
		}));
	};

	// ------------------------------------------------------------
	// Submit handler
	// ------------------------------------------------------------
	const handleSubmit = async (event) => {
		event.preventDefault();
		setIsSubmitting(true);
		setSubmitError('');

		const payload = {
			title: formData.title.trim() || 'My Journal Entry',
			date: formData.date,
			category: formData.category,
			garden: formData.garden ? Number(formData.garden) : null,
			notes: formData.notes.trim(),
		};

		try {
			if (isEditing) {
				await api.updateJournalEntry(entry.id, payload);
			} else {
				await api.createJournalEntry(payload);
			}

			await onSubmitSuccess();

			if (returnTo) {
				navigate(returnTo);
			} else {
				onClose();
			}
		} catch (error) {
			const fieldErrors = error?.response?.data;

			if (typeof fieldErrors === 'string') {
				setSubmitError(fieldErrors);
			} else if (fieldErrors?.detail) {
				setSubmitError(fieldErrors.detail);
			} else if (fieldErrors && typeof fieldErrors === 'object') {
				const firstError = Object.values(fieldErrors).flat()[0];
				setSubmitError(firstError || 'Unable to save this journal entry.');
			} else {
				setSubmitError('Unable to save this journal entry.');
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	// ------------------------------------------------------------
	// RENDER
	// ------------------------------------------------------------
	if (!isOpen) return null;

	return (
		<div className='journal-entry-form'>
			<h2 className='form-title'>
				{isEditing ? 'Edit Journal Entry' : 'New Journal Entry'}
			</h2>

			<form onSubmit={handleSubmit}>
				{/* TITLE */}
				<label>
					Title
					<input
						type='text'
						name='title'
						value={formData.title}
						onChange={handleChange}
					/>
				</label>

				{/* DATE */}
				<label>
					Date
					<input
						type='date'
						name='date'
						value={formData.date}
						onChange={handleChange}
					/>
				</label>

				{/* CATEGORY */}
				<label>
					Category
					<select
						name='category'
						value={formData.category}
						onChange={handleChange}>
						<option value='general'>General Observation</option>
						<option value='bloom'>Bloom</option>
						<option value='bee_activity'>Bee Activity</option>
						<option value='maintenance'>Maintenance</option>
					</select>
				</label>

				{/* GARDEN SELECT */}
				{isGardenLocked ? (
					<p className='locked-garden-label'>
						<strong>Garden:</strong> {selectedGardenName}
					</p>
				) : (
					<label>
						Garden
						<select
							name='garden'
							value={formData.garden}
							onChange={handleChange}>
							<option value=''>Select a garden</option>
							{gardens.map((g) => (
								<option key={g.id} value={g.id}>
									{g.name}
								</option>
							))}
						</select>
					</label>
				)}

				{/* NOTES */}
				<label>
					Notes
					<textarea
						name='notes'
						value={formData.notes}
						onChange={handleChange}
					/>
				</label>

				{submitError && <p className='journal-feedback error'>{submitError}</p>}

				<div className='form-actions'>
					<button type='submit' className='submit-btn' disabled={isSubmitting}>
						{isSubmitting
							? 'Saving...'
							: isEditing
								? 'Update Entry'
								: 'Create Entry'}
					</button>

					<button type='button' className='cancel-btn' onClick={handleCancel}>
						Cancel
					</button>
				</div>
			</form>
		</div>
	);
}
