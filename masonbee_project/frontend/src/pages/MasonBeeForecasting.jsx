import { useEffect, useState } from 'react';
import { getMasonBeeForecast } from '../utils/masonBeeForecasting';
import './MasonBeeForecasting.css';
import './PageWrapperGlobal.css';
// UI helper
function isDateInRange(date, start, end) {
	if (!start || !end) return false;
	const d = new Date(date);
	return d >= new Date(start) && d <= new Date(end);
}

// Forward geocoding (CORS-safe)
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

export default function MasonBeeForecasting() {
	const [loading, setLoading] = useState(true);
	const [location, setLocation] = useState(null);
	const [manualMode, setManualMode] = useState(false);
	const [manualInput, setManualInput] = useState('');
	const [forecast, setForecast] = useState(null);
	const [error, setError] = useState('');

	// Auto-detect user location
	useEffect(() => {
		navigator.geolocation.getCurrentPosition(
			async (pos) => {
				const { latitude, longitude } = pos.coords;

				setLocation({
					latitude,
					longitude,
					name: 'current location',
				});

				await loadForecast({ latitude, longitude });
			},
			() => {
				setError('Unable to detect your location.');
				setLoading(false);
			},
		);
	}, []);

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

	return (
		<div className='page-wrapper masonbee-forecast-page'>
			<header className='forecast-header'>
				<h1>Mason Bee Forecasting</h1>
				<p>
					Understand when mason bees emerge, become inactive, and when to handle
					cocoons.
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

					<div className='forecast-status-banner'>
						{forecast.currentEvent ? (
							<p>
								You are currently in the{' '}
								<strong>{forecast.currentEvent.type}</strong> window for mason
								bees in your area.
							</p>
						) : (
							<p>You are between major seasonal events.</p>
						)}
					</div>

					<section className='forecast-section'>
						<h3>Last Seasonal Event</h3>
						<p>
							Mason bees in your area last entered{' '}
							<strong>{forecast.lastEvent.type}</strong> between{' '}
							<strong>{forecast.lastEvent.early}</strong> and{' '}
							<strong>{forecast.lastEvent.late}</strong>.
						</p>
					</section>

					{forecast.currentEvent && (
						<section className='forecast-section'>
							<h3>Current Event</h3>
							<p>
								Mason bees are currently in{' '}
								<strong>{forecast.currentEvent.type}</strong> between{' '}
								<strong>{forecast.currentEvent.early}</strong> and{' '}
								<strong>{forecast.currentEvent.late}</strong>.
							</p>
						</section>
					)}

					{!forecast.currentEvent && (
						<section className='forecast-section'>
							<h3>Next Expected Event</h3>
							<p>
								Mason bees are expected to enter{' '}
								<strong>{forecast.nextEvent.type}</strong> between{' '}
								<strong>{forecast.nextEvent.early}</strong> and{' '}
								<strong>{forecast.nextEvent.late}</strong>.
							</p>
						</section>
					)}

					<section className='forecast-section'>
						<h3>Cocoon Handling Window</h3>
						<p>
							It is safe to handle, clean, or store cocoons after{' '}
							<strong>{forecast.cocoonSafeDate}</strong>.
						</p>
					</section>

					<section className='forecast-section'>
						<h3>Must‑Have‑Bees‑Out‑By Date</h3>
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
				{manualMode ? 'Cancel' : 'Use a different location'}
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
		</div>
	);
}
