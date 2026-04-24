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
const SEARCH_RADIUS_METERS = 90; // ~300 ft

// Simple Haversine helper
function distanceMeters(lat1, lon1, lat2, lon2) {
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
}

// Cache for Overpass results (persists across renders)
const overpassCache = new Map();
function cacheKey(lat, lon) {
	return `${lat.toFixed(4)},${lon.toFixed(4)}`;
}

function MasonBeeFinder() {
	const [hasRunPrediction, setHasRunPrediction] = useState(false);

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

	// Overpass query for water / woods / clay (inferred)
	const runOverpassDetection = useCallback(async (lat, lon) => {
		const key = cacheKey(lat, lon);

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
		overpassCache.set(key, result);
		return result;
	}, []);

	// Beehouse proximity check
	const fetchNearbyBeehouses = useCallback(async (lat, lon) => {
		const houses = await get('/api/beehouses/');

		return houses.filter((h) => {
			if (!h.latitude || !h.longitude) return false;
			const d = distanceMeters(
				lat,
				lon,
				parseFloat(h.latitude),
				parseFloat(h.longitude),
			);
			return d <= SEARCH_RADIUS_METERS;
		}).length;
	}, []);

	// Community garden proximity check
	const computeNearbyCommunityGardens = useCallback(
		(lat, lon) => {
			return publicGardens.filter((g) => {
				const d = distanceMeters(
					lat,
					lon,
					parseFloat(g.latitude),
					parseFloat(g.longitude),
				);
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

			// Update all state
			setNearbyBeehouses(beehouseCount);
			setNearbyCommunityGardens(gardenCount);

			setWaterAutoDetected(overpassResult.waterDetected);
			setHasWater(overpassResult.waterDetected);

			const clayFromOverpass =
				overpassResult.clayDetected || overpassResult.waterDetected;
			setClayAutoDetected(clayFromOverpass);
			setHasClay(clayFromOverpass);

			setWoodsAutoDetected(overpassResult.woodsDetected);
			setHasWoods(overpassResult.woodsDetected);

			// ⭐ RUN PREDICTION HERE — AFTER all state updates
			const result = calculateMasonBeeLikelihood({
				hasPollinators,
				hasWater: overpassResult.waterDetected,
				hasClay: clayFromOverpass,
				hasWoods: overpassResult.woodsDetected,
				nearbyBeehouses: beehouseCount,
				nearbyCommunityGardens: gardenCount,
			});

			setPrediction(result);
			setHasRunPrediction(true);
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
		hasPollinators,
	]);

	// Run prediction ONLY when user clicks the checker
	function runChecker() {
		if (!selectedLocation) return;

		// ⭐ Compute prediction using the freshly computed values, NOT state
		const result = calculateMasonBeeLikelihood({
			hasPollinators,
			hasWater: overpassResult.waterDetected,
			hasClay: clayFromOverpass,
			hasWoods: overpassResult.woodsDetected,
			nearbyBeehouses: beehouseCount,
			nearbyCommunityGardens: gardenCount,
		});

		setPrediction(result);
		setHasRunPrediction(true);
	}

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

	// Map modal component (purely for picking a location)
	const MapModal = React.memo(function MapModal() {
		const mapContainerRef = React.useRef(null);
		const mapRef = React.useRef(null);
		const markerRef = React.useRef(null);

		// Add public garden markers when map + gardens are ready
		useEffect(() => {
			if (!mapRef.current || publicGardens.length === 0) return;

			publicGardens.forEach((garden) => {
				L.marker([garden.latitude, garden.longitude], { icon: GardenIcon })
					.addTo(mapRef.current)
					.bindPopup(`<strong>${garden.name}</strong>`);
			});
		}, [publicGardens]);

		// Initialize map once
		useEffect(() => {
			if (!mapContainerRef.current || mapRef.current) return;

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

			mapRef.current = map;

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
			if (!selectedLocation || !mapRef.current) return;

			const { lat, lon } = selectedLocation;

			if (!markerRef.current) {
				markerRef.current = L.marker([lat, lon], {
					icon: BeeIcon,
					draggable: true,
				}).addTo(mapRef.current);

				markerRef.current.on('dragend', () => {
					const pos = markerRef.current.getLatLng();
					setSelectedLocation({ lat: pos.lat, lon: pos.lng });
				});
			} else {
				markerRef.current.setLatLng([lat, lon]);
			}
		}, [selectedLocation]);

		const centerOnUser = () => {
			if (!userLocation || !mapRef.current) return;

			const { lat, lon } = userLocation;
			mapRef.current.setView([lat, lon], 15);

			if (!markerRef.current) {
				markerRef.current = L.marker([lat, lon], {
					icon: BeeIcon,
					draggable: true,
				}).addTo(mapRef.current);

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
			setSelectedLocation({ lat: pos.lat, lon: pos.lng });
			setShowMapModal(false);
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
				<div className='finder-intro'>
					<h2>Mason Bee Habitat Check</h2>
					<p>
						Mason bees thrive when they have access to key resources in their
						environment, especially early‑blooming trees, shrubs, and flowers.
						If these blooms line up with the mason bee emergence period in early
						spring, there’s a good chance bees are already visiting your area.
					</p>
					<p>
						<strong>
							Please check the box for the features within 100 feet of your
							location:
						</strong>
					</p>
				</div>

				<div className='feature-checklist'>
					<div
						className={`feature-item ${waterAutoDetected ? 'auto-locked' : ''}`}>
						<label>
							<input
								type='checkbox'
								checked={hasWater}
								disabled={waterAutoDetected}
								onChange={(e) => setHasWater(e.target.checked)}
							/>
							Water / lake, pond, river or creek
							{waterAutoDetected && (
								<span className='auto-tag'>
									Map data shows this key resource is nearby.
								</span>
							)}
						</label>
						<p className='feature-desc'>
							Mason bees use moisture to regulate nest humidity and soften mud.
						</p>
					</div>

					<div
						className={`feature-item ${clayAutoDetected ? 'auto-locked' : ''}`}>
						<label>
							<input
								type='checkbox'
								checked={hasClay}
								disabled={clayAutoDetected}
								onChange={(e) => setHasClay(e.target.checked)}
							/>
							Clay / exposed soil
							{clayAutoDetected && (
								<span className='auto-tag'>
									Map data shows this key resource is nearby.
								</span>
							)}
						</label>
						<p className='feature-desc'>
							Clay is essential for nest construction — bees use it to build and
							seal brood chambers.
						</p>
					</div>

					<div
						className={`feature-item ${woodsAutoDetected ? 'auto-locked' : ''}`}>
						<label>
							<input
								type='checkbox'
								checked={hasWoods}
								disabled={woodsAutoDetected}
								onChange={(e) => setHasWoods(e.target.checked)}
							/>
							Nearby woods / wooded land, greenways, lots
							{woodsAutoDetected && (
								<span className='auto-tag'>
									Map data shows this key resource is nearby.
								</span>
							)}
						</label>
						<p className='feature-desc'>
							Woodlands provide habitats, nesting materials, reeds, and wood
							material with boreholes. Undeveloped lots, greenways, & alleys can
							also serve as mason bee habitats.
						</p>
					</div>

					<div className='feature-item'>
						<label>
							<input
								type='checkbox'
								checked={hasPollinators}
								onChange={(e) => setHasPollinators(e.target.checked)}
							/>
							Nearby early season flowers / pollinator habitat
						</label>
						<p className='feature-desc'>
							Without flowers, the passing bee won't stop to visit.
						</p>
					</div>
				</div>
			</div>

			<div className='actions'>
				<button
					className='button'
					onClick={async () => {
						await handleCheckLocation();
						runChecker();
					}}
					disabled={!selectedLocation || isCheckingLocation}>
					{isCheckingLocation
						? 'Checking location…'
						: 'Run Checker for this Location'}
				</button>
			</div>

			<div className='yesno-section'>
				<div className='yesno-item'>
					<strong>Nearby beehouses:</strong>
					<span className={nearbyBeehouses > 0 ? 'yes' : 'no'}>
						{nearbyBeehouses > 0 ? 'Yes' : 'No'}
					</span>
				</div>

				<div className='yesno-item'>
					<strong>Nearby community gardens:</strong>
					<span className={nearbyCommunityGardens > 0 ? 'yes' : 'no'}>
						{nearbyCommunityGardens > 0 ? 'Yes' : 'No'}
					</span>
				</div>
			</div>
			{nearbyBeehouses > 0 && (
				<div className='beehouse-footer'>
					There are active mason bee keepers in your area that contribute to the
					mason bee population density. You can increase your chances of
					attracting mason bees by putting out a beehouse, providing water and
					clay, and planting early‑season flowers.
				</div>
			)}

			{!hasRunPrediction ? (
				<div className='start-message'>
					<p>
						Please check the mason bee resources at your location to get
						started.
					</p>
				</div>
			) : (
				prediction && (
					<div className={`likelihood-card ${prediction.label.toLowerCase()}`}>
						<h3>Mason Bee Likelihood</h3>
						<div className='likelihood-value'>{prediction.label}</div>
						<p className='likelihood-explanation'>
							{prediction.explanation.join(' ')}
						</p>
					</div>
				)
			)}

			{showMapModal && <MapModal />}
		</div>
	);
}

export default MasonBeeFinder;
