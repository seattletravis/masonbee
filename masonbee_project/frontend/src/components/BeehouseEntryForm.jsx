// src/components/BeehouseEntryForm.jsx
import { useEffect, useState } from 'react';
import * as api from '../api/client';
import './BeehouseEntryForm.css';

export default function BeehouseEntryForm({
	editingBeehouse,
	onCreated,
	onClose,
	onOpenMapPicker,
	isCollapsed,
	setIsCollapsed,
}) {
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [type, setType] = useState('');
	const [capacity, setCapacity] = useState('');
	const [height, setHeight] = useState('');
	const [orientation, setOrientation] = useState('');
	const [latitude, setLatitude] = useState('');
	const [longitude, setLongitude] = useState('');

	const [waterNearby, setWaterNearby] = useState(false);
	const [clayNearby, setClayNearby] = useState(false);
	const [flowersNearby, setFlowersNearby] = useState(false);
	const [woodsNearby, setWoodsNearby] = useState(false);

	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState('');

	// ------------------------------------------------------------
	// Load editing data
	// ------------------------------------------------------------
	useEffect(() => {
		if (editingBeehouse) {
			setIsCollapsed(false);

			setName(editingBeehouse.name || '');
			setDescription(editingBeehouse.garden_description || '');
			setType(editingBeehouse.type || '');
			setCapacity(editingBeehouse.tube_capacity || '');
			setHeight(editingBeehouse.height_inches || '');
			setOrientation(editingBeehouse.orientation || '');
			setLatitude(editingBeehouse.latitude || '');
			setLongitude(editingBeehouse.longitude || '');

			setWaterNearby(editingBeehouse.water_nearby || false);
			setClayNearby(editingBeehouse.clay_nearby || false);
			setFlowersNearby(editingBeehouse.flowers_nearby || false);
			setWoodsNearby(editingBeehouse.woods_nearby || false);
		}
	}, [editingBeehouse, setIsCollapsed]);

	// ------------------------------------------------------------
	// Map Picker Integration
	// ------------------------------------------------------------
	const handleOpenMapPicker = () => {
		onOpenMapPicker((lat, lon) => {
			setLatitude(lat);
			setLongitude(lon);
		});
	};

	// ------------------------------------------------------------
	// Use Current Location
	// ------------------------------------------------------------
	const handleUseCurrentLocation = () => {
		if (!navigator.geolocation) return;

		navigator.geolocation.getCurrentPosition(
			(pos) => {
				setLatitude(pos.coords.latitude.toFixed(6));
				setLongitude(pos.coords.longitude.toFixed(6));
			},
			() => setError('Unable to retrieve your location.'),
		);
	};

	// ------------------------------------------------------------
	// Save Beehouse
	// ------------------------------------------------------------
	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsSaving(true);
		setError('');

		const payload = {
			name,
			garden_description: description,
			beehouse_type: type, // FIXED
			tube_capacity: capacity, // FIXED
			height_above_ground_inches: height, // FIXED
			orientation,
			latitude: Number(latitude).toFixed(6), // FIXED
			longitude: Number(longitude).toFixed(6), // FIXED
			water_nearby: waterNearby,
			clay_nearby: clayNearby,
			flowers_nearby: flowersNearby,
			woods_nearby: woodsNearby,
		};

		try {
			if (editingBeehouse) {
				await api.patch(`/api/beehouses/${editingBeehouse.id}/`, payload);
			} else {
				await api.post('/api/beehouses/', payload);
			}

			onCreated();
			setIsCollapsed(true);
		} catch (err) {
			setError(
				err?.response?.data?.detail ||
					err?.response?.data?.message ||
					err?.message ||
					'Unable to save beehouse.',
			);
		} finally {
			setIsSaving(false);
		}
	};

	// ------------------------------------------------------------
	// Collapsed state
	// ------------------------------------------------------------
	if (isCollapsed) {
		return (
			<div className='beehouse-form-collapsed'>
				<button
					className='button button-primary'
					onClick={() => setIsCollapsed(false)}>
					+ Add Beehouse
				</button>
			</div>
		);
	}

	// ------------------------------------------------------------
	// RENDER FULL FORM
	// ------------------------------------------------------------
	return (
		<form className='beehouse-form' onSubmit={handleSubmit}>
			<h2 className='beehouse-form-header'>
				{editingBeehouse ? 'Edit Beehouse' : 'Add Beehouse'}
			</h2>
			{/* BASIC INFO */}
			<h3 className='form-section-title'>Basic Information</h3>
			<div className='form-section'>
				<label>
					Name (optional)
					<input
						type='text'
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder='Leave blank to auto-assign'
					/>
				</label>

				<label>
					Description
					<input
						type='text'
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder='e.g., Near the shed, south fence'
					/>
				</label>

				<label>
					Bee House Type *
					<select
						value={type}
						onChange={(e) => setType(e.target.value)}
						required>
						<option value=''>Select type</option>
						<option value='block'>Wood Block</option>
						<option value='straw'>Straw Bundle or Container</option>
						<option value='drilled'>Drilled Wood</option>
						<option value='other'>Other</option>
					</select>
				</label>

				<label>
					Tube Capacity *
					<select
						value={capacity}
						onChange={(e) => setCapacity(e.target.value)}
						required>
						<option value=''>Select capacity</option>
						<option value='<100'>Less than 100 tubes</option>
						<option value='<200'>Less than 200 tubes</option>
						<option value='<300'>Less than 300 tubes</option>
						<option value='>300'>More than 300 tubes</option>
					</select>
				</label>

				<label>
					Height Above Ground (inches) *
					<input
						type='number'
						value={height}
						onChange={(e) => setHeight(e.target.value)}
						required
					/>
				</label>

				<label>
					Orientation
					<select
						value={orientation}
						onChange={(e) => setOrientation(e.target.value)}>
						<option value=''>None</option>
						<option value='North'>North</option>
						<option value='South'>South</option>
						<option value='East'>East</option>
						<option value='West'>West</option>
					</select>
				</label>
			</div>

			{/* ENVIRONMENT */}
			<h3 className='form-section-title'>Bee Environment</h3>
			<div className='form-section environment-section'>
				<label>
					<input
						type='checkbox'
						checked={waterNearby}
						onChange={(e) => setWaterNearby(e.target.checked)}
					/>
					Water source nearby - Check box if there's a nearby lake, creek, river
					or pond.
				</label>

				<label>
					<input
						type='checkbox'
						checked={clayNearby}
						onChange={(e) => setClayNearby(e.target.checked)}
					/>
					Clay nearby - Exposed clay, soil, or mud is good for mason bees.
				</label>

				<label>
					<input
						type='checkbox'
						checked={flowersNearby}
						onChange={(e) => setFlowersNearby(e.target.checked)}
					/>
					Flowers nearby - Without early season flowers mason bees won't stop to
					visit.
				</label>

				<label>
					<input
						type='checkbox'
						checked={woodsNearby}
						onChange={(e) => setWoodsNearby(e.target.checked)}
					/>
					Woods nearby - Woodlands, wooded lots, dense brush, thickets or
					wilderness.
				</label>
			</div>

			{/* LOCATION */}
			<h3 className='form-section-title'>Location</h3>
			<div className='form-section'>
				<label>
					Latitude *
					<input
						type='number'
						step='0.000001'
						value={latitude}
						onChange={(e) => setLatitude(e.target.value)}
						required
					/>
				</label>

				<label>
					Longitude *
					<input
						type='number'
						step='0.000001'
						value={longitude}
						onChange={(e) => setLongitude(e.target.value)}
						required
					/>
				</label>

				<div className='location-buttons'>
					<button
						type='button'
						className='button button-secondary'
						onClick={handleUseCurrentLocation}>
						Use Current Location
					</button>

					<button
						type='button'
						className='button button-primary'
						onClick={handleOpenMapPicker}>
						Select on Map
					</button>
				</div>
			</div>

			{error && <p className='form-error'>{error}</p>}

			<div className='form-actions'>
				<button className='button button-primary' disabled={isSaving}>
					{isSaving
						? 'Saving...'
						: editingBeehouse
							? 'Save Changes'
							: 'Create Beehouse'}
				</button>

				<button
					type='button'
					className='button button-secondary'
					onClick={() => {
						setIsCollapsed(true);
						onClose();
					}}
					disabled={isSaving}>
					Cancel
				</button>
			</div>
		</form>
	);
}
