import { useMemo } from 'react';
import './GardenCard.css';

function formatAccessLabel(isPublic) {
	if (isPublic == null) return 'Unknown Access';
	return isPublic ? 'Public' : 'Private';
}

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

function GardenCard({
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

	return (
		<article className='section garden-card'>
			<div className='garden-card__header'>
				<div>
					<h2 className='section-title'>{garden.name || 'Unnamed Garden'}</h2>
					<p className='garden-card__address'>{address}</p>
				</div>

				<div className='garden-card__badges'>
					<span className='button button-secondary'>
						{formatAccessLabel(garden.is_public)}
					</span>
					{isDefault && (
						<span className='button button-primary'>Default Garden</span>
					)}
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
					onClick={() => onSetDefault(garden)}
					disabled={defaultBusy || isDefault}>
					{defaultBusy ? 'Saving...' : isDefault ? 'Default' : 'Set Default'}
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

export default GardenCard;
