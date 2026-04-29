// src/components/MapPinModal.jsx
import { useState } from 'react';
import MapPickerMap from './MapPickerMap';
import './MapPinModal.css';

export default function MapPinModal({
	isOpen,
	onSelect,
	onClose,
	initialLocation,
}) {
	if (!isOpen) return null; // ⭐ THE FIX — modal only renders when open

	const [tempCoords, setTempCoords] = useState(
		initialLocation
			? { lat: initialLocation.lat, lon: initialLocation.lon }
			: null,
	);

	function handleTempChange(lat, lon) {
		setTempCoords({ lat, lon });
	}

	function handleUseLocation() {
		if (!tempCoords) return;
		onSelect(tempCoords.lat, tempCoords.lon);
		onClose();
	}

	return (
		<div className='modal-backdrop'>
			<div className='modal'>
				<h2>Select Location</h2>

				<p>
					Click anywhere on the map to drop your bee or drag the bee to adjust
					the location. Please select a location to start or allow the app to
					access your location.
				</p>

				<div className='map-container'>
					<MapPickerMap
						onTempChange={handleTempChange}
						initialLocation={initialLocation}
					/>
				</div>

				<div className='modal-actions'>
					<button className='button button-secondary' onClick={onClose}>
						Cancel
					</button>

					<button
						className='button button-primary'
						disabled={!tempCoords}
						onClick={handleUseLocation}>
						{!tempCoords ? 'Move Bee Pin on Map to Start' : 'Use This Location'}
					</button>
				</div>
			</div>
		</div>
	);
}
