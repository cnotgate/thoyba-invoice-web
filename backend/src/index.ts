import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authRouter } from './routes/auth';
import { invoiceRouter } from './routes/invoices';
import { supplierRouter } from './routes/suppliers';
import { userRouter } from './routes/users';

const app = new Hono();

// Middleware
app.use(
	'*',
	cors({
		origin: ['http://localhost:3000', 'http://localhost:8600'],
		credentials: true,
	})
);
app.use('*', logger());

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
