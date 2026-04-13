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
