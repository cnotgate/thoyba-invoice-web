import { createStore } from 'solid-js/store';
import type { User } from '../types';

interface AuthState {
	user: User | null;
	token: string | null;
	isAuthenticated: boolean;
}

// Restore user data from localStorage on page load
const restoreUser = (): User | null => {
	const userData = localStorage.getItem('user');
	if (userData) {
		try {
			return JSON.parse(userData);
		} catch {
			return null;
		}
	}
	return null;
};

const [authState, setAuthState] = createStore<AuthState>({
	user: restoreUser(),
	token: localStorage.getItem('token') || null,
	isAuthenticated: !!localStorage.getItem('token'),
});

export const useAuth = () => {
	const login = async (username: string, password: string) => {
		const response = await fetch('/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password }),
		});

		const data = await response.json();

		if (data.success && data.token) {
			setAuthState({
				user: data.user,
				token: data.token,
				isAuthenticated: true,
			});
			localStorage.setItem('token', data.token);
			localStorage.setItem('user', JSON.stringify(data.user)); // Save user data
		}

		return data;
	};

	const logout = () => {
		// Clear auth state
		setAuthState({
			user: null,
			token: null,
			isAuthenticated: false,
		});

		// Clear all localStorage items
		localStorage.removeItem('token');
		localStorage.removeItem('user'); // Remove user data
		localStorage.removeItem('username');
		localStorage.removeItem('role');
		localStorage.removeItem('createdAt');

		// Force redirect to login page
		window.location.href = '/login';
	};

	return {
		authState,
		login,
		logout,
	};
};
