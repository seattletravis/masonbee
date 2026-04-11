const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const TOKEN_REFRESH_BUFFER_SECONDS = 30;

// Ensure base URL has no trailing slash
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(
	/\/$/,
	'',
);

let refreshPromise = null;

function getStoredTokens() {
	return {
		access: localStorage.getItem(ACCESS_TOKEN_KEY),
		refresh: localStorage.getItem(REFRESH_TOKEN_KEY),
	};
}

function setStoredTokens({ access, refresh }) {
	if (typeof access === 'string') {
		localStorage.setItem(ACCESS_TOKEN_KEY, access);
	}
	if (typeof refresh === 'string') {
		localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
	}
}

function clearStoredTokens() {
	localStorage.removeItem(ACCESS_TOKEN_KEY);
	localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function redirectToLogin() {
	clearStoredTokens();
	if (window.location.pathname !== '/login') {
		window.location.href = '/login';
	}
}

function buildUrl(url) {
	// If absolute URL, return as-is
	if (/^https?:\/\//i.test(url)) {
		return url;
	}
	// Otherwise prefix with API base
	return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

function decodeJwt(token) {
	try {
		const [, payload] = token.split('.');
		if (!payload) return null;

		const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
		const padded = normalized.padEnd(
			normalized.length + ((4 - (normalized.length % 4)) % 4),
			'=',
		);

		return JSON.parse(atob(padded));
	} catch {
		return null;
	}
}

function isTokenExpired(token, bufferSeconds = TOKEN_REFRESH_BUFFER_SECONDS) {
	if (!token) return true;

	const payload = decodeJwt(token);
	if (!payload?.exp) return false;

	const nowInSeconds = Math.floor(Date.now() / 1000);
	return payload.exp <= nowInSeconds + bufferSeconds;
}

async function parseResponse(response) {
	if (response.status === 204) return null;

	const contentType = response.headers.get('content-type') || '';

	if (contentType.includes('application/json')) {
		return response.json();
	}

	const text = await response.text();
	return text || null;
}

function createError(message, status, data) {
	const error = new Error(message);
	error.status = status;
	error.data = data;
	return error;
}

async function refreshAccessToken() {
	if (refreshPromise) return refreshPromise;

	refreshPromise = (async () => {
		const { refresh } = getStoredTokens();

		if (!refresh) {
			throw createError('No refresh token available.', 401, null);
		}

		const response = await fetch(buildUrl('/api/token/refresh/'), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ refresh }),
		});

		const data = await parseResponse(response);

		if (!response.ok || !data?.access) {
			throw createError(
				'Unable to refresh access token.',
				response.status,
				data,
			);
		}

		setStoredTokens({
			access: data.access,
			refresh: data.refresh ?? refresh,
		});

		return data.access;
	})();

	try {
		return await refreshPromise;
	} finally {
		refreshPromise = null;
	}
}

async function request(url, options = {}, retry = true) {
	const { access } = getStoredTokens();
	const headers = new Headers(options.headers || {});
	const isFormData = options.body instanceof FormData;

	if (!isFormData && !headers.has('Content-Type') && options.body != null) {
		headers.set('Content-Type', 'application/json');
	}

	let token = access;

	if (token && isTokenExpired(token) && !url.includes('/api/token/refresh/')) {
		try {
			token = await refreshAccessToken();
		} catch (error) {
			redirectToLogin();
			throw error;
		}
	}

	if (token && !headers.has('Authorization')) {
		headers.set('Authorization', `Bearer ${token}`);
	}

	const response = await fetch(buildUrl(url), {
		...options,
		headers,
	});

	if (
		response.status === 401 &&
		retry &&
		!url.includes('/api/token/refresh/')
	) {
		try {
			const newAccessToken = await refreshAccessToken();
			return request(
				url,
				{
					...options,
					headers: {
						...Object.fromEntries(headers.entries()),
						Authorization: `Bearer ${newAccessToken}`,
					},
				},
				false,
			);
		} catch (error) {
			redirectToLogin();
			throw error;
		}
	}

	const data = await parseResponse(response);

	if (!response.ok) {
		const message =
			data?.detail ||
			data?.message ||
			`Request failed with status ${response.status}`;
		throw createError(message, response.status, data);
	}

	return data;
}

const api = {
	get(url, options = {}) {
		return request(url, { ...options, method: 'GET' });
	},

	post(url, data, options = {}) {
		const body =
			data instanceof FormData
				? data
				: data != null
					? JSON.stringify(data)
					: undefined;

		return request(url, { ...options, method: 'POST', body });
	},

	put(url, data, options = {}) {
		const body =
			data instanceof FormData
				? data
				: data != null
					? JSON.stringify(data)
					: undefined;

		return request(url, { ...options, method: 'PUT', body });
	},

	delete(url, options = {}) {
		return request(url, { ...options, method: 'DELETE' });
	},

	setTokens(tokens) {
		setStoredTokens(tokens);
	},

	getTokens() {
		return getStoredTokens();
	},

	clearTokens() {
		clearStoredTokens();
	},
};

export default api;
