import React from 'react';
import './MyGardenCard.css';

function MyGardenCard({
	garden,
	isDefault,
	isPinned,
	onViewGarden,
	onLogJournal,
	onAddBeeNotes,
	onSetDefault,
	onTogglePin,
}) {
	if (!garden) return null;

	const { name, address, cross_streets, manager, num_plots } = garden;

	return (
		<div
			className={`my-garden-card${isDefault ? ' my-garden-card--default' : ''}`}>
			{/* Header */}
			<div className='my-garden-card__header'>
				<h3 className='my-garden-card__title'>{name}</h3>

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
					<strong>Address:</strong> {address || 'Not listed'}
				</p>
				<p>
					<strong>Cross streets:</strong> {cross_streets || 'Not listed'}
				</p>
				<p>
					<strong>Plots:</strong> {num_plots ?? 'Not listed'}
				</p>
				<p>
					<strong>Manager:</strong> {manager || 'Not listed'}
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

				<button
					type='button'
					className='button button-secondary'
					onClick={() => onAddBeeNotes(garden)}>
					Add Bee Notes
				</button>

				{!isDefault && (
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
