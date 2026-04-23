import React, { useMemo } from 'react';
import './MyGardenCard.css';

function formatManagerName(garden) {
	return garden.managed_by || 'Not listed';
}

function formatPlotCount(garden) {
	return garden.num_plots ?? 'Not listed';
}

function formatAddress(garden) {
	return garden.address || 'Not listed';
}

function formatCrossStreets(garden) {
	return garden.cross_streets || 'Not listed';
}

function MyGardenCard({
	garden,
	isDefault,
	isPinned,
	onViewGarden,
	onLogJournal,
	onSetDefault,
	onTogglePin,
}) {
	if (!garden) return null;

	const address = useMemo(() => formatAddress(garden), [garden]);
	const crossStreets = useMemo(() => formatCrossStreets(garden), [garden]);
	const managerName = useMemo(() => formatManagerName(garden), [garden]);
	const plotCount = useMemo(() => formatPlotCount(garden), [garden]);

	return (
		<div
			className={`my-garden-card${isDefault ? ' my-garden-card--default' : ''}`}>
			{/* Header */}
			<div className='my-garden-card__header'>
				<h3 className='my-garden-card__title'>{garden.name}</h3>

				<div className='my-garden-card__badges'>
					{isDefault && (
						<span className='my-garden-card__badge my-garden-card__badge--default'>
							Default
						</span>
					)}

					{isPinned && (
						<span className='my-garden-card__badge my-garden-card__badge--pinned'>
							Pinned
						</span>
					)}
				</div>
			</div>

			{/* Garden Info */}
			<div className='my-garden-card__info'>
				<p>
					<strong>Address:</strong> {address}
				</p>
				<p>
					<strong>Cross streets:</strong> {crossStreets}
				</p>
				<p>
					<strong>Plots:</strong> {plotCount}
				</p>
				<p>
					<strong>Manager:</strong> {managerName}
				</p>
			</div>

			{/* Actions */}
			<div className='my-garden-card__actions'>
				<button
					type='button'
					className='button button-primary'
					onClick={() => onViewGarden(garden)}>
					View Garden
				</button>

				<button
					type='button'
					className='button button-secondary'
					onClick={() => onLogJournal(garden)}>
					Log Journal Entry
				</button>

				{isDefault ? (
					<button
						type='button'
						className='button button-secondary'
						onClick={() => onSetDefault(null)}>
						Clear Default
					</button>
				) : (
					<button
						type='button'
						className='button button-secondary'
						onClick={() => onSetDefault(garden)}>
						Set as Default
					</button>
				)}

				{isPinned && (
					<button
						type='button'
						className='button button-secondary'
						onClick={() => onTogglePin(garden)}>
						Unpin
					</button>
				)}
			</div>
		</div>
	);
}

export default MyGardenCard;
