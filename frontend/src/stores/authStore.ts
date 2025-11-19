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

// Auto-fix: If token exists but user data is missing, fetch user data
const initializeAuth = async () => {
	const token = localStorage.getItem('token');
	const userData = localStorage.getItem('user');
	
	if (token && !userData) {
		console.log('Token found but user data missing, fetching from API...');
		try {
			const response = await fetch('/api/users', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
			
			if (response.ok) {
				const users = await response.json();
				// Get current user from token (decode token or fetch from /api/auth/me if available)
				// For now, we'll need to get username from token payload
				const tokenPayload = JSON.parse(atob(token.split('.')[1]));
				const currentUser = users.find((u: any) => u.username === tokenPayload.username);
				
				if (currentUser) {
					const userToSave = {
						id: currentUser.id,
						username: currentUser.username,
						role: currentUser.role
					};
					localStorage.setItem('user', JSON.stringify(userToSave));
					setAuthState({ user: userToSave });
					console.log('User data restored:', userToSave);
				}
			}
		} catch (error) {
			console.error('Failed to restore user data:', error);
		}
	}
};

// Initialize auth on module load
initializeAuth();

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
