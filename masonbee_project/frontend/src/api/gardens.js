// src/api/gardens.js
import { get, post, put, del } from './client';

export async function getWatchedGardens() {
	const response = await get('/gardens/watched/');
	return response.data;
}

export function getGardens(params = {}) {
	return get('/gardens/', { params });
}

export function getGarden(id) {
	return get(`/gardens/${id}/`);
}

export async function getUserDefaultGarden() {
	const response = await get('/api/gardens/default/');

	// ⭐ If request() returned null (404), return null safely
	if (response === null) {
		return null;
	}

	return response.data;
}

export function createGarden(data) {
	return post('/gardens/', data);
}

export function updateGarden(id, data) {
	return put(`/gardens/${id}/`, data);
}

export function deleteGarden(id) {
	return del(`/gardens/${id}/`);
}

// --- PIN / UNPIN / SET DEFAULT ---

export async function pinGarden(id) {
	return post(`/api/gardens/${id}/pin/`);
}

export async function unpinGarden(id) {
	return del(`/api/gardens/${id}/unpin/`);
}

export async function setDefaultGardenAPI(id) {
	return post('/api/gardens/default/', { garden_id: id });
}
