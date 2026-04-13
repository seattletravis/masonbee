// src/api/gardens.js
import { get, post, put, del } from './client';

export function getGardens(params = {}) {
	return get('/gardens/', { params });
}

export function getGarden(id) {
	return get(`/gardens/${id}/`);
}

export function getUserDefaultGarden() {
	return get('/gardens/default/');
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
