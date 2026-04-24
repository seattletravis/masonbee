// src/pages/MasonBeeFinder.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { calculateMasonBeeLikelihood } from '../utils/masonBeePrediction';
import L from 'leaflet';
import './MasonBeeFinder.css';

import 'leaflet/dist/leaflet.css';

import beeMarker from '../assets/leaflet/bee-marker.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const BeeIcon = L.icon({
	iconUrl: beeMarker,
	shadowUrl: markerShadow,
	iconSize: [30, 45],
	iconAnchor: [15, 45],
	shadowSize: [40, 40],
	shadowAnchor: [12, 40],
});

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const SEARCH_RADIUS_METERS = 40; // ~100 ft

// Dummy community garden data for now (lat, lon)
const COMMUNITY_GARDENS = [
	// { lat: 47.6097, lon: -122.3331, name: "Example Community Garden" },
];

function MasonBeeFinder() {
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

	// --- Geolocation on mount ---
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
			(err) => {
				setLocationError('Unable to retrieve your location.');
				setShowMapModal(true);
			},
		);
	}, []);

	// --- Distance helper (Haversine) ---
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

	// --- Overpass query for water/woods ---
	const runOverpassDetection = useCallback(async (lat, lon) => {
		const radius = SEARCH_RADIUS_METERS;
		const query = `
        [out:json];
        (
          node(around:${radius},${lat},${lon})[natural=water];
          way(around:${radius},${lat},${lon})[natural=water];
          relation(around:${radius},${lat},${lon})[natural=water];

          node(around:${radius},${lat},${lon})[waterway];
          way(around:${radius},${lat},${lon})[waterway];
          relation(around:${radius},${lat},${lon})[waterway];

          node(around:${radius},${lat},${lon})[landuse=forest];
          way(around:${radius},${lat},${lon})[landuse=forest];
          relation(around:${radius},${lat},${lon})[landuse=forest];

          node(around:${radius},${lat},${lon})[natural=wood];
          way(around:${radius},${lat},${lon})[natural=wood];
          relation(around:${radius},${lat},${lon})[natural=wood];
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

		if (data.elements && data.elements.length > 0) {
			for (const el of data.elements) {
				const tags = el.tags || {};
				if (
					tags.natural === 'water' ||
					tags.waterway ||
					tags.water ||
					tags.landuse === 'reservoir'
				) {
					waterDetected = true;
				}
				if (tags.landuse === 'forest' || tags.natural === 'wood' || tags.wood) {
					woodsDetected = true;
				}
			}
		}

		return { waterDetected, woodsDetected };
	}, []);

	// --- Dummy beehouse proximity check (replace with real API) ---
	const fetchNearbyBeehouses = useCallback(async (lat, lon) => {
		// TODO: Replace with real API call to your backend
		// For now, return 0
		return 0;
	}, []);

	// --- Community garden proximity check ---
	const computeNearbyCommunityGardens = useCallback(
		(lat, lon) => {
			let count = 0;
			COMMUNITY_GARDENS.forEach((g) => {
				const d = distanceMeters(lat, lon, g.lat, g.lon);
				if (d <= SEARCH_RADIUS_METERS) count += 1;
			});
			return count;
		},
		[distanceMeters],
	);

	// --- Run full location check (Overpass + beehouses + gardens) ---
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
				setHasClay(true);
				setClayAutoDetected(true);
			} else {
				setWaterAutoDetected(false);
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

	// --- Run prediction whenever inputs change ---
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

	// --- Address geocoding via Nominatim ---
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

	// --- Map modal component ---
	const MapModal = React.memo(() => {
		const mapContainerRef = React.useRef(null);
		const mapInstanceRef = React.useRef(null);
		const markerRef = React.useRef(null);

		// Initialize map ONCE
		useEffect(() => {
			if (!mapContainerRef.current || mapInstanceRef.current) return;

			const startLat = selectedLocation?.lat || 47.6062;
			const startLon = selectedLocation?.lon || -122.3321;

			// Create map
			const map = L.map(mapContainerRef.current, {
				zoomControl: true,
				scrollWheelZoom: true,
			}).setView([startLat, startLon], 14);

			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				maxZoom: 19,
				attribution: '&copy; OpenStreetMap contributors',
			}).addTo(map);

			// Save map instance
			mapInstanceRef.current = map;

			// CLICK TO DROP PIN
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
							onClick={async () => {
								await handleCheckLocation(); // run Overpass + proximity checks
								setShowMapModal(false); // close modal
							}}>
							Use Map Location
						</button>
					</div>
				</div>
			</div>
		);
	});

	return (
		<div className='page mason-bee-finder-page'>
			<h1>Mason Bee Finder</h1>

			<section className='card'>
				<h2>Location</h2>
				{selectedLocation ? (
					<p>
						Checking location at{' '}
						<strong>
							{selectedLocation.lat.toFixed(5)},{' '}
							{selectedLocation.lon.toFixed(5)}
						</strong>
					</p>
				) : (
					<p>No location selected yet.</p>
				)}
				{locationError && (
					<p className='error-text' style={{ marginTop: '0.25rem' }}>
						{locationError}
					</p>
				)}
				<div style={{ marginTop: '0.5rem' }}>
					<button
						className='button button-small'
						onClick={() => setShowMapModal(true)}>
						Check a different location
					</button>
				</div>
			</section>

			<section className='card' style={{ marginTop: '1rem' }}>
				<h2>Environmental Factors (within ~100 ft)</h2>
				<div className='checkbox-group'>
					<label className='checkbox-label'>
						<input
							type='checkbox'
							checked={hasPollinators}
							onChange={(e) => setHasPollinators(e.target.checked)}
						/>
						Early season flowering shrubs, trees, or plants nearby
					</label>

					<label className='checkbox-label'>
						<input
							type='checkbox'
							checked={hasWater}
							disabled={waterAutoDetected}
							onChange={(e) => setHasWater(e.target.checked)}
						/>
						Water source nearby{' '}
						{waterAutoDetected && <span>(auto-detected)</span>}
					</label>

					<label className='checkbox-label'>
						<input
							type='checkbox'
							checked={hasClay}
							disabled={clayAutoDetected}
							onChange={(e) => setHasClay(e.target.checked)}
						/>
						Clay source nearby{' '}
						{clayAutoDetected && <span>(auto-detected from water)</span>}
					</label>

					<label className='checkbox-label'>
						<input
							type='checkbox'
							checked={hasWoods}
							disabled={woodsAutoDetected}
							onChange={(e) => setHasWoods(e.target.checked)}
						/>
						Wooded area nearby{' '}
						{woodsAutoDetected && <span>(auto-detected)</span>}
					</label>
				</div>
			</section>

			<section className='card' style={{ marginTop: '1rem' }}>
				<h2>Likelihood of Finding Mason Bees</h2>
				{prediction ? (
					<>
						<p>
							Overall likelihood: <strong>{prediction.rating}</strong>
						</p>
						{prediction.explanation.length > 0 && (
							<ul>
								{prediction.explanation.map((line, idx) => (
									<li key={idx}>{line}</li>
								))}
							</ul>
						)}
					</>
				) : (
					<p>
						Select a location and adjust the environmental factors to see a
						prediction.
					</p>
				)}
			</section>

			{showMapModal && <MapModal />}
		</div>
	);
}

export default MasonBeeFinder;
