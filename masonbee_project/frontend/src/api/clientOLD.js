// const API_URL = import.meta.env.VITE_API_URL;

// export async function api(endpoint, method = 'GET', body = null, token = null) {
// 	const headers = { 'Content-Type': 'application/json' };
// 	if (token) headers['Authorization'] = `Bearer ${token}`;

// 	const res = await fetch(`${API_URL}/${endpoint}`, {
// 		method,
// 		headers,
// 		body: body ? JSON.stringify(body) : null,
// 	});

// 	if (!res.ok) throw new Error(`API error: ${res.status}`);
// 	return res.json();
// }
