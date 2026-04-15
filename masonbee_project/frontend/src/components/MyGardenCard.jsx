import GardenFinderCard from './GardenFinderCard';

function MyGardenCard({
	garden,
	isDefault,
	isPinned,
	onViewGarden,
	onLogJournal,
	onAddBeeNotes,
	onSetDefault,
}) {
	return (
		<div
			className={`my-garden-card${isDefault ? ' my-garden-card--default' : ''}`}>
			<GardenFinderCard
				garden={garden}
				isPinned={isPinned}
				isDefault={isDefault}
				onTogglePin={null} // disable pin toggle in My Gardens
				onSetDefault={onSetDefault}
				onView={onViewGarden}
			/>

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
			</div>
		</div>
	);
}

export default MyGardenCard;
