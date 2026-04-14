import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GardenCard from '../components/GardenCard';
import { del, get, post } from '../api/client';
import './GardenFinderPage.css';

function useDebounce(value, delay = 300) {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const timeoutId = setTimeout(() => setDebouncedValue(value), delay);
		return () => clearTimeout(timeoutId);
	}, [value, delay]);

	return debouncedValue;
}

function useInfiniteScroll({ onIntersect, hasMore, isEnabled }) {
	const sentinelRef = useRef(null);

	useEffect(() => {
		if (!isEnabled || !hasMore || !sentinelRef.current) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) onIntersect();
			},
			{ rootMargin: '240px' },
		);

		observer.observe(sentinelRef.current);
		return () => observer.disconnect();
	}, [hasMore, isEnabled, onIntersect]);

	return sentinelRef;
}

function useUserLocation(shouldRequest) {
	const [location, setLocation] = useState(null);
	const [locationError, setLocationError] = useState('');
	const [isLocating, setIsLocating] = useState(false);

	// NEW: prevents repeated geolocation prompts
	const [locationRequested, setLocationRequested] = useState(false);

	useEffect(() => {
		// Only request if:
		// - distance mode is on
		// - we haven't already requested
		// - we aren't currently requesting
		// - we don't already have a location
		if (!shouldRequest || locationRequested || location || isLocating) return;

		if (!navigator.geolocation) {
			setLocationError('Geolocation is not supported on this device.');
			return;
		}

		setLocationRequested(true); // <-- prevents all future prompts
		setIsLocating(true);

		navigator.geolocation.getCurrentPosition(
			(pos) => {
				setLocation({
					latitude: pos.coords.latitude,
					longitude: pos.coords.longitude,
				});
				setIsLocating(false);
			},
			() => {
				setLocationError(
					'Location access unavailable. Sorting alphabetically instead.',
				);
				setIsLocating(false);
			},
			{ enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
		);
	}, [shouldRequest, locationRequested, location, isLocating]);

	return { location, locationError, isLocating };
}

function toRadians(v) {
	return (v * Math.PI) / 180;
}

function haversineMiles(a, b) {
	const R = 3958.8;
	const dLat = toRadians(b.latitude - a.latitude);
	const dLon = toRadians(b.longitude - a.longitude);
	const lat1 = toRadians(a.latitude);
	const lat2 = toRadians(b.latitude);

	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

	return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function GardenFinderPage() {
	const navigate = useNavigate();

	const [gardens, setGardens] = useState([]);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);

	const [searchQuery, setSearchQuery] = useState('');
	const debouncedSearch = useDebounce(searchQuery, 300);

	const [sortMode, setSortMode] = useState('name');
	const shouldSortByDistance = sortMode === 'distance';

	const [pinned, setPinned] = useState({});
	const [defaultGarden, setDefaultGarden] = useState(null);

	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [isBootstrapping, setIsBootstrapping] = useState(true);

	const [error, setError] = useState('');
	const [pinBusyId, setPinBusyId] = useState(null);
	const [defaultBusyId, setDefaultBusyId] = useState(null);

	const { location, locationError, isLocating } =
		useUserLocation(shouldSortByDistance);
	const [locationRequested, setLocationRequested] = useState(false);

	const fetchGardens = useCallback(
		async (targetPage, query, { append } = { append: false }) => {
			const url = `/api/gardens/?page=${targetPage}&search=${query.trim()}`;

			append ? setIsLoadingMore(true) : setIsLoading(true);
			setError('');

			try {
				const payload = await get(url);

				let results = [];
				let next = false;

				if (Array.isArray(payload)) {
					// Non-paginated: backend returns a plain list
					results = payload;
					next = false;
				} else if (payload && Array.isArray(payload.results)) {
					// Paginated: DRF-style
					results = payload.results;
					next = Boolean(payload.next);
				}

				setGardens((prev) => (append ? [...prev, ...results] : results));
				setPage(targetPage);
				setHasMore(next);
			} catch (err) {
				setError('Unable to load gardens right now.');
			} finally {
				setIsLoading(false);
				setIsLoadingMore(false);
			}
		},
		[],
	);

	const loadPinnedAndDefault = useCallback(async () => {
		try {
			const [watched, def] = await Promise.all([
				get('/api/gardens/watched/'),
				get('/api/gardens/default/'),
			]);

			let watchedList = [];

			// Handle both array and paginated responses
			if (Array.isArray(watched)) {
				watchedList = watched;
			} else if (watched && Array.isArray(watched.results)) {
				watchedList = watched.results;
			}

			const pinnedLookup = {};

			watchedList.forEach((record) => {
				// record.garden.id is the actual garden ID
				const gardenId = String(record.garden?.id);
				if (gardenId) {
					pinnedLookup[gardenId] = record;
				}
			});

			setPinned(pinnedLookup);
			setDefaultGarden(def || null);
		} catch {
			setError('Unable to load your saved garden preferences.');
		} finally {
			setIsBootstrapping(false);
		}
	}, []);

	useEffect(() => {
		loadPinnedAndDefault();
	}, [loadPinnedAndDefault]);

	useEffect(() => {
		setHasMore(true);
		fetchGardens(1, debouncedSearch, { append: false });
	}, [debouncedSearch, fetchGardens]);

	const handleLoadMore = useCallback(() => {
		if (isLoading || isLoadingMore || !hasMore) return;
		fetchGardens(page + 1, debouncedSearch, { append: true });
	}, [isLoading, isLoadingMore, hasMore, page, debouncedSearch, fetchGardens]);

	const sentinelRef = useInfiniteScroll({
		onIntersect: handleLoadMore,
		hasMore,
		isEnabled: !isLoading && !isLoadingMore,
	});

	const distanceLookup = useMemo(() => {
		if (!shouldSortByDistance || !location) return {};

		const lookup = {};
		gardens.forEach((g) => {
			if (g.latitude && g.longitude) {
				lookup[g.id] = haversineMiles(location, {
					latitude: g.latitude,
					longitude: g.longitude,
				});
			} else {
				lookup[g.id] = null;
			}
		});

		return lookup;
	}, [gardens, location, shouldSortByDistance]);

	// Always recompute sorting when gardens change.
	// Sorting a few dozen gardens is cheap and avoids stale memo issues.
	let displayedGardens = [...gardens];

	if (!shouldSortByDistance || !location) {
		displayedGardens.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
	} else {
		displayedGardens.sort((a, b) => {
			const da = distanceLookup[a.id];
			const db = distanceLookup[b.id];

			if (da == null && db == null)
				return (a.name || '').localeCompare(b.name || '');
			if (da == null) return 1;
			if (db == null) return -1;
			return da - db;
		});
	}

	const handleTogglePin = useCallback(
		async (garden) => {
			const id = String(garden.id);
			setPinBusyId(id);
			setError('');

			try {
				if (pinned[id]) {
					// UNPIN
					await del(`/api/gardens/${id}/unpin/`);

					setPinned((prev) => {
						const next = { ...prev };
						delete next[id];
						return next;
					});
				} else {
					// PIN
					const record = await post(`/api/gardens/${id}/pin/`);

					setPinned((prev) => ({
						...prev,
						[id]: record,
					}));
				}
			} catch (err) {
				setError('Unable to update pinned gardens.');
			} finally {
				setPinBusyId(null);
			}
		},
		[pinned],
	);

	const handleSetDefault = useCallback(async (garden) => {
		const id = String(garden.id);
		setDefaultBusyId(id);
		setError('');

		try {
			const result = await post('/api/gardens/default/', {
				garden_id: garden.id,
			});
			setDefaultGarden(result || garden);
		} catch {
			setError('Unable to set the default garden.');
		} finally {
			setDefaultBusyId(null);
		}
	}, []);

	const handleViewGarden = useCallback(
		(garden) => navigate(`/garden/${garden.id}`),
		[navigate],
	);

	const isEmpty = !isLoading && displayedGardens.length === 0;

	return (
		<div className='page garden-finder-page'>
			<header className='page-header'>
				<div>
					<h1>Garden Finder</h1>
					<p>
						Discover community gardens, save favorites, and choose your default
						home garden.
					</p>
				</div>
			</header>

			<section className='section'>
				<div className='garden-finder-toolbar'>
					<label className='garden-finder-field'>
						<span>Search</span>
						<input
							type='search'
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder='Search gardens by name'
						/>
					</label>

					<label className='garden-finder-field'>
						<span>Sort</span>
						<select
							value={sortMode}
							onChange={(e) => setSortMode(e.target.value)}>
							<option value='name'>Alphabetical (A–Z)</option>
							<option value='distance'>Distance</option>
						</select>
					</label>
				</div>

				{defaultGarden?.name ? (
					<p className='garden-finder-feedback'>
						Default garden: <strong>{defaultGarden.name}</strong>
					</p>
				) : (
					<p className='garden-finder-feedback'>
						You do not have a default garden yet.
					</p>
				)}

				{shouldSortByDistance && isLocating && (
					<p className='garden-finder-feedback'>Finding your location...</p>
				)}

				{locationError && (
					<p className='garden-finder-feedback'>{locationError}</p>
				)}

				{error && <p className='garden-finder-feedback error'>{error}</p>}
			</section>

			{isBootstrapping && !displayedGardens.length && (
				<section className='section'>
					<p>Loading your garden preferences...</p>
				</section>
			)}

			{isLoading && (
				<section className='section'>
					<p>Loading gardens...</p>
				</section>
			)}

			{isEmpty && (
				<section className='section'>
					<h2 className='section-title'>No gardens found</h2>
					<p>
						Try a different search or clear the filters to see more gardens.
					</p>
				</section>
			)}

			{!isLoading && displayedGardens.length > 0 && (
				<section className='garden-finder-results'>
					{displayedGardens.map((garden) => {
						const id = String(garden.id);
						const pinnedRecord = pinned[id];

						return (
							<GardenCard
								key={garden.id}
								garden={garden}
								isPinned={Boolean(pinnedRecord)}
								isDefault={String(defaultGarden?.id) === id}
								distanceMiles={distanceLookup[garden.id]}
								pinBusy={pinBusyId === id}
								defaultBusy={defaultBusyId === id}
								onTogglePin={handleTogglePin}
								onSetDefault={handleSetDefault}
								onView={handleViewGarden}
							/>
						);
					})}
				</section>
			)}

			<div ref={sentinelRef} aria-hidden='true' />

			{isLoadingMore && (
				<section className='section'>
					<p>Loading more gardens...</p>
				</section>
			)}
		</div>
	);
}

export default GardenFinderPage;
