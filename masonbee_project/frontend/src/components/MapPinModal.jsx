// src/components/MapPinModal.jsx
import { useState } from 'react';
import MapPickerMap from './MapPickerMap';
import './MapPinModal.css';

export default function MapPinModal({ isOpen, onSelect, onClose }) {
	if (!isOpen) return null; // ⭐ THE FIX — modal only renders when open

	const [tempCoords, setTempCoords] = useState(null);

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
					the location.
				</p>

				<div className='map-container'>
					<MapPickerMap onTempChange={handleTempChange} />
				</div>

				<div className='modal-actions'>
					<button className='button button-secondary' onClick={onClose}>
						Cancel
					</button>

					<button
						className='button button-primary'
						disabled={!tempCoords}
						onClick={handleUseLocation}>
						Use This Location
					</button>
				</div>
			</div>
		</div>
	);
}
