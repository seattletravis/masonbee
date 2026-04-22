import { useEffect, useState } from 'react';
import { getMasonBeeForecast } from '../utils/masonBeeForecasting';
import './MasonBeeForecasting.css';
import './PageWrapperGlobal.css';

/* ---------------------------------------------
   UI Helper
--------------------------------------------- */
function isDateInRange(date, start, end) {
	if (!start || !end) return false;
	const d = new Date(date);
	return d >= new Date(start) && d <= new Date(end);
}

function getNextEvent(today, emergenceStart, dormancyStart) {
	if (today < emergenceStart) return 'Emergence';
	if (today < dormancyStart) return 'Dormancy';
	return 'Emergence (next year)';
}

/* ---------------------------------------------
   Forward Geocoding (Manual Input)
--------------------------------------------- */
async function geocode(query) {
	const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
		query,
	)}&count=1`;

	const res = await fetch(url);
	const data = await res.json();

	if (!data.results || data.results.length === 0) {
		throw new Error('Location not found');
	}

	const place = data.results[0];

	return {
		latitude: place.latitude,
		longitude: place.longitude,
		name: `${place.name}, ${place.admin1 || place.country}`,
	};
}

/* ---------------------------------------------
   Forward Geocoding (Coordinates → Nearest City)
--------------------------------------------- */
async function geocodeFromCoords(lat, lon) {
	const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

	const res = await fetch(url, {
		headers: {
			'User-Agent': 'MasonBeeForecastingApp/1.0',
		},
	});

	const data = await res.json();

	if (!data.address) return 'Your Current Location';

	const city =
		data.address.city ||
		data.address.town ||
		data.address.village ||
		data.address.hamlet ||
		data.address.suburb ||
		data.address.county;

	const state = data.address.state || data.address.region;

	return `${city}, ${state}`;
}

/* ---------------------------------------------
   MAIN COMPONENT
--------------------------------------------- */
export default function MasonBeeForecasting() {
	const [loading, setLoading] = useState(true);
	const [location, setLocation] = useState(null);
	const [manualMode, setManualMode] = useState(false);
	const [manualInput, setManualInput] = useState('');
	const [forecast, setForecast] = useState(null);
	const [error, setError] = useState('');

	/* ---------------------------------------------
     AUTO-DETECT USER LOCATION (FIXED VERSION)
  --------------------------------------------- */
	useEffect(() => {
		navigator.geolocation.getCurrentPosition(
			async (pos) => {
				const { latitude, longitude } = pos.coords;

				try {
					// 1. Get nearest city name FIRST
					const name = await geocodeFromCoords(latitude, longitude);

					// 2. Load forecast SECOND
					const forecastData = await getMasonBeeForecast(latitude, longitude);

					// 3. Update state ONCE (prevents race conditions)
					setLocation({ latitude, longitude, name });
					setForecast(forecastData);
				} catch (err) {
					console.error(err);
					setError('Unable to load location or forecast data.');
				}

				setLoading(false);
			},
			() => {
				setError('Unable to detect your location.');
				setLoading(false);
			},
		);
	}, []);

	/* ---------------------------------------------
     LOAD FORECAST FOR MANUAL LOCATION
  --------------------------------------------- */
	async function loadForecast(loc) {
		setLoading(true);
		setError('');

		try {
			const result = await getMasonBeeForecast(loc.latitude, loc.longitude);
			setForecast(result);
		} catch (err) {
			console.error(err);
			setError('Unable to load forecast data.');
		}

		setLoading(false);
	}

	/* ---------------------------------------------
     MANUAL LOCATION SUBMIT
  --------------------------------------------- */
	async function handleManualSubmit(e) {
		e.preventDefault();
		if (!manualInput.trim()) return;

		try {
			const loc = await geocode(manualInput);
			setLocation(loc);
			await loadForecast(loc);
			setManualMode(false);
		} catch {
			setError('Unable to find that location.');
		}
	}

	/* ---------------------------------------------
     RENDER
  --------------------------------------------- */
	return (
		<div className='page-wrapper masonbee-forecast-page'>
			<header className='forecast-header'>
				<h1>Mason Bee Forecasting</h1>
				<p>
					Know when your mason bees emerge, become inactive, and when to safely
					handle cocoons.
				</p>
			</header>

			<p className='forecast-today'>
				Today is{' '}
				{new Date().toLocaleDateString('en-US', {
					month: 'long',
					day: 'numeric',
					year: 'numeric',
				})}
			</p>

			{loading && <p>Loading forecast…</p>}
			{error && <p className='forecast-error'>{error}</p>}

			{!loading && forecast && (
				<div className='forecast-card'>
					<h2 className='forecast-location-title'>
						Forecast for {location?.name}
					</h2>

					{/* Status banner */}
					<div className='forecast-status-banner'>
						<p>
							You are currently in the <strong>{forecast.status.event}</strong>{' '}
							period for mason bees in your area.
						</p>
						<p className='forecast-status-note'>
							{forecast.status.event === 'Emergence' ||
							forecast.status.event === 'Active Season'
								? 'Bee Status: Active — Do not disturb, light interaction only.'
								: 'Bee Status: Inactive/Dormant — Safe to handle, inspect, and clean.'}
						</p>
					</div>

					{/* Last Event */}
					<section className='forecast-section'>
						<h3>Last Event:</h3>
						<p>
							Mason bees in your area last entered{' '}
							<strong>{forecast.lastEvent.type}</strong> between{' '}
							<strong>{forecast.lastEvent.early}</strong> and{' '}
							<strong>{forecast.lastEvent.late}</strong>.
						</p>
					</section>

					{/* Current Event (always shown) */}
					<section className='forecast-section'>
						<h3>Current Event:</h3>
						<p>
							Mason bees are currently in{' '}
							<strong>{forecast.currentEvent.type}</strong> between{' '}
							<strong>{forecast.currentEvent.early}</strong> and{' '}
							<strong>{forecast.currentEvent.late}</strong>.
						</p>

						{/* Status Tag */}
						<p className='forecast-status-note'>
							{forecast.status.event === 'Emergence' ||
							forecast.status.event === 'Active Season'
								? 'Status: Actively Polinating, enjoy occasional photos.'
								: 'Status: Inactive/Dormant — Safe to handle, inspect, and clean cocoons.'}
						</p>
					</section>

					{/* Next Event */}
					<section className='forecast-section'>
						<h3>Next Expected Event:</h3>
						<p>
							Mason bees are expected to enter{' '}
							<strong>{forecast.nextEvent.type}</strong> between{' '}
							<strong>{forecast.nextEvent.early}</strong> and{' '}
							<strong>{forecast.nextEvent.late}</strong>.
						</p>
					</section>

					{/* Cocoon Handling */}
					<section className='forecast-section'>
						<h3>Cocoon Handling Window:</h3>
						<p>
							It is safe to handle, clean, or store cocoons after{' '}
							<strong>{forecast.cocoonSafeDate}</strong>.
						</p>
					</section>

					{/* Must Place By */}
					<section className='forecast-section'>
						<h3>Must Have Bees Out By:</h3>
						<p>
							To ensure proper emergence, place your mason bee cocoons outside
							by <strong>{forecast.mustPlaceBy}</strong>.
						</p>
					</section>
				</div>
			)}

			{/* Manual location override button */}
			<button
				className='forecast-location-button'
				onClick={() => setManualMode((prev) => !prev)}>
				{manualMode ? 'Cancel' : 'Check forecast in a different location'}
			</button>

			{/* Manual location form */}
			{manualMode && (
				<form className='forecast-location-form' onSubmit={handleManualSubmit}>
					<label>
						Enter ZIP code, city, or address
						<input
							type='text'
							value={manualInput}
							onChange={(e) => setManualInput(e.target.value)}
							placeholder='e.g., 98101 or Seattle, WA'
						/>
					</label>
					<button type='submit' className='forecast-submit-button'>
						Update Forecast
					</button>
				</form>
			)}
			<div className='learn-more-section'>
				<details>
					<summary>Learn More About Mason Bees & Their Seasonal Cycle</summary>
					<div className='learn-more-content'>
						<p>
							Mason bees are gentle, solitary pollinators whose entire year
							revolves around a short but incredibly productive spring season.
							Unlike honey bees, they don’t live in hives or produce honey.
							Instead, each female works independently, visiting thousands of
							flowers and gathering pollen to provision her nesting tubes.
							Because they carry pollen loosely on their bodies rather than
							packing it into pollen baskets, they are exceptionally
							efficient—often pollinating 50 to 100 times more effectively than
							honey bees.
						</p>

						<p>
							The terms used in this forecast reflect key stages in their
							natural rhythm.
							<strong> Emergence</strong> marks the moment adult bees chew their
							way out of their cocoons in early spring. This happens when
							temperatures warm consistently, usually when the 14‑day rolling
							average reaches about 55°F. Once they emerge, mason bees are
							active for only four to six weeks. During this time, they mate,
							forage, and fill nesting tubes with pollen and eggs. This short
							window is their entire adult life.
						</p>

						<p>
							After this active period, mason bees enter what we call{' '}
							<strong>dormancy</strong>, though the term can be a bit
							misleading. The adult bees don’t hibernate—they simply reach the
							end of their life cycle. What continues into summer, fall, and
							winter are their developing offspring inside the cocoons. These
							cocoons contain the next generation of bees, slowly maturing until
							the following spring. In this sense, “dormancy” is really a way of
							describing when the <em>next generation</em> is safely tucked away
							and the pollination season has ended.
						</p>

						<p>
							Because the timing of emergence and dormancy varies slightly by
							region—shifting by only a matter of weeks depending on growing
							zone, temperature patterns, and local climate—this forecast helps
							you understand when mason bees in your area are actively
							pollinating and when they’ve completed their season. The “Last
							Dormancy” window represents when last year’s adults finished their
							life cycle, and the “Next Emergence” window shows when this year’s
							bees are expected to begin their spring activity.
						</p>

						<p>
							One of the most important things to know about mason bees is that
							they prefer to be left alone during their active season. Once they
							emerge, they’re busy, focused, and easily disrupted. But when
							they’re inactive—after the adults have died and only cocoons
							remain—you can safely handle, clean, move, or store them without
							harming the bees. This is the ideal time for maintenance: removing
							parasites, cleaning nesting materials, and preparing cocoons for
							winter storage. Just follow a few simple rules: keep cocoons cool
							so they don’t wake prematurely, keep everything clean to prevent
							mold and mites, and avoid exposing them to fluctuating
							temperatures.
						</p>

						<p>
							This forecasting tool is designed to give you confidence in every
							part of that cycle. By showing when bees are emerging, when
							they’re active, and when they’ve completed their season, you can
							time your beekeeping tasks with accuracy—placing cocoons outside
							at the right moment, knowing when pollination is happening, and
							caring for cocoons safely once the season ends. It’s a simple way
							to stay in sync with the natural rhythm of mason bees and support
							healthy, thriving pollinator populations in your garden.
						</p>
					</div>
				</details>
			</div>
		</div>
	);
}
