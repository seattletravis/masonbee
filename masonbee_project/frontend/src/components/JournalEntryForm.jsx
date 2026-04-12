import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as api from '../api/client';
import { createJournalEntry, updateJournalEntry } from '../api/journal';

const CATEGORY_OPTIONS = [
	{ value: 'bee_activity', label: 'Bee Activity' },
	{ value: 'bloom', label: 'Bloom / Flowering' },
	{ value: 'maintenance', label: 'Maintenance' },
	{ value: 'observation', label: 'General Observation' },
	{ value: 'weather', label: 'Weather Note' },
	{ value: 'other', label: 'Other' },
];

const EMPTY_FORM = {
	title: '',
	date: '',
	category: 'observation',
	garden: '',
	notes: '',
};

function normalizeGardens(payload) {
	if (Array.isArray(payload)) {
		return payload;
	}

	if (Array.isArray(payload?.results)) {
		return payload.results;
	}

	return [];
}

function buildInitialFormState(entry, routeGardenId) {
	if (entry) {
		return {
			title: entry.title || '',
			date: entry.date || '',
			category: entry.category || 'observation',
			garden:
				entry.garden === null || entry.garden === undefined
					? routeGardenId || ''
					: String(entry.garden),
			notes: entry.notes || '',
		};
	}

	return {
		...EMPTY_FORM,
		garden: routeGardenId || '',
	};
}

function JournalEntryForm({ isOpen, onClose, onSubmitSuccess, entry = null }) {
	const { id: routeGardenId } = useParams();
	const [formData, setFormData] = useState(() =>
		buildInitialFormState(entry, routeGardenId),
	);
	const [gardens, setGardens] = useState([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoadingGardens, setIsLoadingGardens] = useState(false);
	const [submitError, setSubmitError] = useState('');
	const [gardensError, setGardensError] = useState('');

	const isGardenLocked = Boolean(routeGardenId);
	const dialogTitle = entry ? 'Edit Entry' : 'New Entry';

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		setFormData(buildInitialFormState(entry, routeGardenId));
		setSubmitError('');
	}, [entry, isOpen, routeGardenId]);

	useEffect(() => {
		if (!isOpen || isGardenLocked) {
			return;
		}

		let isMounted = true;

		const loadGardens = async () => {
			setIsLoadingGardens(true);
			setGardensError('');

			try {
				const response = await api.get('/api/gardens/');
				if (!isMounted) {
					return;
				}

				setGardens(normalizeGardens(response.data));
			} catch (error) {
				if (!isMounted) {
					return;
				}

				setGardensError(
					error?.response?.data?.detail ||
						error?.response?.data?.message ||
						'Unable to load gardens right now.',
				);
			} finally {
				if (isMounted) {
					setIsLoadingGardens(false);
				}
			}
		};

		loadGardens();

		return () => {
			isMounted = false;
		};
	}, [isGardenLocked, isOpen]);

	const selectedGardenName = useMemo(() => {
		if (!isGardenLocked) {
			return '';
		}

		if (entry?.garden_name) {
			return entry.garden_name;
		}

		if (
			entry?.garden &&
			typeof entry.garden === 'object' &&
			entry.garden.name
		) {
			return entry.garden.name;
		}

		return `Garden #${routeGardenId}`;
	}, [entry, isGardenLocked, routeGardenId]);

	if (!isOpen) {
		return null;
	}

	const handleChange = (event) => {
		const { name, value } = event.target;

		setFormData((currentFormData) => ({
			...currentFormData,
			[name]: value,
		}));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setIsSubmitting(true);
		setSubmitError('');

		const payload = {
			title: formData.title.trim(),
			date: formData.date,
			category: formData.category,
			garden: formData.garden ? Number(formData.garden) : null,
			notes: formData.notes.trim(),
		};

		try {
			if (entry?.id) {
				await updateJournalEntry(entry.id, payload);
			} else {
				await createJournalEntry(payload);
			}

			await onSubmitSuccess();
			onClose();
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

	return (
		<div
			className='journal-modal-backdrop'
			role='presentation'
			onClick={(event) => {
				if (event.target === event.currentTarget) {
					onClose();
				}
			}}>
			<div
				className='journal-modal'
				role='dialog'
				aria-modal='true'
				aria-labelledby='journal-entry-form-title'>
				<div className='journal-modal-header'>
					<div>
						<h2 id='journal-entry-form-title'>{dialogTitle}</h2>
						<p>Capture what happened in your garden today.</p>
					</div>
					<button
						type='button'
						className='journal-icon-button'
						onClick={onClose}
						aria-label='Close journal form'>
						X
					</button>
				</div>

				<form className='journal-form' onSubmit={handleSubmit}>
					{submitError ? (
						<p className='journal-feedback error'>{submitError}</p>
					) : null}

					<div className='journal-form-grid'>
						<label className='journal-field'>
							<span>Title</span>
							<input
								type='text'
								name='title'
								value={formData.title}
								onChange={handleChange}
								placeholder='Early bloom activity near the bee house'
								required
							/>
						</label>

						<label className='journal-field'>
							<span>Date</span>
							<input
								type='date'
								name='date'
								value={formData.date}
								onChange={handleChange}
								required
							/>
						</label>

						<label className='journal-field'>
							<span>Category</span>
							<select
								name='category'
								value={formData.category}
								onChange={handleChange}
								required>
								{CATEGORY_OPTIONS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
						</label>

						{isGardenLocked ? (
							<div className='journal-field'>
								<span>Garden</span>
								<div className='journal-readonly-field'>
									{selectedGardenName}
								</div>
							</div>
						) : (
							<label className='journal-field'>
								<span>Garden</span>
								<select
									name='garden'
									value={formData.garden}
									onChange={handleChange}
									disabled={isLoadingGardens}>
									<option value=''>No garden selected</option>
									{gardens.map((garden) => (
										<option key={garden.id} value={garden.id}>
											{garden.name}
										</option>
									))}
								</select>
								{gardensError ? (
									<small className='journal-inline-error'>{gardensError}</small>
								) : null}
							</label>
						)}
					</div>

					<label className='journal-field'>
						<span>Notes</span>
						<textarea
							name='notes'
							value={formData.notes}
							onChange={handleChange}
							rows='6'
							placeholder='Record bee behavior, blooms, weather, maintenance, or anything worth remembering.'
							required
						/>
					</label>

					<div className='journal-form-actions'>
						<button
							type='button'
							className='journal-button journal-button-secondary'
							onClick={onClose}
							disabled={isSubmitting}>
							Cancel
						</button>
						<button
							type='submit'
							className='journal-button journal-button-primary'
							disabled={isSubmitting}>
							{isSubmitting
								? 'Saving...'
								: entry
									? 'Save Changes'
									: 'Create Entry'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

export default JournalEntryForm;
