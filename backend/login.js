const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// Path to the users database file
const USERS_DB_PATH = path.join(__dirname, 'db.json');

// Helper function to read users from database
async function readUsers() {
	try {
		const data = await fs.readFile(USERS_DB_PATH, 'utf8');
		return JSON.parse(data);
	} catch (error) {
		console.error('Error reading users database:', error);
		return { users: [] };
	}
}

// Helper function to write users to database
async function writeUsers(users) {
	try {
		// Read existing database to preserve other data
		let existingData = {};
		try {
			const data = await fs.readFile(USERS_DB_PATH, 'utf8');
			existingData = JSON.parse(data);
		} catch (error) {
			// File doesn't exist or is corrupted, start fresh
			console.log('Creating new database file');
		}

		// Preserve existing data and update users
		existingData.users = users;

		await fs.writeFile(USERS_DB_PATH, JSON.stringify(existingData, null, 2));
	} catch (error) {
		console.error('Error writing to users database:', error);
		throw error;
	}
}

// Setup admin user (only if no users exist)
router.post('/setup-admin', async (req, res) => {
	try {
		const { username, password } = req.body;

		// Validate input
		if (!username || !password) {
			return res.status(400).json({
				success: false,
				message: 'Username and password are required',
			});
		}

		// Check if users already exist
		const db = await readUsers();
		if (db.users && db.users.length > 0) {
			return res.status(403).json({
				success: false,
				message: 'Admin user already exists',
			});
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 10);

		// Create admin user
		const adminUser = {
			username,
			password: hashedPassword,
			role: 'admin',
			createdAt: new Date().toISOString(),
		};

		// Save to database
		await writeUsers([adminUser]);

		res.json({
			success: true,
			message: 'Admin user created successfully',
		});
	} catch (error) {
		console.error('Setup admin error:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error',
		});
	}
});

// Register new user (requires authentication)
router.post('/register', verifyToken, async (req, res) => {
	try {
		const { username, password, role = 'user' } = req.body;

		// Validate input
		if (!username || !password) {
			return res.status(400).json({
				success: false,
				message: 'Username and password are required',
			});
		}

		// Check if user is admin
		if (req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Only admin can register new users',
			});
		}

		// Read existing users
		const db = await readUsers();
		const existingUser = db.users.find((u) => u.username === username);

		if (existingUser) {
			return res.status(409).json({
				success: false,
				message: 'Username already exists',
			});
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 10);

		// Create new user
		const newUser = {
			username,
			password: hashedPassword,
			role,
			createdAt: new Date().toISOString(),
		};

		// Add to database
		db.users.push(newUser);
		await writeUsers(db.users);

		res.json({
			success: true,
			message: 'User registered successfully',
			user: {
				username: newUser.username,
				role: newUser.role,
			},
		});
	} catch (error) {
		console.error('Register error:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error',
		});
	}
});

// Get all users (admin only)
router.get('/users', verifyToken, async (req, res) => {
	try {
		// Check if user is admin
		if (req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Only admin can view users',
			});
		}

		// Read users from database
		const db = await readUsers();

		// Return users without password field for security
		const usersWithoutPassword = db.users.map((user) => ({
			username: user.username,
			role: user.role,
			createdAt: user.createdAt,
		}));

		res.json({
			success: true,
			users: usersWithoutPassword,
		});
	} catch (error) {
		console.error('Get users error:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error',
		});
	}
});

// Login endpoint
router.post('/login', async (req, res) => {
	try {
		const { username, password } = req.body;

		// Validate input
		if (!username || !password) {
			return res.status(400).json({
				success: false,
				message: 'Username and password are required',
			});
		}

		// Read users from database
		const db = await readUsers();
		const user = db.users.find((u) => u.username === username);

		// Check if user exists and password is correct
		if (!user || !(await bcrypt.compare(password, user.password))) {
			return res.status(401).json({
				success: false,
				message: 'Invalid username or password',
			});
		}

		// Generate JWT token
		const token = jwt.sign(
			{ username: user.username, role: user.role },
			process.env.JWT_SECRET || 'admin-dashboard-secret-key',
			{ expiresIn: '24h' }
		);

		// Send success response with token
		res.json({
			success: true,
			message: 'Login successful',
			token,
			user: {
				username: user.username,
				role: user.role,
			},
		});
	} catch (error) {
		console.error('Login error:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error',
		});
	}
});

// Middleware to verify token
function verifyToken(req, res, next) {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		return res.status(401).json({
			success: false,
			message: 'Access token required',
		});
	}

	jwt.verify(token, process.env.JWT_SECRET || 'admin-dashboard-secret-key', (err, user) => {
		if (err) {
			return res.status(403).json({
				success: false,
				message: 'Invalid or expired token',
			});
		}

		req.user = user;
		next();
	});
}

// Change password endpoint
router.post('/change-password', verifyToken, async (req, res) => {
	try {
		const { currentPassword, newPassword } = req.body;
		const username = req.user.username;

		// Validate input
		if (!currentPassword || !newPassword) {
			return res.status(400).json({
				success: false,
				message: 'Current password and new password are required',
			});
		}

		if (newPassword.length < 6) {
			return res.status(400).json({
				success: false,
				message: 'New password must be at least 6 characters long',
			});
		}

		// Read users database
		const db = await readUsers();
		const userIndex = db.users.findIndex((user) => user.username === username);

		if (userIndex === -1) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			});
		}

		const user = db.users[userIndex];

		// Verify current password
		const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
		if (!isCurrentPasswordValid) {
			return res.status(400).json({
				success: false,
				message: 'Current password is incorrect',
			});
		}

		// Hash new password
		const hashedNewPassword = await bcrypt.hash(newPassword, 10);

		// Update password
		db.users[userIndex].password = hashedNewPassword;
		await writeUsers(db.users);

		res.json({
			success: true,
			message: 'Password changed successfully',
		});
	} catch (error) {
		console.error('Change password error:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error',
		});
	}
});

// Delete account endpoint
router.delete('/delete-account', verifyToken, async (req, res) => {
	try {
		const { password } = req.body;
		const username = req.user.username;

		// Validate input
		if (!password) {
			return res.status(400).json({
				success: false,
				message: 'Password is required to delete account',
			});
		}

		// Read users database
		const db = await readUsers();
		const userIndex = db.users.findIndex((user) => user.username === username);

		if (userIndex === -1) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			});
		}

		const user = db.users[userIndex];

		// Verify password
		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			return res.status(400).json({
				success: false,
				message: 'Password is incorrect',
			});
		}

		// Remove user from database
		db.users.splice(userIndex, 1);
		await writeUsers(db.users);

		res.json({
			success: true,
			message: 'Account deleted successfully',
		});
	} catch (error) {
		console.error('Delete account error:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error',
		});
	}
});

module.exports = { router, verifyToken };
