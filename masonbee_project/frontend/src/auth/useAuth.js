import { useEffect, useState } from 'react';
import { post, setTokens, getTokens, clearTokens } from '../api/client';

export default function useAuth() {
	const [access, setAccess] = useState(null);
	const [refreshToken, setRefreshToken] = useState(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Load tokens on mount
	useEffect(() => {
		const tokens = getTokens();

		if (tokens?.access) {
			setAccess(tokens.access);
			setRefreshToken(tokens.refresh || null);
			setIsAuthenticated(true);
		} else {
			setAccess(null);
			setRefreshToken(null);
			setIsAuthenticated(false);
		}

		setLoading(false);
	}, []);

	const login = async (username, password) => {
		setLoading(true);
		setError(null);

		try {
			// client.js returns raw JSON: { access, refresh }
			const tokens = await post('/api/token/', { username, password });

			// Store in client.js memory
			setTokens(tokens);

			// Store in React state
			setAccess(tokens.access);
			setRefreshToken(tokens.refresh || null);
			setIsAuthenticated(true);

			return tokens;
		} catch (err) {
			setError(err);
			setAccess(null);
			setRefreshToken(null);
			setIsAuthenticated(false);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const logout = () => {
		clearTokens();
		setAccess(null);
		setRefreshToken(null);
		setIsAuthenticated(false);
		setError(null);
		setLoading(false);
	};

	const refresh = async () => {
		if (!refreshToken) {
			logout();
			return null;
		}

		setLoading(true);
		setError(null);

		try {
			const data = await post('/api/token/refresh/', {
				refresh: refreshToken,
			});

			const nextTokens = {
				access: data.access,
				refresh: data.refresh || refreshToken,
			};

			setTokens(nextTokens);
			setAccess(nextTokens.access);
			setRefreshToken(nextTokens.refresh);
			setIsAuthenticated(true);

			return nextTokens;
		} catch (err) {
			clearTokens();
			setAccess(null);
			setRefreshToken(null);
			setIsAuthenticated(false);
			setError(err);
			return null;
		} finally {
			setLoading(false);
		}
	};

	return {
		login,
		logout,
		refresh,
		access,
		refreshToken,
		isAuthenticated,
		loading,
		error,
	};
}
