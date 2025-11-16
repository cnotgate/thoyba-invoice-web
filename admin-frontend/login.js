// Configuration
const API_BASE_URL = window.location.origin.includes('localhost')
	? 'http://localhost:3001'
	: window.location.origin;

// Login Page JavaScript
document.getElementById('loginForm').addEventListener('submit', async function (event) {
	event.preventDefault();

	const username = document.getElementById('username').value.trim();
	const password = document.getElementById('password').value.trim();
	const loginBtn = document.getElementById('loginBtn');
	const errorMessage = document.getElementById('errorMessage');

	// Clear previous error
	errorMessage.textContent = '';
	errorMessage.classList.remove('show');

	// Disable button
	loginBtn.disabled = true;
	loginBtn.textContent = 'Logging in...';

	try {
		// Send login request to backend
		const response = await fetch(`${API_BASE_URL}/auth/login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ username, password }),
		});

		const data = await response.json();

		if (data.success) {
			// Store token and user info
			localStorage.setItem('adminAuthenticated', 'true');
			localStorage.setItem('adminUsername', data.user.username);
			localStorage.setItem('adminToken', data.token);
			localStorage.setItem('adminRole', data.user.role);

			// Redirect to admin dashboard
			window.location.href = 'admin.html';
		} else {
			errorMessage.textContent = data.message || 'Login gagal';
			errorMessage.classList.add('show');
		}
	} catch (error) {
		console.error('Login error:', error);
		errorMessage.textContent = 'Terjadi kesalahan. Pastikan backend berjalan.';
		errorMessage.classList.add('show');
	} finally {
		// Re-enable button
		loginBtn.disabled = false;
		loginBtn.textContent = 'Login';
	}
});

// Check if already authenticated
window.addEventListener('DOMContentLoaded', function () {
	if (localStorage.getItem('adminAuthenticated') === 'true') {
		window.location.href = 'admin.html';
	}
});
