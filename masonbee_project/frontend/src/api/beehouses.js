// src/api/beehouses.js
import { get, post, put, del } from './client';

export function getBeehouses(params = {}) {
	return get('/api/beehouses/', { params });
}

export function getBeehouse(id) {
	return get(`/api/beehouses/${id}/`);
}

export function createBeehouse(data) {
	return post('/api/beehouses/', data);
}

export function updateBeehouse(id, data) {
	return put(`/api/beehouses/${id}/`, data);
}

export function deleteBeehouse(id) {
	return del(`/api/beehouses/${id}/`);
}

// -----------------------------
// Public beehouse endpoint (no auth)
// -----------------------------
export async function fetchPublicBeehouses(lat, lon, radius = 200) {
	const baseUrl = import.meta.env.VITE_API_BASE_URL;

	const url = `${baseUrl}/api/beehouses/public/?lat=${lat}&lon=${lon}&radius=${radius}`;

	const res = await fetch(url);

	if (!res.ok) {
		console.error('Failed to fetch public beehouses:', res.status);
		return [];
	}

	return res.json();
}
