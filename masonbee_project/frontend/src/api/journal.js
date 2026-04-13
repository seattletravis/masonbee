import * as api from './client';

export async function getJournalEntries() {
	const response = await api.get('/api/journal/');
	return response;
}

export async function createJournalEntry(data) {
	const response = await api.post('/api/journal/', data);
	return response;
}

export async function updateJournalEntry(id, data) {
	const response = await api.put(`/api/journal/${id}/`, data);
	return response;
}

export async function deleteJournalEntry(id) {
	await api.del(`/api/journal/${id}/`);
	return true;
}
