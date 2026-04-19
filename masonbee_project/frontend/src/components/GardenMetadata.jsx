import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import './GardenMetadata.css';

// Haversine distance (miles)
function calculateDistance(user, garden) {
	if (!user || !garden?.latitude || !garden?.longitude) return null;

	const R = 3958.8; // miles
	const toRad = (v) => (v * Math.PI) / 180;

	const dLat = toRad(garden.latitude - user.latitude);
	const dLon = toRad(garden.longitude - user.longitude);

	const lat1 = toRad(user.latitude);
	const lat2 = toRad(garden.latitude);

	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return (R * c).toFixed(2);
}

export default function GardenMetadata({
	garden,
	isPinned,
	isDefault,
	userLocation,
}) {
	if (!garden) return null;

	const distance = calculateDistance(userLocation, garden);

	return (
		<div className='garden-metadata'>
			{/* Garden Identity */}
			<div className='metadata-section'>
				<h3>Garden Info</h3>
				<p>
					<strong>Name:</strong> {garden.name}
				</p>
				{garden.description && (
					<p>
						<strong>Description:</strong> {garden.description}
					</p>
				)}
				<p>
					<strong>Access:</strong> {garden.is_public ? 'Public' : 'Private'}
				</p>
				{isDefault && (
					<p>
						<strong>Default Garden:</strong> Yes
					</p>
				)}
				{isPinned && (
					<p>
						<strong>Pinned:</strong> Yes
					</p>
				)}
			</div>

			{/* Location */}
			<div className='metadata-section'>
				<h3>Location</h3>
				<p>
					<strong>Address:</strong> {garden.address || '—'}
				</p>
				<p>
					<strong>Cross Streets:</strong> {garden.cross_streets || '—'}
				</p>
				<p>
					<strong>Neighborhood:</strong> {garden.neighborhood || '—'}
				</p>

				{distance && (
					<p>
						<strong>Distance from you:</strong> {distance} miles
					</p>
				)}

				<button
					className='button button-small'
					onClick={() =>
						window.open(
							`https://www.google.com/maps/dir/?api=1&destination=${garden.latitude},${garden.longitude}`,
							'_blank',
						)
					}>
					Get Directions
				</button>
			</div>

			{/* Management */}
			<div className='metadata-section'>
				<h3>Management</h3>
				<p>
					<strong>Manager:</strong> {garden.manager || '—'}
				</p>
				{garden.url && (
					<p>
						<strong>Website:</strong>{' '}
						<a href={garden.url} target='_blank' rel='noopener noreferrer'>
							{garden.url}
						</a>
					</p>
				)}
			</div>

			{/* Coordinates */}
			<div className='metadata-section'>
				<h3>Coordinates</h3>
				<p>
					<strong>Latitude:</strong> {garden.latitude}
				</p>
				<p>
					<strong>Longitude:</strong> {garden.longitude}
				</p>
			</div>

			{/* Timestamps */}
			<div className='metadata-section'>
				<h3>Timestamps</h3>
				<p>
					<strong>Created:</strong>{' '}
					{garden.created_at
						? formatDistanceToNow(new Date(garden.created_at), {
								addSuffix: true,
							})
						: '—'}
				</p>
				<p>
					<strong>Updated:</strong>{' '}
					{garden.updated_at
						? formatDistanceToNow(new Date(garden.updated_at), {
								addSuffix: true,
							})
						: '—'}
				</p>
			</div>
		</div>
	);
}
