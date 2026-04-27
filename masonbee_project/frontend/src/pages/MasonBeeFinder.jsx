// src/pages/MasonBeeFinder.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { calculateMasonBeeLikelihood } from '../utils/masonBeePrediction';
import './MasonBeeFinder.css';
import 'leaflet/dist/leaflet.css';

import { get } from '../api/client';
import { fetchPublicBeehouses } from '../api/beehouses';
import MapPinModal from '../components/MapPinModal';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const SEARCH_RADIUS_METERS = 90;

// ------------------------------
// Utility helpers
// ------------------------------

function distanceMeters(lat1, lon1, lat2, lon2) {
	const R = 6371000;
	const toRad = (v) => (v * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

// ------------------------------
// Overpass caching + retry logic
// ------------------------------

const overpassCache = new Map();
let overpassInFlight = null;

function cacheKey(lat, lon) {
	return `${lat.toFixed(4)},${lon.toFixed(4)}`;
}

async function safeOverpassCall(fn) {
	// If another Overpass call is already running, wait for it
	if (overpassInFlight) {
		return overpassInFlight;
	}

	// Create a promise representing the in‑flight request
	overpassInFlight = (async () => {
		let attempt = 0;
		const maxAttempts = 3;

		while (attempt < maxAttempts) {
			try {
				const result = await fn();
				overpassInFlight = null; // clear lock
				return result;
			} catch (err) {
				// Only retry Overpass rate limits
				if (!err.message.includes('Overpass')) {
					overpassInFlight = null;
					throw err;
				}

				attempt++;

				if (attempt >= maxAttempts) {
					console.warn('Overpass is temporarily rate-limited.');
					overpassInFlight = null;
					throw err;
				}

				// Backoff: 300ms → 600ms → 1200ms
				const delay = 300 * Math.pow(2, attempt - 1);
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	})();

	return overpassInFlight;
}

function MasonBeeFinder() {
	const predictionRef = useRef(null);

	const hasLoadedGardensRef = useRef(false);
	const hasInitializedRef = React.useRef(false);
	const [freshData, setFreshData] = useState(null);
	const [hasRunPrediction, setHasRunPrediction] = useState(false);
	const [publicGardens, setPublicGardens] = useState([]);
	const [userLocation, setUserLocation] = useState(null);
	const [locationError, setLocationError] = useState(null);
	const [showMapModal, setShowMapModal] = useState(false);
	const [selectedLocation, setSelectedLocation] = useState(null);
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

	// ------------------------------
	// Load public gardens
	// ------------------------------

	useEffect(() => {
		if (hasLoadedGardensRef.current) return;
		hasLoadedGardensRef.current = true;
		async function loadGardens() {
			try {
				const data = await get('/api/gardens/');
				const filtered = data.filter(
					(g) =>
						g.is_public &&
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

	// ------------------------------
	// Overpass detection
	// ------------------------------

	const runOverpassDetection = useCallback(async (lat, lon) => {
		const key = cacheKey(lat, lon);

		if (overpassCache.has(key)) {
			return overpassCache.get(key);
		}

		const radius = SEARCH_RADIUS_METERS;
		const query = `
[out:json][timeout:10];
(
  // Water sources
  nwr(around:${radius},${lat},${lon})[natural~"water|wetland"];
  nwr(around:${radius},${lat},${lon})[water];
  nwr(around:${radius},${lat},${lon})[waterway];

  // Woods / forest / trees
  nwr(around:${radius},${lat},${lon})[landuse=forest];
  nwr(around:${radius},${lat},${lon})[natural=wood];
  nwr(around:${radius},${lat},${lon})[landcover=trees];
);
out center;
`;

		const res = await fetch(OVERPASS_URL, {
			method: 'POST',
			body: query,
		});

		if (!res.ok) {
			throw new Error('Overpass rate limit');
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

	// ------------------------------
	// Community garden proximity
	// ------------------------------

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
	// Run prediction ONLY when user clicks the checker
	function runChecker() {
		if (!selectedLocation || !freshData) return;

		const { beehouseCount, gardenCount } = freshData;

		const result = calculateMasonBeeLikelihood({
			hasPollinators,
			hasWater,
			hasClay,
			hasWoods,
			nearbyBeehouses: beehouseCount,
			nearbyCommunityGardens: gardenCount,
		});

		setPrediction(result);
		setHasRunPrediction(true);
		setTimeout(() => {
			if (predictionRef.current) {
				const rect = predictionRef.current.getBoundingClientRect();
				const scrollY = window.scrollY + rect.bottom - window.innerHeight;

				window.scrollTo({
					top: scrollY,
					behavior: 'smooth',
				});
			}
		}, 50);
	}

	// ------------------------------
	// Full location check
	// ------------------------------

	const handleCheckLocation = useCallback(
		async (loc) => {
			if (!loc) return;
			setIsCheckingLocation(true);

			try {
				const { lat, lon } = loc;

				const [overpassResult, beehouseList] = await Promise.all([
					safeOverpassCall(() => runOverpassDetection(lat, lon)),
					fetchPublicBeehouses(lat, lon),
				]);

				const beehouseCount = Array.isArray(beehouseList)
					? beehouseList.length
					: 0;

				const gardenCount = computeNearbyCommunityGardens(lat, lon);

				const clayFromOverpass =
					overpassResult.clayDetected || overpassResult.waterDetected;

				setFreshData({
					overpassResult,
					beehouseCount,
					gardenCount,
					clayFromOverpass,
				});

				setNearbyBeehouses(beehouseCount);
				setNearbyCommunityGardens(gardenCount);

				if (gardenCount > 0) {
					setHasPollinators(true);
				}

				setWaterAutoDetected(overpassResult.waterDetected);
				setClayAutoDetected(clayFromOverpass);
				setWoodsAutoDetected(overpassResult.woodsDetected);

				setHasWater(overpassResult.waterDetected);
				setHasClay(clayFromOverpass);
				setHasWoods(overpassResult.woodsDetected);
			} catch (err) {
				console.warn('Overpass temporarily unavailable, retry failed:', err);
			} finally {
				setIsCheckingLocation(false);
			}
		},
		[runOverpassDetection, fetchPublicBeehouses, computeNearbyCommunityGardens],
	);
	// Handle selection from MapPinModal
	function handleMapSelect(lat, lon) {
		const loc = { lat, lon };

		setSelectedLocation(loc);
		setUserLocation(loc);

		// Reset user toggles
		setHasWater(false);
		setHasClay(false);
		setHasWoods(false);
		setHasPollinators(false);

		// Reset prediction
		setPrediction(null);
		setHasRunPrediction(false);

		// Reset Yes/No indicators while checking new location
		setNearbyBeehouses(0);
		setNearbyCommunityGardens(0);

		// Run full location check
		handleCheckLocation(loc);
	}

	// Geolocation on mount
	useEffect(() => {
		if (hasInitializedRef.current) return;
		hasInitializedRef.current = true;
		if (!navigator.geolocation) {
			setLocationError(
				'Geolocation is not available. Please select a location from the map to get started.',
			);
			setShowMapModal(true);
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(pos) => {
				const { latitude, longitude } = pos.coords;
				const loc = { lat: latitude, lon: longitude };

				// Set initial location
				setUserLocation(loc);
				setSelectedLocation(loc);

				// Reset prediction state
				setPrediction(null);
				setHasRunPrediction(false);

				// Automatically run full detection
				handleCheckLocation(loc);
			},
			() => {
				setLocationError(
					'Unable to retrieve your location. Please select a location from the map to get started.',
				);
				setShowMapModal(true);
			},
		);
	}, [handleCheckLocation]);

	return (
		<div className='mason-bee-finder'>
			<h1>Mason Bee Finder</h1>
			<MapPinModal
				isOpen={showMapModal}
				onSelect={handleMapSelect}
				onClose={() => setShowMapModal(false)}
			/>
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
							Please select the resources within 100 ft of the location. These
							indicatiors have a big impact on the prediction. Take time to fill
							it out.
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
								onChange={(e) => {
									setHasWater(e.target.checked);
									setHasRunPrediction(false);
									setPrediction(null);
								}}
							/>
							Nearby Water?
							{waterAutoDetected && (
								<span className='auto-tag'>
									Map data shows this key resource is nearby.
								</span>
							)}
						</label>
						<p className='feature-desc'>
							Mason bees use moisture to regulate nest humidity and soften mud.
							Check this box if there is a lake, pond, river or creek nearby.
						</p>
					</div>

					<div
						className={`feature-item ${clayAutoDetected ? 'auto-locked' : ''}`}>
						<label>
							<input
								type='checkbox'
								checked={hasClay}
								disabled={clayAutoDetected}
								onChange={(e) => {
									setHasClay(e.target.checked);
									setHasRunPrediction(false);
									setPrediction(null);
								}}
							/>
							Nearby Clay?
							{clayAutoDetected && (
								<span className='auto-tag'>
									Map data shows this key resource is nearby.
								</span>
							)}
						</label>
						<p className='feature-desc'>
							Clay is essential for nest construction — bees use it to build and
							seal brood chambers. Check this box if there is exposed clay, mud,
							or soil nearby.
						</p>
					</div>

					<div
						className={`feature-item ${woodsAutoDetected ? 'auto-locked' : ''}`}>
						<label>
							<input
								type='checkbox'
								checked={hasWoods}
								disabled={woodsAutoDetected}
								onChange={(e) => {
									setHasWoods(e.target.checked);
									setHasRunPrediction(false);
									setPrediction(null);
								}}
							/>
							Nearby Woods?
							{woodsAutoDetected && (
								<span className='auto-tag'>
									Map data shows this key resource is nearby.
								</span>
							)}
						</label>
						<p className='feature-desc'>
							Woodlands provide habitats, nesting materials, reeds, and wood
							material with boreholes. These areas include undeveloped lots,
							greenways, & alleys can also serve as mason bee habitats.
						</p>
					</div>

					<div className='feature-item'>
						<label>
							<input
								type='checkbox'
								checked={hasPollinators}
								onChange={(e) => {
									setHasPollinators(e.target.checked);
									setHasRunPrediction(false);
									setPrediction(null);
								}}
							/>
							Nearby Flowers?
						</label>
						<p className='feature-desc'>
							Without flowers, the passing bee won't stop to visit. Check this
							box if there is early season flowering trees, shrubs, or plants
							nearby.
						</p>
					</div>
				</div>
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
			{nearbyCommunityGardens > 0 && (
				<div className='garden-footer'>
					Community gardens value and nurture many of the same things that help
					mason bees thrive. Having a community garden near your location is a
					strong sign that mason bees are already active in your area.
				</div>
			)}
			<div className='actions'>
				<button
					className='button mbf-checker-button'
					onClick={runChecker}
					disabled={!selectedLocation || isCheckingLocation}>
					{isCheckingLocation
						? 'Checking several sources for information… Please be patient.'
						: 'Run Mason Bee Check'}
				</button>
			</div>
			{!hasRunPrediction ? (
				<div className='start-message'>
					<p>
						Please click the mason bee resources your location has, then click
						the Run Checker at this Location button.
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
			<details className='learn-more'>
				<summary>Learn More About Mason Bees</summary>
				<div ref={predictionRef}>{/* your prediction card */}</div>

				<div className='learn-more-content'>
					<h3>The Tiny Neighbors With a Big Spring Agenda</h3>
					<p>
						Mason bees are some of the earliest pollinators to wake up each
						year. While honey bees are still waiting for warm weather and a good
						reason to leave the hive, mason bees are already out exploring.
						They’re the spring shift — the early risers of the pollinator world.
					</p>

					<p>
						And unlike honey bees, mason bees don’t wander far. Their entire
						world is usually within about <strong>100 feet</strong> of their
						nesting site. That means if you spot a mason bee, it’s not passing
						through — it lives nearby, knows the neighborhood, and has strong
						opinions about your flowering shrubs.
					</p>

					<h3>Why the Checker Looks for Certain Things</h3>
					<p>
						Mason bees are simple creatures with simple needs. The checker looks
						for the same things a mason bee looks for when deciding whether to
						stick around:
					</p>

					<ul>
						<li>
							<strong>Water</strong> — for drinking and softening mud.
						</li>
						<li>
							<strong>Clay or exposed soil</strong> — their construction
							material of choice.
						</li>
						<li>
							<strong>Wooded areas or dead wood</strong> — hollow stems and
							boreholes make perfect nests.
						</li>
						<li>
							<strong>Early-season flowers</strong> — Having blooms determines
							if a passing bee will stop to visit.
						</li>
						<li>
							<strong>Nearby beehouses</strong> — a sign that other mason bees
							are already thriving.
						</li>
						<li>
							<strong>Community gardens</strong> — pollinator hotspots full of
							early blooms.
						</li>
					</ul>

					<p>
						These ingredients form a tiny ecosystem. When they’re all present,
						mason bees don’t just visit — they move in, unpack, and start
						building.
					</p>

					<h3>The Mason Bee Life Cycle (The Short, Fun Version)</h3>
					<p>
						Mason bees emerge in early spring, mate, and immediately get to work
						collecting pollen and building nests. They’re solitary, so every
						female is her own queen, architect, and construction crew. She fills
						a tube with pollen, lays an egg, seals it with mud, and repeats
						until the tube is full.
					</p>

					<p>
						By summer, the next generation is already developing inside those
						little mud-sealed rooms. They’ll overwinter there and emerge the
						following spring to start the cycle again.
					</p>

					<h3>Micro-Habitats: Why 100 Feet Matters</h3>
					<p>
						Because mason bees stay so close to home, tiny changes in your yard
						can make a huge difference. A single flowering shrub, a patch of
						clay-rich soil, or a small bundle of hollow stems can turn an
						“almost suitable” habitat into a perfect one.
					</p>

					<p>
						Think of it like setting up a tiny pollinator studio apartment —
						cozy, functional, and close to everything they need.
					</p>

					<h3>Inviting Mason Bees to Stay</h3>
					<p>
						If your area is missing one or two key resources, don’t worry. Mason
						bees are incredibly adaptable. As long as you have flowers, you can
						<strong>add the rest</strong>: a beehouse, nesting straws, a shallow
						water dish with pebbles, and a little patch of clay-rich soil.
						You’re basically rolling out the welcome mat.
					</p>

					<h3>What If You Don’t Have Native Bees Yet?</h3>
					<p>
						Sometimes a location has great flowers but hasn’t attracted native
						mason bees yet. That’s okay — there’s a solution with a very fun
						acronym:
						<strong>BYOB: Bring Your Own Bees</strong>.
					</p>

					<p>
						Many gardeners purchase cocoons from reputable suppliers and place
						them outside at the right time of year. The bees emerge, explore,
						and often decide to stick around if the habitat feels right. It’s a
						gentle, eco-friendly way to jump-start a local population.
					</p>

					<h3>Hosting Your Own Beehouse?</h3>
					<p>
						If you decide to host your own beehouse, consider adding it to our
						app. Every beehouse entry helps us better understand and research
						domesticated mason bee population densities. Your contribution
						becomes part of a growing community science effort — and it helps
						other people discover where mason bees are thriving.
					</p>

					<p>
						Whether you’re attracting wild mason bees or inviting a few to move
						in, you’re helping support one of the most efficient,
						low-maintenance pollinators in North America — and your garden will
						thank you for it.
					</p>
				</div>
			</details>
		</div>
	);
}

export default MasonBeeFinder;
