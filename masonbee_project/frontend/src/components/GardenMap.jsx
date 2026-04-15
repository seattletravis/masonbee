import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import './GardenMap.css';

const defaultIcon = new L.Icon({
	iconUrl: '/icons/garden-default.png',
	iconSize: [32, 32],
});

const pinnedIcon = new L.Icon({
	iconUrl: '/icons/garden-pinned.png',
	iconSize: [28, 28],
});

const regularIcon = new L.Icon({
	iconUrl: '/icons/garden-regular.png',
	iconSize: [24, 24],
});

const userIcon = new L.Icon({
	iconUrl: '/icons/user-location.png',
	iconSize: [20, 20],
});

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
			<TileLayer
				attribution='&copy; OpenStreetMap contributors'
				url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
			/>

			{userLocation && (
				<Marker
					position={[userLocation.latitude, userLocation.longitude]}
					icon={userIcon}>
					<Popup>You are here</Popup>
				</Marker>
			)}

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
		</MapContainer>
	);
}
