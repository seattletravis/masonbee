const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const ACCESS_KEY = 'access';
const REFRESH_KEY = 'refresh';

let refreshHandler = null;
let refreshPromise = null;

function buildUrl(url) {
	if (!API_BASE_URL) return url;
	if (/^https?:\/\//i.test(url)) return url;

	const base = API_BASE_URL.endsWith('/')
		? API_BASE_URL.slice(0, -1)
		: API_BASE_URL;

	const path = url.startsWith('/') ? url : `/${url}`;
	return `${base}${path}`;
}

function setTokens(tokens = {}) {
	if (tokens.access) {
		localStorage.setItem(ACCESS_KEY, tokens.access);
	}
	if (tokens.refresh) {
		localStorage.setItem(REFRESH_KEY, tokens.refresh);
	}
}

function getTokens() {
	return {
		access: localStorage.getItem(ACCESS_KEY),
		refresh: localStorage.getItem(REFRESH_KEY),
	};
}

function clearTokens() {
	localStorage.removeItem(ACCESS_KEY);
	localStorage.removeItem(REFRESH_KEY);
}

function setRefreshHandler(fn) {
	refreshHandler = typeof fn === 'function' ? fn : null;
}

async function defaultRefreshHandler() {
	const { refresh } = getTokens();

	if (!refresh) {
		throw new Error('No refresh token available');
	}

	const response = await fetch(buildUrl('/api/token/refresh/'), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ refresh }),
	});

	if (!response.ok) {
		throw new Error('Token refresh failed');
	}

	const tokens = await response.json();

	if (!tokens?.access) {
		throw new Error('No access token returned');
	}

	setTokens({
		access: tokens.access,
		refresh: tokens.refresh || refresh,
	});

	return getTokens();
}

async function runRefresh() {
	if (!refreshPromise) {
		refreshPromise = (async () => {
			const handler = refreshHandler || defaultRefreshHandler;
			const result = await handler();

			if (
				result &&
				typeof result === 'object' &&
				(result.access || result.refresh)
			) {
				setTokens({
					access: result.access || getTokens().access,
					refresh: result.refresh || getTokens().refresh,
				});
			}

			return getTokens();
		})().finally(() => {
			refreshPromise = null;
		});
	}

	return refreshPromise;
}

function redirectToLogin() {
	window.location.assign('/login');
}

async function parseResponse(response) {
	if (response.status === 204) {
		return null;
	}

	const text = await response.text();
	if (!text) {
		return null;
	}

	try {
		return JSON.parse(text);
	} catch {
		return null;
	}
}

async function request(method, url, data, retried = false) {
	const { access } = getTokens();
	const headers = {};

	if (data !== undefined) {
		headers['Content-Type'] = 'application/json';
	}

	if (access) {
		headers.Authorization = `Bearer ${access}`;
	}

	let response;

	try {
		response = await fetch(buildUrl(url), {
			method,
			headers,
			body: data !== undefined ? JSON.stringify(data) : undefined,
		});
	} catch (err) {
		// ⭐ Prevent fetch network errors from logging in the console
		return null;
	}

	// ⭐ Silence harmless 401 BEFORE refresh logic triggers browser errors
	if (response.status === 401 && !retried) {
		try {
			await runRefresh();
			return request(method, url, data, true);
		} catch {
			clearTokens();
			redirectToLogin();
			throw new Error('Authentication failed');
		}
	}

	// ⭐ Silence harmless 404 (no default garden, no pinned garden, etc.)
	if (response.status === 404) {
		return null;
	}

	if (response.status === 401) {
		throw new Error('Unauthorized');
	}

	if (!response.ok) {
		const errorData = await parseResponse(response).catch(() => null);
		const error = new Error(`Request failed with status ${response.status}`);
		error.status = response.status;
		error.data = errorData;
		throw error;
	}

	return parseResponse(response);
}

export function get(url) {
	return request('GET', url);
}

export function post(url, data) {
	return request('POST', url, data);
}

export function put(url, data) {
	return request('PUT', url, data);
}

export function patch(url, data) {
	return request('PATCH', url, data);
}

export function del(url) {
	return request('DELETE', url);
}

export { setTokens, getTokens, clearTokens, setRefreshHandler };
