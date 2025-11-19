import type { Context, Next } from 'hono';
import { verifyToken } from '../utils/jwt';

export async function authMiddleware(c: Context, next: Next) {
	const authHeader = c.req.header('Authorization');

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return c.json({ success: false, message: 'Access token required' }, 401);
	}

	const token = authHeader.substring(7);
	const payload = await verifyToken(token);

	if (!payload) {
		return c.json({ success: false, message: 'Invalid token' }, 401);
	}

	c.set('user', payload);
	await next();
}
