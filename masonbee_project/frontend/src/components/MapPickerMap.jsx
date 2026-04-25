// src/components/MapPickerMap.jsx
import { useState, useEffect } from 'react';
import {
	MapContainer,
	TileLayer,
	Marker,
	useMap,
	useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import './MapPickerMap.css';

const beeIcon = new L.Icon({
	iconUrl: new URL('../assets/leaflet/bee-marker.png', import.meta.url).href,
	iconSize: [40, 40],
	iconAnchor: [20, 40],
});

function ResizeOnMount({ initialPosition }) {
	const map = useMap();

	useEffect(() => {
		if (!initialPosition) return;

		setTimeout(() => {
			map.invalidateSize();
			map.setView(initialPosition, 17, { animate: false });
		}, 300);
	}, [initialPosition]);

	return null;
}

export default function MapPickerMap({ onTempChange }) {
	const defaultCenter = [47.6062, -122.3321];

	const [position, setPosition] = useState(defaultCenter);
	const [initialPosition, setInitialPosition] = useState(null);
	const [mapInstance, setMapInstance] = useState(null);

	// Get user location ONCE
	useEffect(() => {
		if (!navigator.geolocation) {
			setInitialPosition(defaultCenter);
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(pos) => {
				const lat = pos.coords.latitude;
				const lon = pos.coords.longitude;

				const userPos = [lat, lon];

				setPosition(userPos);
				setInitialPosition(userPos);

				if (mapInstance) {
					mapInstance.setView(userPos, 17, { animate: false });
				}
			},
			() => {
				setInitialPosition(defaultCenter);
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

	function MapClickHandler({ onTempChange, setPosition }) {
		useMapEvents({
			click(e) {
				const lat = e.latlng.lat;
				const lon = e.latlng.lng;
				setPosition([lat, lon]);
				onTempChange?.(lat, lon);
			},
		});
		return null;
	}

	function handleDragEnd(e) {
		const lat = e.target.getLatLng().lat;
		const lon = e.target.getLatLng().lng;
		setPosition([lat, lon]);
		onTempChange?.(lat, lon);
	}

	function handleMapClick(e) {
		const lat = e.latlng.lat;
		const lon = e.latlng.lng;
		setPosition([lat, lon]);
		onTempChange?.(lat, lon);
	}

	return (
		<div className='map-picker-container'>
			{initialPosition && (
				<MapContainer
					center={initialPosition}
					zoom={17}
					scrollWheelZoom={true}
					className='map-picker-map'
					whenCreated={(map) => setMapInstance(map)}>
					<ResizeOnMount initialPosition={initialPosition} />

					<TileLayer
						attribution='&copy; OpenStreetMap contributors'
						url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
					/>
					<MapClickHandler
						onTempChange={onTempChange}
						setPosition={setPosition}
					/>
					<Marker
						position={position}
						icon={beeIcon}
						draggable={true}
						eventHandlers={{
							dragend: handleDragEnd,
						}}
					/>
				</MapContainer>
			)}
		</div>
	);
}
