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

// Regular garden icon
const regularIcon = new L.Icon({
	iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
});

// Pinned garden icon (yellow)
const pinnedIcon = new L.Icon({
	iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/yellow-dot.png',
	iconSize: [32, 32],
	iconAnchor: [16, 32],
});

// Default garden icon (green)
const defaultIcon = new L.Icon({
	iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/green-dot.png',
	iconSize: [32, 32],
	iconAnchor: [16, 32],
});

// User location icon (blue)
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

			{/* Clustered garden markers */}
			<MarkerClusterGroup chunkedLoading>
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

// import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
// import L from 'leaflet';
// import './GardenMap.css';
// import { useMap } from 'react-leaflet';
// import { useEffect } from 'react';

// function ResizeHandler() {
// 	const map = useMap();
// 	useEffect(() => {
// 		setTimeout(() => {
// 			map.invalidateSize();
// 		}, 200);
// 	}, [map]);
// 	return null;
// }

// const defaultIcon = new L.Icon({
// 	iconUrl: '/icons/garden-default.png',
// 	iconSize: [32, 32],
// });

// const pinnedIcon = new L.Icon({
// 	iconUrl: '/icons/garden-pinned.png',
// 	iconSize: [28, 28],
// });

// const regularIcon = new L.Icon({
// 	iconUrl: '/icons/garden-regular.png',
// 	iconSize: [24, 24],
// });

// const userIcon = new L.Icon({
// 	iconUrl: '/icons/user-location.png',
// 	iconSize: [20, 20],
// });

// export default function GardenMap({
// 	gardens,
// 	pinned,
// 	defaultGarden,
// 	userLocation,
// 	onSelectGarden,
// }) {
// 	const center = userLocation
// 		? [userLocation.latitude, userLocation.longitude]
// 		: [47.6062, -122.3321]; // Seattle fallback

// 	return (
// 		<MapContainer
// 			center={center}
// 			zoom={12}
// 			scrollWheelZoom={true}
// 			className='garden-map'>
// 			<ResizeHandler />
// 			<TileLayer
// 				attribution='&copy; OpenStreetMap contributors'
// 				url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
// 			/>

// 			{userLocation && (
// 				<Marker
// 					position={[userLocation.latitude, userLocation.longitude]}
// 					icon={userIcon}>
// 					<Popup>You are here</Popup>
// 				</Marker>
// 			)}

// 			{gardens.map((g) => {
// 				if (!g.latitude || !g.longitude) return null;

// 				const isDefault = defaultGarden?.id === g.id;
// 				const isPinned = Boolean(pinned[String(g.id)]);

// 				const icon = isDefault
// 					? defaultIcon
// 					: isPinned
// 						? pinnedIcon
// 						: regularIcon;

// 				return (
// 					<Marker
// 						key={g.id}
// 						position={[g.latitude, g.longitude]}
// 						icon={icon}
// 						eventHandlers={{
// 							click: () => onSelectGarden(g),
// 						}}>
// 						<Popup>
// 							<strong>{g.name}</strong>
// 							<br />
// 							<button
// 								className='button button-small'
// 								onClick={() => onSelectGarden(g)}>
// 								View Garden
// 							</button>
// 						</Popup>
// 					</Marker>
// 				);
// 			})}
// 		</MapContainer>
// 	);
// }
