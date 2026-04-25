import { useState, useRef } from 'react';
import * as api from '../api/client';
import BeehouseEntryForm from '../components/BeehouseEntryForm';
import BeeNotesEntryForm from '../components/BeeNotesEntryForm';
import MapPinModal from '../components/MapPinModal';
import './AddBeehousePage.css';

export default function AddBeehousePage() {
	const [createdBeehouse, setCreatedBeehouse] = useState(null);
	const [showMapModal, setShowMapModal] = useState(false);
	const [coords, setCoords] = useState({ lat: null, lon: null });
	const lastScrollYRef = useRef(0);

	function handleSelectLocation(lat, lon) {
		setCoords({ lat, lon });
		setShowMapModal(false);
	}

	return (
		<div className='page-wrapper'>
			<header className='section'>
				<h1 className='section-title'>Add a Beehouse</h1>
				<p className='section-description'>
					Do you keep mason bees already? Help the community thrive by adding
					your beehouse here. Your bee information stays completely private.
				</p>
			</header>

			<section className='section'>
				<h2 className='section-title'>Beehouse Details</h2>

				<BeehouseEntryForm
					mode='standalone'
					latitude={coords.lat}
					longitude={coords.lon}
					onOpenMap={() => setShowMapModal(true)}
					onCreated={(beehouse) => {
						setCreatedBeehouse(beehouse);
						lastScrollYRef.current = window.scrollY;

						setTimeout(() => {
							window.scrollTo({
								top: lastScrollYRef.current,
								behavior: 'smooth',
							});
						}, 50);
					}}
				/>
			</section>

			{createdBeehouse && (
				<section className='section'>
					<h2 className='section-title'>Add Bee Notes</h2>

					<BeeNotesEntryForm
						mode='standalone'
						beehouses={[createdBeehouse]}
						onCreated={() => {
							alert('Bee note added successfully');
						}}
					/>
				</section>
			)}

			{showMapModal && (
				<MapPinModal
					onSelect={handleSelectLocation}
					onClose={() => setShowMapModal(false)}
				/>
			)}
		</div>
	);
}
