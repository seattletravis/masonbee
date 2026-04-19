import { useEffect, useState } from 'react';

export default function useUserLocation(shouldRequest = true) {
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
