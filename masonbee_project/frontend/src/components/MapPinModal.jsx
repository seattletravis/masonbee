import { useState } from 'react';
// import SingleGardenMap from './SingleGardenMap';
import MapPickerMap from './MapPickerMap';
import './MapPinModal.css';

export default function MapPinModal({ onSelect, onClose }) {
	const [tempCoords, setTempCoords] = useState(null);

	function handleMapClick(lat, lon) {
		setTempCoords({ lat, lon });
	}

	return (
		<div className='modal-backdrop'>
			<div className='modal'>
				<h2>Select Location</h2>

				<p>
					Click anywhere on the map to drop your bee or click the bee to drag it
					to a new place. The beestinger is the pinpoint for where the beehouse
					is located.
				</p>

				<div className='map-container'>
					<MapPickerMap onSelect={handleMapClick} />
				</div>

				<div className='modal-actions'>
					<button className='button button-secondary' onClick={onClose}>
						Cancel
					</button>

					<button
						className='button button-primary'
						disabled={!tempCoords}
						onClick={() => onSelect(tempCoords.lat, tempCoords.lon)}>
						Use This Location
					</button>
				</div>
			</div>
		</div>
	);
}
