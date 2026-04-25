import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import './MapPickerMap.css';

// --------------------------------------
// Bee Pin Icon
// --------------------------------------
const beeIcon = new L.Icon({
	iconUrl: new URL('../assets/leaflet/bee-marker.png', import.meta.url).href,
	iconSize: [40, 40],
	iconAnchor: [20, 40],
});
const gpsIcon = (
	<svg width='22' height='22' viewBox='0 0 24 24' fill='none'>
		<circle cx='12' cy='12' r='3' stroke='#333' strokeWidth='2' />
		<path d='M12 2v3M12 19v3M2 12h3M19 12h3' stroke='#333' strokeWidth='2' />
	</svg>
);

// --------------------------------------
// Auto-resize when modal opens (runs once)
// --------------------------------------
function ResizeOnMount({ initialPosition }) {
	const map = useMap();

	useEffect(() => {
		if (!initialPosition) return;

		setTimeout(() => {
			map.invalidateSize();
			map.setView(initialPosition, 17, { animate: false });
		}, 300);
	}, [initialPosition]); // <-- only run when initialPosition becomes available

	return null;
}

// --------------------------------------
// MAIN COMPONENT
// --------------------------------------
export default function MapPickerMap({ onSelect }) {
	const defaultCenter = [47.6062, -122.3321]; // Seattle fallback

	const [position, setPosition] = useState(defaultCenter);
	const [initialPosition, setInitialPosition] = useState(null);
	const [mapInstance, setMapInstance] = useState(null);

	// Get user location ONCE
	useEffect(() => {
		if (!navigator.geolocation) return;

		navigator.geolocation.getCurrentPosition(
			(pos) => {
				const lat = pos.coords.latitude;
				const lon = pos.coords.longitude;

				const userPos = [lat, lon];

				setPosition(userPos);
				setInitialPosition(userPos);
				onSelect?.(lat, lon);

				if (mapInstance) {
					mapInstance.setView(userPos, 17, { animate: false });
				}
			},
			() => {
				// If denied, fallback to Seattle
			},
		);
	}, [mapInstance]);

	// Stop animations when unmounting
	useEffect(() => {
		return () => {
			if (mapInstance) {
				mapInstance.stop();
			}
		};
	}, [mapInstance]);

	// Fallback if geolocation never returns
	useEffect(() => {
		const fallback = setTimeout(() => {
			if (!initialPosition) {
				setInitialPosition(defaultCenter);
			}
		}, 300);

		return () => clearTimeout(fallback);
	}, [initialPosition]);

	// Attach click handler AFTER map is fully ready
	useEffect(() => {
		if (!mapInstance) return;

		mapInstance.on('click', handleMapClick);

		return () => {
			mapInstance.off('click', handleMapClick);
		};
	}, [mapInstance]);

	// When user drags the pin
	function handleDragEnd(e) {
		const lat = e.target.getLatLng().lat;
		const lon = e.target.getLatLng().lng;
		setPosition([lat, lon]);
		onSelect?.(lat, lon);
	}

	// When user clicks the map
	function handleMapClick(e) {
		const lat = e.latlng.lat;
		const lon = e.latlng.lng;
		setPosition([lat, lon]);
		onSelect?.(lat, lon);
	}

	return (
		<div className='map-picker-container'>
			{initialPosition && (
				<MapContainer
					center={initialPosition}
					zoom={17}
					scrollWheelZoom={true}
					className='map-picker-map'
					whenCreated={(map) => {
						setMapInstance(map);
					}}>
					<ResizeOnMount initialPosition={initialPosition} />

					<TileLayer
						attribution='&copy; OpenStreetMap contributors'
						url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
					/>

					<Marker
						position={position}
						icon={beeIcon}
						draggable={true}
						eventHandlers={{
							dragend: handleDragEnd,
						}}
					/>

					{/* ⭐ Floating button goes HERE */}
					<div className='center-button'>📍</div>
				</MapContainer>
			)}
		</div>
	);
}
