import { useMemo } from 'react';
import './GardenFinderCard.css';
import { pinGarden, unpinGarden, setDefaultGardenAPI } from '../api/gardens';

function formatManagerName(garden) {
	return garden.managed_by || 'Not listed';
}

function formatWebsite(garden) {
	return garden.url || '';
}

function formatPlotCount(garden) {
	return garden.num_plots ?? 'Not listed';
}

function formatAddress(garden) {
	return garden.address || 'Address not listed';
}

function formatDistance(distanceMiles) {
	if (distanceMiles == null || Number.isNaN(distanceMiles)) return null;
	return distanceMiles < 1
		? `${distanceMiles.toFixed(1)} mi away`
		: `${distanceMiles.toFixed(2)} mi away`;
}

function GardenFinderCard({
	garden,
	isPinned,
	isDefault,
	distanceMiles,
	pinBusy,
	defaultBusy,
	onTogglePin,
	onSetDefault,
	onView,
}) {
	const website = useMemo(() => formatWebsite(garden), [garden]);
	const managerName = useMemo(() => formatManagerName(garden), [garden]);
	const plotCount = useMemo(() => formatPlotCount(garden), [garden]);
	const address = useMemo(() => formatAddress(garden), [garden]);
	const distanceLabel = useMemo(
		() => formatDistance(distanceMiles),
		[distanceMiles],
	);

	const handleTogglePin = async () => {
		const id = String(garden.id);

		if (isPinned) {
			await unpinGarden(id);
			onTogglePin(garden); // parent updates local state
			return;
		}

		const record = await pinGarden(id);
		onTogglePin({ ...garden, record });
	};
	const handleSetDefault = async () => {
		if (isDefault) {
			await setDefaultGardenAPI(null); // clear default
			onSetDefault(null);
			return;
		}

		await setDefaultGardenAPI(garden.id); // set default
		onSetDefault(garden);
	};

	return (
		<article className='section garden-card'>
			<div className='garden-card__header'>
				<div>
					<h2 className='section-title'>{garden.name || 'Unnamed Garden'}</h2>
					<p className='garden-card__address'>{address}</p>
				</div>

				<div className='garden-card__badges'>
					{isDefault && <span className='default-badge'>Default Garden</span>}
				</div>
			</div>

			<div className='garden-card__meta'>
				<p>
					<strong>Cross streets:</strong> {garden.cross_streets || 'Not listed'}
				</p>
				<p>
					<strong>Plots:</strong> {plotCount}
				</p>
				<p>
					<strong>Manager:</strong> {managerName}
				</p>
				{garden.neighborhood && (
					<p>
						<strong>Neighborhood:</strong> {garden.neighborhood}
					</p>
				)}
				{distanceLabel && (
					<p>
						<strong>Distance:</strong> {distanceLabel}
					</p>
				)}
				{website && (
					<p>
						<strong>Website:</strong>{' '}
						<a href={website} target='_blank' rel='noreferrer'>
							Visit site
						</a>
					</p>
				)}
			</div>

			<div className='garden-card__actions'>
				<button
					type='button'
					className='button button-secondary'
					onClick={() => onTogglePin(garden)}
					disabled={pinBusy}>
					{pinBusy ? 'Saving...' : isPinned ? 'Unpin' : 'Pin'}
				</button>

				<button
					type='button'
					className='button button-secondary'
					onClick={handleSetDefault}
					disabled={defaultBusy}>
					{defaultBusy
						? 'Saving...'
						: isDefault
							? 'Clear Default'
							: 'Set Default'}
				</button>

				<button
					type='button'
					className='button button-primary'
					onClick={() => onView(garden)}>
					View Garden
				</button>
			</div>
		</article>
	);
}

export default GardenFinderCard;
