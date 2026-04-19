import { useState, useEffect } from 'react';

export default function BeehouseEntryForm({ gardenId, onCreated }) {
	const API_BASE = import.meta.env.VITE_API_BASE_URL;
	const token = localStorage.getItem('access');

	const [beehouseType, setBeehouseType] = useState('');
	const [tubeCapacity, setTubeCapacity] = useState('');
	const [heightInches, setHeightInches] = useState('');
	const [orientation, setOrientation] = useState('');
	const [latitude, setLatitude] = useState('');
	const [longitude, setLongitude] = useState('');

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [customBeehouseId, setCustomBeehouseId] = useState('');
	useEffect(() => {
		console.log('customBeehouseId:', customBeehouseId);
	}, [customBeehouseId]);
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

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		// Validate required fields
		if (!beehouseType || !tubeCapacity || !heightInches) {
			setError('Please fill all required fields.');
			setLoading(false);
			return;
		}

		const latNum = Number(latitude);
		const lonNum = Number(longitude);

		if (isNaN(latNum) || isNaN(lonNum)) {
			setError('Latitude and longitude must be valid numbers.');
			setLoading(false);
			return;
		}

		console.log('SUBMIT customBeehouseId:', customBeehouseId);

		// Log payload AFTER validation
		const payload = {
			garden: Number(gardenId),
			beehouse_id: customBeehouseId || null,
			beehouse_type: beehouseType,
			tube_capacity: tubeCapacity,
			height_above_ground_inches: Number(heightInches),
			latitude: latNum,
			longitude: lonNum,
			orientation: orientation || null,
			is_active: false,
		};
		console.log('PAYLOAD SENT:', payload);

		try {
			const res = await fetch(`${API_BASE}/api/beehouses/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(payload),
			});

			const data = await res.json();

			if (!res.ok) {
				setError(
					data?.detail ||
						data?.message ||
						JSON.stringify(data) ||
						'Failed to create beehouse.',
				);
				setLoading(false);
				return;
			}

			// Notify parent
			onCreated?.(data);

			// Reset form
			setBeehouseType('');
			setTubeCapacity('');
			setHeightInches('');
			setOrientation('');
			setLatitude('');
			setLongitude('');

			setLoading(false);
		} catch (err) {
			console.error('Network error:', err);
			setError('Network error.');
			setLoading(false);
		}
	};

	return (
		<form className='beehouse-entry-form' onSubmit={handleSubmit}>
			{error && <div className='error'>{error}</div>}
			<label>Custom Beehouse ID (optional)</label>
			<input
				type='text'
				value={customBeehouseId}
				onChange={(e) => setCustomBeehouseId(e.target.value)}
				placeholder='Leave blank to auto‑assign'
			/>

			<label>Bee House Type *</label>
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

			<label>Tube Capacity *</label>
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

			<label>Height Above Ground (inches) *</label>
			<input
				required
				type='number'
				value={heightInches}
				onChange={(e) => setHeightInches(e.target.value)}
			/>

			<label>Orientation</label>
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

			<label>Latitude *</label>
			<input
				required
				type='text'
				value={latitude}
				onChange={(e) => setLatitude(e.target.value)}
			/>

			<label>Longitude *</label>
			<input
				required
				type='text'
				value={longitude}
				onChange={(e) => setLongitude(e.target.value)}
			/>

			<button type='button' onClick={useCurrentLocation}>
				Use Current Location
			</button>

			<button type='submit' disabled={loading}>
				{loading ? 'Saving...' : 'Add Bee House'}
			</button>
		</form>
	);
}
