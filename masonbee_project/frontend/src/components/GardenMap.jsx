import {
	MapContainer,
	TileLayer,
	Marker,
	Popup,
	Tooltip,
	useMap,
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { useEffect } from 'react';
import './GardenMap.css';

// ---------------------------
// ICONS
// ---------------------------

const regularIcon = new L.Icon({
	iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
});

const pinnedIcon = new L.Icon({
	iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/yellow-dot.png',
	iconSize: [32, 32],
	iconAnchor: [16, 32],
});

const defaultIcon = new L.Icon({
	iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/green-dot.png',
	iconSize: [32, 32],
	iconAnchor: [16, 32],
});

const userIcon = new L.Icon({
	iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png',
	iconSize: [20, 20],
	iconAnchor: [10, 10],
});

// ---------------------------
// Resize Handler
// ---------------------------
function ResizeHandler() {
	const map = useMap();
	useEffect(() => {
		setTimeout(() => map.invalidateSize(), 200);
	}, [map]);
	return null;
}

// ---------------------------
// Fly-To Animation
// ---------------------------
function FlyToGarden({ garden }) {
	const map = useMap();

	useEffect(() => {
		if (!garden) return;
		if (!garden.latitude || !garden.longitude) return;

		map.flyTo([garden.latitude, garden.longitude], 15, {
			duration: 1.2,
		});
	}, [garden, map]);

	return null;
}

// ---------------------------
// MAIN COMPONENT
// ---------------------------
export default function GardenMap({
	gardens,
	pinned,
	defaultGarden,
	userLocation,
	onSelectGarden,
}) {
	const center = userLocation
		? [userLocation.latitude, userLocation.longitude]
		: [47.6062, -122.3321]; // Seattle fallback

	return (
		<MapContainer
			center={center}
			zoom={12}
			scrollWheelZoom={true}
			className='garden-map'>
			<ResizeHandler />
			<FlyToGarden garden={defaultGarden} />

			<TileLayer
				attribution='&copy; OpenStreetMap contributors'
				url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
			/>

			{/* User location */}
			{userLocation && (
				<Marker
					position={[userLocation.latitude, userLocation.longitude]}
					icon={userIcon}>
					<Popup>You are here</Popup>
				</Marker>
			)}

			{/* Tuned clustering */}
			<MarkerClusterGroup
				chunkedLoading
				maxClusterRadius={20} // ⭐ Show ~2× more pins before clustering
				spiderfyOnMaxZoom={true}
				showCoverageOnHover={false}
				zoomToBoundsOnClick={true}>
				{gardens.map((g) => {
					if (!g.latitude || !g.longitude) return null;

					const isDefault = defaultGarden?.id === g.id;
					const isPinned = Boolean(pinned[String(g.id)]);

					const icon = isDefault
						? defaultIcon
						: isPinned
							? pinnedIcon
							: regularIcon;

					return (
						<Marker
							key={g.id}
							position={[g.latitude, g.longitude]}
							icon={icon}
							eventHandlers={{
								click: () => onSelectGarden(g),
							}}>
							<Tooltip direction='top' offset={[0, -10]} opacity={0.9}>
								{g.name}
							</Tooltip>

							<Popup>
								<strong>{g.name}</strong>
								<br />
								<button
									className='button button-small'
									onClick={() => onSelectGarden(g)}>
									View Garden
								</button>
							</Popup>
						</Marker>
					);
				})}
			</MarkerClusterGroup>
		</MapContainer>
	);
}
