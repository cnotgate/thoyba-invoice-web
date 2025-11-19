import { Hono } from 'hono';
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import { hashPassword } from '../utils/password';

const userRouter = new Hono();

// Protected: Get all users
userRouter.get('/', authMiddleware, async (c) => {
	try {
		const allUsers = await db.select({
			id: users.id,
			username: users.username,
			role: users.role,
			createdAt: users.createdAt,
		}).from(users);

		return c.json(allUsers);
	} catch (error) {
		console.error('Get users error:', error);
		return c.json({ success: false, message: 'Failed to get users' }, 500);
	}
});

// Protected: Create user
userRouter.post('/', authMiddleware, async (c) => {
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
			user: {
				id: newUser.id,
				username: newUser.username,
				role: newUser.role,
			},
		});
	} catch (error) {
		console.error('Create user error:', error);
		return c.json({ success: false, message: 'Failed to create user' }, 500);
	}
});

// Protected: Delete user
userRouter.delete('/:id', authMiddleware, async (c) => {
	try {
		const id = parseInt(c.req.param('id'));

		await db.delete(users).where(eq(users.id, id));

		return c.json({ success: true, message: 'User deleted' });
	} catch (error) {
		console.error('Delete user error:', error);
		return c.json({ success: false, message: 'Failed to delete user' }, 500);
	}
});

export { userRouter };
