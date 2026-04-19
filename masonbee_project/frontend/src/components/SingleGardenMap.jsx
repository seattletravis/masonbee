import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import './SingleGardenMap.css';

// ---------------------------
// Icons
// ---------------------------
const gardenIcon = new L.Icon({
	iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/green-dot.png',
	iconSize: [32, 32],
	iconAnchor: [16, 32],
});

const userIcon = new L.Icon({
	iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png',
	iconSize: [40, 40],
	iconAnchor: [20, 20],
});

// ---------------------------
// Fly-to animation
// ---------------------------
function FlyToGarden({ garden }) {
	const map = useMap();

	useEffect(() => {
		if (!garden?.latitude || !garden?.longitude) return;

		map.flyTo([garden.latitude, garden.longitude], 15, {
			duration: 1.2,
		});
	}, [garden, map]);

	return null;
}

// ---------------------------
// MAIN COMPONENT
// ---------------------------
export default function SingleGardenMap({ garden, userLocation }) {
	if (!garden?.latitude || !garden?.longitude) {
		return <p>Map unavailable — this garden has no coordinates.</p>;
	}

	const center = [garden.latitude, garden.longitude];

	return (
		<div className='single-garden-map-container'>
			<MapContainer
				center={center}
				zoom={14}
				scrollWheelZoom={true}
				className='single-garden-map'>
				<FlyToGarden garden={garden} />

				<TileLayer
					attribution='&copy; OpenStreetMap contributors'
					url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
				/>

				{/* Garden marker */}
				<Marker
					position={[garden.latitude, garden.longitude]}
					icon={gardenIcon}>
					<Popup>{garden.name}</Popup>
				</Marker>

				{/* User location marker */}
				{userLocation && (
					<Marker
						position={[userLocation.latitude, userLocation.longitude]}
						icon={userIcon}>
						<Popup>You are here</Popup>
					</Marker>
				)}
			</MapContainer>
		</div>
	);
}
