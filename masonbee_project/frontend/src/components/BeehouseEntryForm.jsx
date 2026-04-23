import { useState, useEffect } from 'react';
import './BeehouseEntryForm.css';

export default function BeehouseEntryForm({
	gardenId,
	onCreated,
	onClose,
	editingBeehouse,
}) {
	const API_BASE = import.meta.env.VITE_API_BASE_URL;
	const token = localStorage.getItem('access');

	// -----------------------------
	// Form State
	// -----------------------------
	const [name, setName] = useState('');
	const [beehouseType, setBeehouseType] = useState('');
	const [tubeCapacity, setTubeCapacity] = useState('');
	const [heightInches, setHeightInches] = useState('');
	const [orientation, setOrientation] = useState('');
	const [beehouseStatus, setBeehouseStatus] = useState('inactive');

	const [latitude, setLatitude] = useState('');
	const [longitude, setLongitude] = useState('');

	const [gardenDescription, setGardenDescription] = useState('');

	const [waterNearby, setWaterNearby] = useState(false);
	const [clayNearby, setClayNearby] = useState(false);
	const [flowersNearby, setFlowersNearby] = useState(false);
	const [woodsNearby, setWoodsNearby] = useState(false);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	// -----------------------------
	// Constants
	// -----------------------------
	const HOUSE_TYPES = [
		{ value: 'block', label: 'Wood Block' },
		{ value: 'straw', label: 'Straw Bundle / Container' },
		{ value: 'drilled', label: 'Drilled Wood' },
		{ value: 'other', label: 'Other' },
	];

	const TUBE_CAPACITY = [
		{ value: '<100', label: 'Less than 100 tubes' },
		{ value: '<200', label: 'Less than 200 tubes' },
		{ value: '<300', label: 'Less than 300 tubes' },
		{ value: '>300', label: 'More than 300 tubes' },
	];

	const ORIENTATIONS = ['North', 'South', 'East', 'West'];

	// -----------------------------
	// Preload form when editing
	// -----------------------------
	useEffect(() => {
		if (editingBeehouse) {
			setName(editingBeehouse.name || '');
			setGardenDescription(editingBeehouse.garden_description || '');
			setBeehouseType(editingBeehouse.beehouse_type || '');
			setTubeCapacity(editingBeehouse.tube_capacity || '');
			setHeightInches(editingBeehouse.height_above_ground_inches || '');
			setOrientation(editingBeehouse.orientation || '');
			setLatitude(editingBeehouse.latitude || '');
			setLongitude(editingBeehouse.longitude || '');
			setWaterNearby(editingBeehouse.water_nearby || false);
			setClayNearby(editingBeehouse.clay_nearby || false);
			setFlowersNearby(editingBeehouse.flowers_nearby || false);
			setWoodsNearby(editingBeehouse.woods_nearby || false);
			setBeehouseStatus(editingBeehouse.beehouse_status || 'inactive');
		}
	}, [editingBeehouse]);

	// -----------------------------
	// Use current location
	// -----------------------------
	const useCurrentLocation = () => {
		if (!navigator.geolocation) {
			setError('Geolocation not supported.');
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(pos) => {
				setLatitude(pos.coords.latitude.toFixed(6));
				setLongitude(pos.coords.longitude.toFixed(6));
			},
			() => setError('Unable to retrieve location.'),
		);
	};

	// -----------------------------
	// Submit Handler
	// -----------------------------
	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		const latNum = Number(latitude);
		const lonNum = Number(longitude);

		const finalName = name.trim() || `Beehouse ${Date.now()}`;

		const payload = {
			name: finalName,
			garden: Number(gardenId),
			garden_description: gardenDescription || '',
			beehouse_type: beehouseType,
			tube_capacity: tubeCapacity,
			height_above_ground_inches: Number(heightInches),
			latitude: latNum,
			longitude: lonNum,
			orientation: orientation || null,
			water_nearby: waterNearby,
			clay_nearby: clayNearby,
			flowers_nearby: flowersNearby,
			woods_nearby: woodsNearby,
			beehouse_status: beehouseStatus,
			is_active: false,
		};

		try {
			let res;

			if (editingBeehouse) {
				// EDIT MODE — PUT
				res = await fetch(`${API_BASE}/api/beehouses/${editingBeehouse.id}/`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify(payload),
				});
			} else {
				// CREATE MODE — POST
				res = await fetch(`${API_BASE}/api/beehouses/`, {
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
				setError(
					data?.detail ||
						data?.message ||
						JSON.stringify(data) ||
						'Failed to save beehouse.',
				);
				setLoading(false);
				return;
			}

			onCreated?.(data);
			setLoading(false);
		} catch (err) {
			setError('Network error.');
			setLoading(false);
		}
	};

	// -----------------------------
	// Render
	// -----------------------------
	return (
		<form className='beehouse-entry-form' onSubmit={handleSubmit}>
			<h3>{editingBeehouse ? 'Edit Beehouse' : 'Add Beehouse'}</h3>

			{error && <div className='error-text'>{error}</div>}

			<div className='form-grid'>
				<label>
					New Beehouse Name (optional)
					<input
						type='text'
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder='Leave blank to auto‑assign'
					/>
				</label>

				<label>
					Garden Description
					<input
						type='text'
						value={gardenDescription}
						onChange={(e) => setGardenDescription(e.target.value)}
						placeholder='e.g., Near the shed, south fence line'
					/>
				</label>

				<label>
					Bee House Type *
					<select
						required
						value={beehouseType}
						onChange={(e) => setBeehouseType(e.target.value)}>
						<option value=''>Select type</option>
						{HOUSE_TYPES.map((t) => (
							<option key={t.value} value={t.value}>
								{t.label}
							</option>
						))}
					</select>
				</label>

				<label>
					Tube Capacity *
					<select
						required
						value={tubeCapacity}
						onChange={(e) => setTubeCapacity(e.target.value)}>
						<option value=''>Select capacity</option>
						{TUBE_CAPACITY.map((t) => (
							<option key={t.value} value={t.value}>
								{t.label}
							</option>
						))}
					</select>
				</label>

				<label>
					Height Above Ground (inches) *
					<input
						required
						type='number'
						value={heightInches}
						onChange={(e) => setHeightInches(e.target.value)}
					/>
				</label>

				<label>
					Orientation
					<select
						value={orientation}
						onChange={(e) => setOrientation(e.target.value)}>
						<option value=''>None</option>
						{ORIENTATIONS.map((o) => (
							<option key={o} value={o}>
								{o}
							</option>
						))}
					</select>
				</label>

				<label>
					Latitude *
					<input
						required
						type='text'
						value={latitude}
						onChange={(e) => setLatitude(e.target.value)}
					/>
				</label>

				<label>
					Longitude *
					<input
						required
						type='text'
						value={longitude}
						onChange={(e) => setLongitude(e.target.value)}
					/>
				</label>

				<button type='button' onClick={useCurrentLocation}>
					Use Current Location
				</button>

				<label>Bee Environment (within 100ft)</label>
				<div className='checkbox-group'>
					<label>
						<input
							type='checkbox'
							checked={waterNearby}
							onChange={(e) => setWaterNearby(e.target.checked)}
						/>
						Water source nearby
					</label>

					<label>
						<input
							type='checkbox'
							checked={clayNearby}
							onChange={(e) => setClayNearby(e.target.checked)}
						/>
						Exposed natural clay nearby
					</label>

					<label>
						<input
							type='checkbox'
							checked={flowersNearby}
							onChange={(e) => setFlowersNearby(e.target.checked)}
						/>
						Early-season flowering trees/shrubs nearby
					</label>

					<label>
						<input
							type='checkbox'
							checked={woodsNearby}
							onChange={(e) => setWoodsNearby(e.target.checked)}
						/>
						Wooded area nearby
					</label>
				</div>

				<button type='submit' disabled={loading}>
					{loading
						? 'Saving...'
						: editingBeehouse
							? 'Save Changes'
							: 'Add Beehouse'}
				</button>

				<button type='button' className='cancel-button' onClick={onClose}>
					Cancel
				</button>
			</div>
		</form>
	);
}
