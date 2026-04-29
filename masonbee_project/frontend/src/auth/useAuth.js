// src/auth/useAuth.js
import { useEffect, useState } from 'react';
import { post, setTokens, getTokens, clearTokens } from '../api/client';

export default function useAuth() {
	const [access, setAccess] = useState(null);
	const [refreshToken, setRefreshToken] = useState(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [loading, setLoading] = useState(true);
	const [loginError, setLoginError] = useState(
		localStorage.getItem('loginError') || null,
	);

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
		setLoginError(null);
		localStorage.removeItem('loginError');

		try {
			const tokens = await post('/api/token/', { username, password });

			setTokens(tokens);
			setAccess(tokens.access);
			setRefreshToken(tokens.refresh || null);
			setIsAuthenticated(true);

			return tokens;
		} catch (err) {
			const msg = 'Incorrect username or password.';
			setLoginError(msg);
			localStorage.setItem('loginError', msg);

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
		setLoginError(null);
		localStorage.removeItem('loginError');
	};

	return {
		login,
		logout,
		access,
		refreshToken,
		isAuthenticated,
		loading,
		loginError,
	};
}
