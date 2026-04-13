import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJournalEntries } from '../api/journal';
import { getBeehouses } from '../api/beehouses';
import { getUserDefaultGarden } from '../api/gardens';

function normalizeCollection(payload) {
	if (Array.isArray(payload)) {
		return payload;
	}

	if (Array.isArray(payload?.results)) {
		return payload.results;
	}

	return [];
}

function getErrorMessage(error, fallbackMessage) {
	return (
		error?.response?.data?.detail ||
		error?.response?.data?.message ||
		error?.message ||
		fallbackMessage
	);
}

function matchesGardenId(value, gardenId) {
	return String(value) === String(gardenId);
}

function isLinkedToGarden(record, gardenId) {
	if (!record || gardenId == null) {
		return false;
	}

	const candidateValues = [
		record.garden,
		record.garden_id,
		record.gardenId,
		record?.garden?.id,
		record?.garden_details?.id,
	];

	return candidateValues.some(
		(value) => value != null && matchesGardenId(value, gardenId),
	);
}

function formatGardenType(gardenType) {
	if (!gardenType) {
		return 'Unknown';
	}

	return gardenType
		.split('_')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

function MetadataRow({ label, value, isLink = false }) {
	if (value == null || value === '') {
		return null;
	}

	return (
		<div style={{ marginBottom: '0.75rem' }}>
			<strong>{label}:</strong>{' '}
			{isLink ? (
				<a href={value} target='_blank' rel='noreferrer'>
					{value}
				</a>
			) : (
				<span>{value}</span>
			)}
		</div>
	);
}

function StatCard({ label, value }) {
	return (
		<div className='stat-card'>
			<h3 className='section-title'>{value}</h3>
			<p>{label}</p>
		</div>
	);
}

function MyGardenPage() {
	const navigate = useNavigate();
	const [garden, setGarden] = useState(null);
	const [journalEntries, setJournalEntries] = useState([]);
	const [beehouses, setBeehouses] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState('');

	const loadGardenDashboard = useCallback(async () => {
		setIsLoading(true);
		setLoadError('');

		try {
			const [gardenData, journalData, beehouseData] = await Promise.all([
				getUserDefaultGarden(),
				getJournalEntries(),
				getBeehouses(),
			]);

			setGarden(gardenData || null);
			setJournalEntries(normalizeCollection(journalData));
			setBeehouses(normalizeCollection(beehouseData));
		} catch (error) {
			setLoadError(
				getErrorMessage(
					error,
					'Unable to load your garden dashboard right now.',
				),
			);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadGardenDashboard();
	}, [loadGardenDashboard]);

	const journalEntryCount = useMemo(() => {
		if (!garden?.id) {
			return 0;
		}

		return journalEntries.filter((entry) => isLinkedToGarden(entry, garden.id))
			.length;
	}, [garden?.id, journalEntries]);

	const beehouseCount = useMemo(() => {
		if (!garden?.id) {
			return 0;
		}

		return beehouses.filter((beehouse) => isLinkedToGarden(beehouse, garden.id))
			.length;
	}, [beehouses, garden?.id]);

	const handleViewJournalEntries = useCallback(() => {
		if (!garden?.id) {
			return;
		}

		navigate(`/journal/${garden.id}`);
	}, [garden?.id, navigate]);

	const handleAddJournalEntry = useCallback(() => {
		if (!garden?.id) {
			return;
		}

		navigate(`/journal?new=1&garden=${garden.id}`);
	}, [garden?.id, navigate]);

	const handleViewBeehouses = useCallback(() => {
		if (!garden?.id) {
			return;
		}

		navigate(`/beehouses?garden=${garden.id}`);
	}, [garden?.id, navigate]);

	if (isLoading) {
		return (
			<div className='page'>
				<p>Loading your garden...</p>
			</div>
		);
	}

	if (loadError) {
		return (
			<div className='page'>
				<p>{loadError}</p>
			</div>
		);
	}

	if (!garden) {
		return (
			<div className='page'>
				<p>You do not have a default garden yet.</p>
			</div>
		);
	}

	return (
		<div className='page'>
			<header className='page-header' style={{ marginBottom: '1.5rem' }}>
				<div>
					<h1>{garden.name}</h1>
					<div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
						<span className='button button-secondary'>
							{formatGardenType(garden.garden_type)}
						</span>
						{garden.neighborhood ? <span>{garden.neighborhood}</span> : null}
					</div>
				</div>
			</header>

			<section className='section'>
				<h2 className='section-title'>Garden Metadata</h2>
				<MetadataRow label='Address' value={garden.address} />
				<MetadataRow label='Cross streets' value={garden.cross_streets} />
				<MetadataRow label='Managed by' value={garden.managed_by} />
				<MetadataRow label='URL' value={garden.url} isLink />
				<MetadataRow label='Number of plots' value={garden.num_plots} />
				<MetadataRow label='Size (sqft)' value={garden.size_sqft} />
				<MetadataRow
					label='Access'
					value={garden.is_public ? 'Public' : 'Private'}
				/>
			</section>

			<section className='section'>
				<h2 className='section-title'>Stats</h2>
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
						gap: '1rem',
					}}>
					<StatCard label='Journal Entries' value={journalEntryCount} />
					<StatCard label='Beehouses' value={beehouseCount} />
				</div>
			</section>

			{garden.latitude != null && garden.longitude != null ? (
				<section className='section'>
					<h2 className='section-title'>Map</h2>
					<div>
						Map placeholder — coordinates: {garden.latitude}, {garden.longitude}
					</div>
				</section>
			) : null}

			<section className='section'>
				<h2 className='section-title'>Quick Actions</h2>
				<div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
					<button
						type='button'
						className='button button-secondary'
						onClick={handleViewJournalEntries}>
						View Journal Entries
					</button>
					<button
						type='button'
						className='button button-primary'
						onClick={handleAddJournalEntry}>
						Add Journal Entry
					</button>
					<button
						type='button'
						className='button button-secondary'
						onClick={handleViewBeehouses}>
						View Beehouses
					</button>
				</div>
			</section>
		</div>
	);
}

export default MyGardenPage;
