import { Hono } from 'hono';
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';

const authRouter = new Hono();

authRouter.post('/login', async (c) => {
	try {
		const { username, password } = await c.req.json();

		// Query database with error handling
		let user;
		try {
			[user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
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
				created_at: user.createdAt 
			},
		});
	} catch (error) {
		console.error('Login error:', error);
		return c.json({ success: false, message: 'Login failed' }, 500);
	}
});

authRouter.post('/register', async (c) => {
	try {
		const { username, password, role = 'user' } = await c.req.json();

		// Check if user exists
		const [existing] = await db.select().from(users).where(eq(users.username, username)).limit(1);

		if (existing) {
			return c.json({ success: false, message: 'Username already exists' }, 400);
		}

		const hashedPassword = await hashPassword(password);

		const [newUser] = await db
			.insert(users)
			.values({
				username,
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
