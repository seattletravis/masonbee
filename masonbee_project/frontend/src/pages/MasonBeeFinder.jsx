// src/pages/MasonBeeFinder.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { calculateMasonBeeLikelihood } from '../utils/masonBeePrediction';
import L from 'leaflet';
import './MasonBeeFinder.css';
import 'leaflet/dist/leaflet.css';

import beeMarker from '../assets/leaflet/bee-marker.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import gardenIconImg from '../assets/leaflet/garden-marker.png';
import { get } from '../api/client';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const GardenIcon = L.icon({
	iconUrl: gardenIconImg,
	iconSize: [32, 32],
	iconAnchor: [16, 32],
});

const BeeIcon = L.icon({
	iconUrl: beeMarker,
	shadowUrl: markerShadow,
	iconSize: [32, 32],
	iconAnchor: [16, 32],
	shadowSize: [40, 40],
	shadowAnchor: [12, 40],
});

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const SEARCH_RADIUS_METERS = 90; // ~100 ft

function MasonBeeFinder() {
	const [publicGardens, setPublicGardens] = useState([]);

	const [userLocation, setUserLocation] = useState(null); // { lat, lon }
	const [locationError, setLocationError] = useState(null);

	const [showMapModal, setShowMapModal] = useState(false);
	const [selectedLocation, setSelectedLocation] = useState(null); // { lat, lon }
	const [isCheckingLocation, setIsCheckingLocation] = useState(false);

	const [hasPollinators, setHasPollinators] = useState(false);
	const [hasWater, setHasWater] = useState(false);
	const [hasClay, setHasClay] = useState(false);
	const [hasWoods, setHasWoods] = useState(false);

	const [waterAutoDetected, setWaterAutoDetected] = useState(false);
	const [clayAutoDetected, setClayAutoDetected] = useState(false);
	const [woodsAutoDetected, setWoodsAutoDetected] = useState(false);

	const [nearbyBeehouses, setNearbyBeehouses] = useState(0);
	const [nearbyCommunityGardens, setNearbyCommunityGardens] = useState(0);

	const [prediction, setPrediction] = useState(null);

	const [addressInput, setAddressInput] = useState('');
	const [addressError, setAddressError] = useState(null);

	// Load public gardens from backend
	useEffect(() => {
		async function loadGardens() {
			try {
				const data = await get('/api/gardens/');

				const filtered = data.filter(
					(g) =>
						g.is_public === true &&
						(g.garden_type === 'community' || g.garden_type === 'public') &&
						g.latitude &&
						g.longitude,
				);

				setPublicGardens(filtered);
			} catch (err) {
				console.error('Failed to load gardens', err);
			}
		}

		loadGardens();
	}, []);

	// Geolocation on mount
	useEffect(() => {
		if (!navigator.geolocation) {
			setLocationError('Geolocation is not supported by this browser.');
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(pos) => {
				const { latitude, longitude } = pos.coords;
				const loc = { lat: latitude, lon: longitude };
				setUserLocation(loc);
				setSelectedLocation(loc);
			},
			() => {
				setLocationError('Unable to retrieve your location.');
				setShowMapModal(true);
			},
		);
	}, []);

	// Distance helper (Haversine)
	const distanceMeters = (lat1, lon1, lat2, lon2) => {
		const R = 6371000;
		const toRad = (v) => (v * Math.PI) / 180;
		const dLat = toRad(lat2 - lat1);
		const dLon = toRad(lon2 - lon1);
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(toRad(lat1)) *
				Math.cos(toRad(lat2)) *
				Math.sin(dLon / 2) *
				Math.sin(dLon / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	};

	const overpassCache = new Map();

	function cacheKey(lat, lon) {
		return `${lat.toFixed(4)},${lon.toFixed(4)}`;
	}

	// Overpass query for water / woods / clay (inferred)
	const runOverpassDetection = useCallback(async (lat, lon) => {
		const key = cacheKey(lat, lon);

		// 1. Return cached result if available
		if (overpassCache.has(key)) {
			return overpassCache.get(key);
		}

		const radius = SEARCH_RADIUS_METERS;
		const query = `
[out:json][timeout:25];
(
  node(around:${radius},${lat},${lon})[natural=water];
  way(around:${radius},${lat},${lon})[natural=water];
  relation(around:${radius},${lat},${lon})[natural=water];

  node(around:${radius},${lat},${lon})[water];
  way(around:${radius},${lat},${lon})[water];
  relation(around:${radius},${lat},${lon})[water];

  node(around:${radius},${lat},${lon})[waterway];
  way(around:${radius},${lat},${lon})[waterway];
  relation(around:${radius},${lat},${lon})[waterway];

  node(around:${radius},${lat},${lon})[wetland];
  way(around:${radius},${lat},${lon})[wetland];
  relation(around:${radius},${lat},${lon})[wetland];

  node(around:${radius},${lat},${lon})[landuse=forest];
  way(around:${radius},${lat},${lon})[landuse=forest];
  relation(around:${radius},${lat},${lon})[landuse=forest];

  node(around:${radius},${lat},${lon})[natural=wood];
  way(around:${radius},${lat},${lon})[natural=wood];
  relation(around:${radius},${lat},${lon})[natural=wood];

  node(around:${radius},${lat},${lon})[landcover=trees];
  way(around:${radius},${lat},${lon})[landcover=trees];
  relation(around:${radius},${lat},${lon})[landcover=trees];

  node(around:${radius},${lat},${lon})[natural=bare_rock];
  way(around:${radius},${lat},${lon})[natural=bare_rock];

  node(around:${radius},${lat},${lon})[natural=earth_bank];
  way(around:${radius},${lat},${lon})[natural=earth_bank];

  node(around:${radius},${lat},${lon})[landuse=quarry];
  way(around:${radius},${lat},${lon})[landuse=quarry];
);
out center;
`;

		const res = await fetch(OVERPASS_URL, {
			method: 'POST',
			body: query,
		});

		if (!res.ok) {
			throw new Error('Overpass API error');
		}

		const data = await res.json();

		let waterDetected = false;
		let woodsDetected = false;
		let clayDetected = false;

		for (const el of data.elements || []) {
			const t = el.tags || {};

			if (
				t.natural === 'water' ||
				t.water ||
				t.waterway ||
				t.wetland ||
				t.landuse === 'reservoir' ||
				t.landuse === 'basin'
			) {
				waterDetected = true;
			}

			if (
				t.landuse === 'forest' ||
				t.natural === 'wood' ||
				t.landcover === 'trees'
			) {
				woodsDetected = true;
			}

			if (
				t.natural === 'bare_rock' ||
				t.natural === 'earth_bank' ||
				t.landuse === 'quarry'
			) {
				clayDetected = true;
			}
		}

		const result = { waterDetected, woodsDetected, clayDetected };

		// 2. Store in cache
		overpassCache.set(key, result);

		return result;
	}, []);

	// Beehouse proximity check (placeholder – wire to real API when ready)
	const fetchNearbyBeehouses = useCallback(async (lat, lon) => {
		// Example shape if you later add /api/beehouses/:
		// const houses = await get('/api/beehouses/');
		// return houses.filter(h =>
		//   distanceMeters(lat, lon, h.latitude, h.longitude) <= SEARCH_RADIUS_METERS
		// ).length;
		return 0;
	}, []);

	// Community garden proximity check (using loaded publicGardens)
	const computeNearbyCommunityGardens = useCallback(
		(lat, lon) => {
			return publicGardens.filter((g) => {
				const d = distanceMeters(lat, lon, g.latitude, g.longitude);
				return d <= SEARCH_RADIUS_METERS;
			}).length;
		},
		[publicGardens],
	);

	// Run full location check (Overpass + beehouses + gardens)
	const handleCheckLocation = useCallback(async () => {
		if (!selectedLocation) return;
		setIsCheckingLocation(true);
		setAddressError(null);

		try {
			const { lat, lon } = selectedLocation;

			const [overpassResult, beehouseCount] = await Promise.all([
				runOverpassDetection(lat, lon),
				fetchNearbyBeehouses(lat, lon),
			]);

			const gardenCount = computeNearbyCommunityGardens(lat, lon);

			setNearbyBeehouses(beehouseCount);
			setNearbyCommunityGardens(gardenCount);

			if (overpassResult.waterDetected) {
				setHasWater(true);
				setWaterAutoDetected(true);
			} else {
				setWaterAutoDetected(false);
			}

			const clayFromOverpass =
				overpassResult.clayDetected || overpassResult.waterDetected;
			if (clayFromOverpass) {
				setHasClay(true);
				setClayAutoDetected(true);
			} else {
				setClayAutoDetected(false);
			}

			if (overpassResult.woodsDetected) {
				setHasWoods(true);
				setWoodsAutoDetected(true);
			} else {
				setWoodsAutoDetected(false);
			}
		} catch (err) {
			console.error(err);
			setAddressError('There was a problem checking this location.');
		} finally {
			setIsCheckingLocation(false);
		}
	}, [
		selectedLocation,
		runOverpassDetection,
		fetchNearbyBeehouses,
		computeNearbyCommunityGardens,
	]);

	// Run prediction whenever inputs change
	useEffect(() => {
		if (!selectedLocation) {
			setPrediction(null);
			return;
		}

		const result = calculateMasonBeeLikelihood({
			hasPollinators,
			hasWater,
			hasClay,
			hasWoods,
			nearbyBeehouses,
			nearbyCommunityGardens,
		});

		setPrediction(result);
	}, [
		selectedLocation,
		hasPollinators,
		hasWater,
		hasClay,
		hasWoods,
		nearbyBeehouses,
		nearbyCommunityGardens,
	]);

	// Address geocoding via Nominatim
	const handleAddressSubmit = async (e) => {
		e.preventDefault();
		setAddressError(null);

		if (!addressInput.trim()) {
			setAddressError('Please enter a full street address.');
			return;
		}

		try {
			const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
				addressInput,
			)}&limit=1`;
			const res = await fetch(url, {
				headers: {
					'User-Agent': 'MasonBeeFinder/1.0',
				},
			});
			if (!res.ok) throw new Error('Geocoding error');
			const data = await res.json();

			if (!data || data.length === 0) {
				setAddressError(
					'Address not found. Please try a more specific address.',
				);
				return;
			}

			const result = data[0];
			if (result.type === 'city' || result.type === 'administrative') {
				setAddressError(
					'Please enter a full street address, not a city or region.',
				);
				return;
			}

			const lat = parseFloat(result.lat);
			const lon = parseFloat(result.lon);
			const loc = { lat, lon };
			setSelectedLocation(loc);
			setUserLocation(loc);
			setShowMapModal(false);
		} catch (err) {
			console.error(err);
			setAddressError('There was a problem looking up that address.');
		}
	};

	// Map modal component
	const MapModal = React.memo(() => {
		const mapContainerRef = React.useRef(null);
		const mapInstanceRef = React.useRef(null);
		const markerRef = React.useRef(null);

		// Add public garden markers
		useEffect(() => {
			if (!mapInstanceRef.current || publicGardens.length === 0) return;

			publicGardens.forEach((garden) => {
				L.marker([garden.latitude, garden.longitude], {
					icon: GardenIcon,
				})
					.addTo(mapInstanceRef.current)
					.bindPopup(`<strong>${garden.name}</strong>`);
			});
		}, [publicGardens]);

		// Initialize map once
		useEffect(() => {
			if (!mapContainerRef.current || mapInstanceRef.current) return;

			const startLat = selectedLocation?.lat || 47.6062;
			const startLon = selectedLocation?.lon || -122.3321;

			const map = L.map(mapContainerRef.current, {
				zoomControl: true,
				scrollWheelZoom: true,
			}).setView([startLat, startLon], 14);

			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				maxZoom: 19,
				attribution: '&copy; OpenStreetMap contributors',
			}).addTo(map);

			mapInstanceRef.current = map;

			map.on('click', (e) => {
				const { lat, lng } = e.latlng;

				if (!markerRef.current) {
					markerRef.current = L.marker([lat, lng], {
						icon: BeeIcon,
						draggable: true,
					}).addTo(map);

					markerRef.current.on('dragend', () => {
						const pos = markerRef.current.getLatLng();
						setSelectedLocation({ lat: pos.lat, lon: pos.lng });
					});
				} else {
					markerRef.current.setLatLng([lat, lng]);
				}

				setSelectedLocation({ lat, lon: lng });
			});
		}, []);

		// Update marker when selectedLocation changes
		useEffect(() => {
			if (!selectedLocation || !mapInstanceRef.current) return;

			const { lat, lon } = selectedLocation;

			if (!markerRef.current) {
				markerRef.current = L.marker([lat, lon], {
					icon: BeeIcon,
					draggable: true,
				}).addTo(mapInstanceRef.current);

				markerRef.current.on('dragend', () => {
					const pos = markerRef.current.getLatLng();
					setSelectedLocation({ lat: pos.lat, lon: pos.lng });
				});
			} else {
				markerRef.current.setLatLng([lat, lon]);
			}
		}, [selectedLocation]);

		const centerOnUser = () => {
			if (!userLocation || !mapInstanceRef.current) return;

			const { lat, lon } = userLocation;
			mapInstanceRef.current.setView([lat, lon], 15);

			if (!markerRef.current) {
				markerRef.current = L.marker([lat, lon], {
					icon: BeeIcon,
					draggable: true,
				}).addTo(mapInstanceRef.current);

				markerRef.current.on('dragend', () => {
					const pos = markerRef.current.getLatLng();
					setSelectedLocation({ lat: pos.lat, lon: pos.lng });
				});
			} else {
				markerRef.current.setLatLng([lat, lon]);
			}

			setSelectedLocation({ lat, lon });
		};

		const handleUseMapLocation = () => {
			if (!markerRef.current) return;

			const pos = markerRef.current.getLatLng();
			const loc = { lat: pos.lat, lon: pos.lng };

			setSelectedLocation(loc);
			setShowMapModal(false);
			handleCheckLocation();
		};

		return (
			<div className='modal-backdrop'>
				<div className='modal'>
					<h2>Select a Location</h2>

					<div className='map-instruction'>
						Tap anywhere on the map to drop a pin. Drag the pin to fine‑tune.
					</div>

					<div
						ref={mapContainerRef}
						style={{
							width: '100%',
							height: '300px',
							marginBottom: '1rem',
							borderRadius: '8px',
							overflow: 'hidden',
						}}
					/>

					<button
						className='button button-small'
						onClick={centerOnUser}
						style={{ marginBottom: '0.75rem' }}>
						Center on My Location
					</button>

					<form
						onSubmit={handleAddressSubmit}
						style={{ marginBottom: '0.5rem' }}>
						<label className='form-label'>
							Or enter a street address:
							<input
								type='text'
								className='input'
								value={addressInput}
								onChange={(e) => setAddressInput(e.target.value)}
								placeholder='123 Main St, City, State'
							/>
						</label>
						{addressError && (
							<div className='error-text' style={{ marginTop: '0.25rem' }}>
								{addressError}
							</div>
						)}
						<button
							type='submit'
							className='button button-small'
							style={{ marginTop: '0.5rem' }}>
							Use Address
						</button>
					</form>

					<div className='modal-actions'>
						<button
							className='button button-secondary button-small'
							onClick={() => setShowMapModal(false)}>
							Cancel
						</button>
						<button
							className='button button-small'
							onClick={handleUseMapLocation}>
							Use Map Location
						</button>
					</div>
				</div>
			</div>
		);
	});

	return (
		<div className='mason-bee-finder'>
			<h1>Mason Bee Finder</h1>

			<div className='controls'>
				<button className='button' onClick={() => setShowMapModal(true)}>
					Choose Location on Map
				</button>

				{selectedLocation && (
					<div className='location-summary'>
						<strong>Location:</strong> {selectedLocation.lat.toFixed(5)},{' '}
						{selectedLocation.lon.toFixed(5)}
					</div>
				)}

				{locationError && (
					<div className='error-text' style={{ marginTop: '0.5rem' }}>
						{locationError}
					</div>
				)}
			</div>

			<div className='toggles'>
				<label className={waterAutoDetected ? 'disabled-toggle' : ''}>
					<input
						type='checkbox'
						checked={hasWater}
						disabled={waterAutoDetected}
						onChange={(e) => setHasWater(e.target.checked)}
					/>
					Water source nearby
					{waterAutoDetected && <span className='auto-tag'>auto</span>}
				</label>

				<label className={clayAutoDetected ? 'disabled-toggle' : ''}>
					<input
						type='checkbox'
						checked={hasClay}
						disabled={clayAutoDetected}
						onChange={(e) => setHasClay(e.target.checked)}
					/>
					Clay / exposed soil
					{clayAutoDetected && <span className='auto-tag'>auto</span>}
				</label>

				<label className={woodsAutoDetected ? 'disabled-toggle' : ''}>
					<input
						type='checkbox'
						checked={hasWoods}
						disabled={woodsAutoDetected}
						onChange={(e) => setHasWoods(e.target.checked)}
					/>
					Nearby trees / woods
					{woodsAutoDetected && <span className='auto-tag'>auto</span>}
				</label>

				<label>
					<input
						type='checkbox'
						checked={hasPollinators}
						onChange={(e) => setHasPollinators(e.target.checked)}
					/>
					Nearby flowering plants / pollinator habitat
				</label>
			</div>

			<div className='actions'>
				<button
					className='button'
					onClick={handleCheckLocation}
					disabled={!selectedLocation || isCheckingLocation}>
					{isCheckingLocation ? 'Checking location…' : 'Re-check location'}
				</button>
			</div>

			<div className='summary'>
				<div>
					<strong>Nearby beehouses:</strong> {nearbyBeehouses}
				</div>
				<div>
					<strong>Nearby community gardens:</strong> {nearbyCommunityGardens}
				</div>
			</div>

			{prediction && (
				<div className='prediction'>
					<h2>Mason Bee Likelihood</h2>
					<div className='prediction-score'>
						{prediction.scoreLabel} ({Math.round(prediction.score * 100)}%)
					</div>
					<div className='prediction-explanation'>{prediction.explanation}</div>
				</div>
			)}

			{showMapModal && <MapModal />}
		</div>
	);
}

export default MasonBeeFinder;
