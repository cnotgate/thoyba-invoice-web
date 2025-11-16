const express = require('express');
const jsonServer = require('json-server');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { router: loginRouter, verifyToken } = require('./login');

const app = express();
const port = process.env.PORT || 3001;

// JSON Server setup
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

// Middleware
server.use(
	cors({
		origin: true, // Allow all origins
		credentials: true,
	})
);
server.use(express.json());

// Custom routes
server.use('/auth', loginRouter);

// Setup admin endpoint
server.post('/setup-admin', async (req, res) => {
	try {
		const { username, password } = req.body;

		if (!username || !password) {
			return res.status(400).json({
				success: false,
				message: 'Username and password are required',
			});
		}

		// Check if users already exist
		const dbPath = path.join(__dirname, 'db.json');
		let db = { users: [] };

		try {
			const data = await fs.readFile(dbPath, 'utf8');
			db = JSON.parse(data);
		} catch (error) {
			// File doesn't exist or is empty
		}

		if (db.users && db.users.length > 0) {
			return res.status(403).json({
				success: false,
				message: 'Admin user already exists',
			});
		}

		// Create admin user
		const bcrypt = require('bcrypt');
		const hashedPassword = await bcrypt.hash(password, 10);

		const adminUser = {
			username,
			password: hashedPassword,
			role: 'admin',
			createdAt: new Date().toISOString(),
		};

		db.users = [adminUser];
		await fs.writeFile(dbPath, JSON.stringify(db, null, 2));

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

// Protect invoice routes with token verification
server.use('/invoices', (req, res, next) => {
	if (req.method !== 'GET') {
		return verifyToken(req, res, next);
	}
	next();
});

// Custom paginated invoices endpoint (defined before middleware)
server.get('/invoices/paginated', async (req, res) => {
	try {
		console.log('Paginated request received:', req.query);
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 50;
		const offset = (page - 1) * limit;

		// Read database
		const dbPath = path.join(__dirname, 'db.json');
		console.log('Reading database from:', dbPath);
		const dbText = await fs.readFile(dbPath, 'utf8');
		const db = JSON.parse(dbText);
		console.log('Database loaded, invoices count:', db.invoices?.length || 0);

		// Sort invoices by timestamp (newest first)
		const sortedInvoices = db.invoices.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

		// Apply pagination
		const paginatedInvoices = sortedInvoices.slice(offset, offset + limit);
		const totalInvoices = sortedInvoices.length;
		const totalPages = Math.ceil(totalInvoices / limit);

		// Calculate stats from all invoices
		const totalPaid = sortedInvoices.filter((inv) => inv.paid).length;
		const totalUnpaid = totalInvoices - totalPaid;
		const totalValue = sortedInvoices.reduce((sum, invoice) => {
			const numericValue = parseFloat(invoice.total);
			return sum + (isNaN(numericValue) ? 0 : numericValue);
		}, 0);

		console.log(`Returning ${paginatedInvoices.length} invoices for page ${page}`);
		res.json({
			invoices: paginatedInvoices,
			pagination: {
				currentPage: page,
				totalPages: totalPages,
				totalInvoices: totalInvoices,
				totalPaid: totalPaid,
				totalUnpaid: totalUnpaid,
				totalValue: totalValue,
				limit: limit,
				hasNextPage: page < totalPages,
				hasPrevPage: page > 1,
			},
		});
	} catch (error) {
		console.error('Error fetching paginated invoices:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Test suppliers endpoint
server.get('/test-suppliers', (req, res) => {
	res.json(['Test Supplier 1', 'Test Supplier 2']);
});

// Custom supplierList endpoint
server.get('/supplierList', (req, res) => {
	try {
		const dbPath = path.join(__dirname, 'db.json');
		const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
		
		// Return the supplierList array from db.json
		if (dbData.supplierList && Array.isArray(dbData.supplierList)) {
			res.json(dbData.supplierList);
		} else {
			console.error('supplierList not found in db.json');
			res.status(404).json({ error: 'Supplier list not found' });
		}
	} catch (error) {
		console.error('Error reading supplierList:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Use JSON Server middleware and router
server.use(middlewares);
server.use(router);

// Mount json-server on /api
app.use(
	'/api',
	(req, res, next) => {
		// Allow public access to GET suppliers and POST invoices
		if (
			(req.method === 'GET' && req.path === '/supplierList') ||
			(req.method === 'POST' && req.path === '/invoices')
		) {
			return next();
		}
		// Require auth for all other API routes
		verifyToken(req, res, next);
	},
	server
);

// Start server
app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
	console.log(`Admin frontend: http://localhost:${port}/admin-frontend/login.html`);
	console.log(`User frontend: http://localhost:${port}/frontend/index.html`);
});
