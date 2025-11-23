import { Hono } from 'hono';
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';

const authRouter = new Hono();

// Password validation utility
const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
	const errors: string[] = [];
	if (password.length < 8) errors.push('Password must be at least 8 characters');
	if (!/[A-Z]/.test(password)) errors.push('Password must contain uppercase letter');
	if (!/[a-z]/.test(password)) errors.push('Password must contain lowercase letter');
	if (!/\d/.test(password)) errors.push('Password must contain number');
	if (!/[!@#$%^&*]/.test(password)) errors.push('Password must contain special character');
	return { valid: errors.length === 0, errors };
};

authRouter.post('/login', async (c) => {
	try {
		const body = await c.req.json();
		const { username, password } = body;

		// Input validation
		if (!username || !password) {
			return c.json({ success: false, message: 'Username and password are required' }, 400);
		}

		if (typeof username !== 'string' || typeof password !== 'string') {
			return c.json({ success: false, message: 'Invalid input format' }, 400);
		}

		if (username.length < 3 || username.length > 50) {
			return c.json({ success: false, message: 'Username must be 3-50 characters' }, 400);
		}

		if (password.length < 8) {
			return c.json({ success: false, message: 'Password must be at least 8 characters' }, 400);
		}

		// Sanitize inputs
		const sanitizedUsername = username.trim().toLowerCase();

		// Query database with error handling
		let user;
		try {
			[user] = await db.select().from(users).where(eq(users.username, sanitizedUsername)).limit(1);
		} catch (dbError: any) {
			console.error('Database error during login:', dbError);
			return c.json(
				{
					success: false,
					message: 'Database connection error. Please try again.',
				},
				503
			);
		}

		if (!user) {
			return c.json({ success: false, message: 'Invalid credentials' }, 401);
		}

		const isValid = await verifyPassword(password, user.password);

		if (!isValid) {
			// Log failed login attempt
			console.warn(`Failed login attempt for username: ${sanitizedUsername} from IP: ${c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP') || 'unknown'}`);
			return c.json({ success: false, message: 'Invalid credentials' }, 401);
		}

		const token = await generateToken({
			id: user.id,
			username: user.username,
			role: user.role,
		});

		return c.json({
			success: true,
			token,
			username: user.username,
			role: user.role,
			user: {
				id: user.id,
				username: user.username,
				role: user.role,
				created_at: user.createdAt,
			},
		});
	} catch (error) {
		console.error('Login error:', error);
		return c.json({ success: false, message: 'Login failed' }, 500);
	}
});

authRouter.post('/register', async (c) => {
	try {
		const body = await c.req.json();
		const { username, password, role = 'user' } = body;

		// Input validation
		if (!username || !password) {
			return c.json({ success: false, message: 'Username and password are required' }, 400);
		}

		if (typeof username !== 'string' || typeof password !== 'string') {
			return c.json({ success: false, message: 'Invalid input format' }, 400);
		}

		if (username.length < 3 || username.length > 50) {
			return c.json({ success: false, message: 'Username must be 3-50 characters' }, 400);
		}

		// Password strength validation
		const passwordValidation = validatePassword(password);
		if (!passwordValidation.valid) {
			return c.json({
				success: false,
				message: 'Password does not meet requirements',
				errors: passwordValidation.errors
			}, 400);
		}

		// Role validation
		if (!['admin', 'user'].includes(role)) {
			return c.json({ success: false, message: 'Invalid role' }, 400);
		}

		// Sanitize inputs
		const sanitizedUsername = username.trim().toLowerCase();

		// Check if user exists
		const [existing] = await db.select().from(users).where(eq(users.username, sanitizedUsername)).limit(1);

		if (existing) {
			return c.json({ success: false, message: 'Username already exists' }, 400);
		}

		const hashedPassword = await hashPassword(password);

		const [newUser] = await db
			.insert(users)
			.values({
				username: sanitizedUsername,
				password: hashedPassword,
				role,
			})
			.returning();

		return c.json({
			success: true,
			message: 'User created successfully',
			user: { id: newUser.id, username: newUser.username, role: newUser.role },
		});
	} catch (error) {
		console.error('Register error:', error);
		return c.json({ success: false, message: 'Registration failed' }, 500);
	}
});

export { authRouter };
