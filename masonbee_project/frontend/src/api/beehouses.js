// src/api/beehouses.js
import { get, post, put, del } from './client';

export function getBeehouses(params = {}) {
	return get('/beehouses/', { params });
}

export function getBeehouse(id) {
	return get(`/beehouses/${id}/`);
}

export function createBeehouse(data) {
	return post('/beehouses/', data);
}

export function updateBeehouse(id, data) {
	return put(`/beehouses/${id}/`, data);
}

export function deleteBeehouse(id) {
	return del(`/beehouses/${id}/`);
}
