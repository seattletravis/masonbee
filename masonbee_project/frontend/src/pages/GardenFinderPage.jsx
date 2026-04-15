import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GardenFinderCard from '../components/GardenFinderCard';
import './GardenFinderPage.css';
import { useAuthContext } from '../auth/AuthProvider';
import { get } from '../api/client';

import usePinnedGardens from '../hooks/usePinnedGardens';
import useDefaultGarden from '../hooks/useDefaultGarden';
import GardenMap from '../components/GardenMap';

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
	const [locationRequested, setLocationRequested] = useState(false);

	useEffect(() => {
		if (!shouldRequest || locationRequested || location || isLocating) return;

		if (!navigator.geolocation) {
			setLocationError('Geolocation is not supported on this device.');
			return;
		}

		setLocationRequested(true);
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
	const {
		defaultGarden,
		setDefaultGarden,
		isAuthenticated,
		loading,
		pinned,
		setPinned,
		hasPinnedGardens,
	} = useAuthContext();

	const navigate = useNavigate();

	// 🌱 Error + bootstrap flags (local to this page)
	const [error, setError] = useState('');

	// 🌱 Pin/unpin logic (still uses global pinned)
	const { togglePin } = usePinnedGardens(pinned, setPinned, setError);

	// 🌱 Default garden logic
	const { setDefault } = useDefaultGarden(setError);

	// 🌱 Garden list + pagination
	const [gardens, setGardens] = useState([]);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);

	// 🌱 Search
	const [searchQuery, setSearchQuery] = useState('');
	const debouncedSearch = useDebounce(searchQuery, 300);

	// 🌱 Sorting
	const [sortMode, setSortMode] = useState('name');
	const shouldSortByDistance = sortMode === 'distance';

	// 🌱 Loading states
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);

	// 🌱 Busy indicators
	const [pinBusyId, setPinBusyId] = useState(null);
	const [defaultBusyId, setDefaultBusyId] = useState(null);
	const [viewMode, setViewMode] = useState('list');

	// 🌱 Location
	const { location, locationError, isLocating } =
		useUserLocation(shouldSortByDistance);

	// 🌱 Fetch gardens
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
					results = payload;
					next = false;
				} else if (payload && Array.isArray(payload.results)) {
					results = payload.results;
					next = Boolean(payload.next);
				}

				setGardens((prev) => (append ? [...prev, ...results] : results));
				setPage(targetPage);
				setHasMore(next);
			} catch {
				setError('Unable to load gardens right now.');
			} finally {
				setIsLoading(false);
				setIsLoadingMore(false);
			}
		},
		[setError],
	);
	const [isFullscreen, setIsFullscreen] = useState(false);

	// 🌱 Fetch gardens when search changes
	useEffect(() => {
		setHasMore(true);
		fetchGardens(1, debouncedSearch, { append: false });
	}, [debouncedSearch, fetchGardens]);

	// 🌱 Infinite scroll handler
	const handleLoadMore = useCallback(() => {
		if (isLoading || isLoadingMore || !hasMore) return;
		fetchGardens(page + 1, debouncedSearch, { append: true });
	}, [isLoading, isLoadingMore, hasMore, page, debouncedSearch, fetchGardens]);

	// 🌱 Infinite scroll sentinel
	const sentinelRef = useInfiniteScroll({
		onIntersect: handleLoadMore,
		hasMore,
		isEnabled: !isLoading && !isLoadingMore,
	});

	// 🌱 Distance lookup
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

	// 🌱 Sorted gardens
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

	// 🌱 Pin handler
	const handleTogglePin = (garden) => {
		const id = String(garden.id);
		setPinBusyId(id);
		togglePin(garden).finally(() => setPinBusyId(null));
	};

	const handleSetDefault = (garden) => {
		// Clearing default
		if (garden === null) {
			setDefaultBusyId('clear'); // any placeholder is fine
			setDefault(null).finally(() => setDefaultBusyId(null));
			return;
		}

		// Setting default
		const id = String(garden.id);
		setDefaultBusyId(id);
		setDefault(garden).finally(() => setDefaultBusyId(null));
	};

	// 🌱 View garden handler
	const handleViewGarden = useCallback(
		(garden) => navigate(`/garden/${garden.id}`),
		[navigate],
	);

	// 🌱 Empty state
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
					<button
						type='button'
						className='button button-secondary'
						onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}>
						{viewMode === 'list' ? 'Map View' : 'List View'}
					</button>
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

			{viewMode === 'map' && (
				<section
					className={`garden-finder-map-container ${isFullscreen ? 'fullscreen' : ''}`}>
					<GardenMap
						gardens={displayedGardens}
						pinned={pinned}
						defaultGarden={defaultGarden}
						userLocation={location}
						onSelectGarden={handleViewGarden}
						shouldSortByDistance={shouldSortByDistance}
						isFullscreen={isFullscreen}
						setIsFullscreen={setIsFullscreen}
					/>
				</section>
			)}

			{viewMode === 'list' && !isLoading && displayedGardens.length > 0 && (
				<section className='garden-finder-results'>
					{displayedGardens.map((garden) => {
						const id = String(garden.id);
						const pinnedRecord = pinned[id];

						return (
							<GardenFinderCard
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
