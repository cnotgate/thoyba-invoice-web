import { createStore } from 'solid-js/store';
import type { User } from '../types';

interface AuthState {
	user: User | null;
	token: string | null;
	isAuthenticated: boolean;
}

const [authState, setAuthState] = createStore<AuthState>({
	user: null,
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
		}

		return data;
	};

	const logout = () => {
		setAuthState({
			user: null,
			token: null,
			isAuthenticated: false,
		});
		localStorage.removeItem('token');
	};

	return {
		authState,
		login,
		logout,
	};
};
