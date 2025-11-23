import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authRouter } from './routes/auth';
import { invoiceRouter } from './routes/invoices';
import { supplierRouter } from './routes/suppliers';
import { userRouter } from './routes/users';
import { config } from 'dotenv';

// Load environment variables
config();

const app = new Hono();

// Security middleware
app.use('*', async (c, next) => {
	// Security headers
	c.header('X-Content-Type-Options', 'nosniff');
	c.header('X-Frame-Options', 'DENY');
	c.header('X-XSS-Protection', '1; mode=block');
	c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
	c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

	// Remove server information
	c.header('X-Powered-By', '');

	await next();
});

// Rate limiting middleware
const rateLimitStore = new Map<string, { count: number; resetTime: number; blockedUntil?: number }>();
const loginAttemptsStore = new Map<string, { attempts: number; lastAttempt: number; blockedUntil?: number }>();

// Get client IP with better security
function getClientIP(c: any): string {
	// Prioritize headers that are harder to spoof
	const ip = c.req.header('CF-Connecting-IP') || // Cloudflare
			   c.req.header('X-Real-IP') ||       // Nginx
			   c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() || // First IP in chain
			   c.req.raw?.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ||
			   '127.0.0.1'; // Local development fallback

	// Validate IP format
	const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
	const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

	if (ipv4Regex.test(ip) || ipv6Regex.test(ip)) {
		return ip;
	}

	// Fallback for development
	return '127.0.0.1';
}

// General rate limiting middleware (100 req/15min)
app.use('*', async (c, next) => {
	const clientIP = getClientIP(c);
	const now = Date.now();
	const windowMs = 15 * 60 * 1000; // 15 minutes
	const maxRequests = 100;

	// Skip rate limiting for health check
	if (c.req.path === '/health') {
		await next();
		return;
	}

	const key = `general:${clientIP}:${Math.floor(now / windowMs)}`;
	const record = rateLimitStore.get(key);

	if (record && now < record.resetTime) {
		if (record.count >= maxRequests) {
			console.warn(`Rate limit exceeded for IP: ${clientIP}, path: ${c.req.path}`);
			return c.json({ error: 'Too many requests' }, 429);
		}
		record.count++;
	} else {
		rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
	}

	// Clean up old records (limit map size to prevent memory leak)
	if (rateLimitStore.size > 10000) {
		const cutoff = now - windowMs;
		for (const [k, v] of rateLimitStore.entries()) {
			if (now > v.resetTime || v.resetTime < cutoff) {
				rateLimitStore.delete(k);
			}
		}
	}

	await next();
});

// Brute force protection for auth endpoints
app.use('/api/auth/*', async (c, next) => {
	const clientIP = getClientIP(c);
	const now = Date.now();

	// Different limits for different auth actions
	let maxAttempts = 5; // login attempts
	let windowMs = 15 * 60 * 1000; // 15 minutes
	let blockDuration = 30 * 60 * 1000; // 30 minutes block

	if (c.req.path.includes('/register')) {
		maxAttempts = 3; // stricter for registration
		windowMs = 60 * 60 * 1000; // 1 hour
		blockDuration = 24 * 60 * 60 * 1000; // 24 hours block
	}

	const key = `auth:${clientIP}`;
	const record = loginAttemptsStore.get(key);

	// Check if currently blocked
	if (record?.blockedUntil && now < record.blockedUntil) {
		const remainingMinutes = Math.ceil((record.blockedUntil - now) / (60 * 1000));
		console.warn(`Blocked auth attempt from IP: ${clientIP}, remaining: ${remainingMinutes} minutes`);
		return c.json({
			error: 'Too many failed attempts. Try again later.',
			retryAfter: remainingMinutes
		}, 429);
	}

	// Check rate limit within window
	if (record && (now - record.lastAttempt) < windowMs) {
		if (record.attempts >= maxAttempts) {
			// Block the IP
			const blockedUntil = now + blockDuration;
			loginAttemptsStore.set(key, {
				attempts: record.attempts + 1,
				lastAttempt: now,
				blockedUntil
			});

			console.error(`IP ${clientIP} blocked for ${blockDuration / (60 * 1000)} minutes due to excessive auth attempts`);
			return c.json({
				error: 'Account temporarily locked due to suspicious activity',
				retryAfter: Math.ceil(blockDuration / (60 * 1000))
			}, 429);
		}
		record.attempts++;
		record.lastAttempt = now;
	} else {
		// Reset or create new record
		loginAttemptsStore.set(key, { attempts: 1, lastAttempt: now });
	}

	// Store auth attempt result for cleanup
	const authKey = key;
	await next();
});

// Clean up old auth attempt records periodically
setInterval(() => {
	const now = Date.now();
	const maxAge = 24 * 60 * 60 * 1000; // 24 hours

	for (const [key, record] of loginAttemptsStore.entries()) {
		if ((now - record.lastAttempt) > maxAge ||
			(record.blockedUntil && now > record.blockedUntil)) {
			loginAttemptsStore.delete(key);
		}
	}

	// Limit map size
	if (loginAttemptsStore.size > 5000) {
		console.warn('Auth attempts store is getting large, consider reviewing security logs');
	}
}, 60 * 60 * 1000); // Clean up every hour

// Request size limit
app.use('*', async (c, next) => {
	const contentLength = c.req.header('content-length');
	if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB limit
		return c.json({ error: 'Request too large' }, 413);
	}
	await next();
});

// CORS middleware with strict origin validation
app.use('*', async (c, next) => {
	const origin = c.req.header('origin');
	const corsOrigins = process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:8600';
	const allowedOrigins = corsOrigins.split(',').map(origin => origin.trim());

	if (origin && !allowedOrigins.includes(origin)) {
		return c.json({ error: 'CORS policy violation' }, 403);
	}

	c.header('Access-Control-Allow-Origin', origin || '');
	c.header('Access-Control-Allow-Credentials', 'true');
	c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	c.header('Access-Control-Max-Age', '86400');

	if (c.req.method === 'OPTIONS') {
		return c.text('', 200);
	}

	await next();
});
const sanitizeInput = (input: string): string => {
	if (typeof input !== 'string') return '';
	return input
		.trim()
		.replace(/[<>]/g, '') // Remove potential XSS characters
		.slice(0, 1000); // Limit length
};

const validateEmail = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email) && email.length <= 254;
};

const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
	const errors: string[] = [];
	if (password.length < 8) errors.push('Password must be at least 8 characters');
	if (!/[A-Z]/.test(password)) errors.push('Password must contain uppercase letter');
	if (!/[a-z]/.test(password)) errors.push('Password must contain lowercase letter');
	if (!/\d/.test(password)) errors.push('Password must contain number');
	if (!/[!@#$%^&*]/.test(password)) errors.push('Password must contain special character');
	return { valid: errors.length === 0, errors };
};

// SQL injection protection (additional layer)
const validateSqlInput = (input: string): boolean => {
	const dangerousPatterns = [
		/(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
		/('|(\\x27)|(\\x2D\\x2D)|(\\#)|(\\x23)|(\-\-)|(\;)|(\\x3B))/i,
	];
	return !dangerousPatterns.some(pattern => pattern.test(input));
};

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.route('/api/auth', authRouter);
app.route('/api/invoices', invoiceRouter);
app.route('/api/suppliers', supplierRouter);
app.route('/api/users', userRouter);

// 404 handler
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// Error handler
app.onError((err, c) => {
	console.error(err);
	return c.json({ error: 'Internal server error' }, 500);
});

export default {
	port: process.env.PORT || 3001,
	fetch: app.fetch,
};
