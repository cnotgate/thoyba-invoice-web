import { Hono } from 'hono';
import { db } from '../db/client';
import { invoices, stats } from '../db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';

const invoiceRouter = new Hono();

// Public: Create invoice
invoiceRouter.post('/', async (c) => {
	try {
		const data = await c.req.json();

		const [newInvoice] = await db
			.insert(invoices)
			.values({
				supplier: data.supplier,
				branch: data.branch,
				date: data.date,
				invoiceNumber: data.invoiceNumber,
				total: data.total,
				description: data.description || null,
				paid: false,
			})
			.returning();

		return c.json({ success: true, invoice: newInvoice });
	} catch (error) {
		console.error('Create invoice error:', error);
		return c.json({ success: false, message: 'Failed to create invoice' }, 500);
	}
});

// Protected: Get dashboard statistics (from cached stats table)
invoiceRouter.get('/stats', authMiddleware, async (c) => {
	try {
		// Get stats from cache table
		const [statsData] = await db.select().from(stats).limit(1);

		// Get recent 5 invoices
		const recentInvoices = await db.select().from(invoices).orderBy(desc(invoices.timestamp)).limit(5);

		return c.json({
			total: statsData?.totalInvoices || 0,
			paid: statsData?.paidInvoices || 0,
			unpaid: statsData?.unpaidInvoices || 0,
			totalValue: Number(statsData?.totalValue) || 0,
			recent: recentInvoices,
		});
	} catch (error) {
		console.error('Get stats error:', error);
		return c.json({ success: false, message: 'Failed to get statistics' }, 500);
	}
});

// Protected: Get paginated invoices
invoiceRouter.get('/paginated', authMiddleware, async (c) => {
	try {
		const page = parseInt(c.req.query('page') || '1');
		const limit = parseInt(c.req.query('limit') || '50');
		const offset = (page - 1) * limit;

		const allInvoices = await db
			.select()
			.from(invoices)
			.orderBy(desc(invoices.timestamp))
			.limit(limit)
			.offset(offset);

		const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(invoices);

		const totalInvoices = Number(count);
		const totalPages = Math.ceil(totalInvoices / limit);

		const [{ paidCount }] = await db
			.select({ paidCount: sql<number>`count(*)` })
			.from(invoices)
			.where(eq(invoices.paid, true));

		const totalPaid = Number(paidCount);
		const totalUnpaid = totalInvoices - totalPaid;

		const [{ totalValue }] = await db
			.select({ totalValue: sql<number>`sum(cast(total as numeric))` })
			.from(invoices);

		return c.json({
			invoices: allInvoices,
			pagination: {
				currentPage: page,
				totalPages,
				totalInvoices,
				totalPaid,
				totalUnpaid,
				totalValue: Number(totalValue) || 0,
				limit,
				hasNextPage: page < totalPages,
				hasPrevPage: page > 1,
			},
		});
	} catch (error) {
		console.error('Get invoices error:', error);
		return c.json({ success: false, message: 'Failed to get invoices' }, 500);
	}
});

// Protected: Get all invoices (for admin) - with optional pagination, search, and filters
invoiceRouter.get('/', authMiddleware, async (c) => {
	try {
		const limit = c.req.query('limit');
		const offset = c.req.query('offset');
		const search = c.req.query('search');
		const status = c.req.query('status'); // 'paid', 'unpaid', or 'all'

		const limitNum = parseInt(limit || '100');
		const offsetNum = parseInt(offset || '0');

		// Build WHERE conditions
		const conditions = [];

		// Search filter (case-insensitive search in supplier and invoice number)
		if (search && search.trim()) {
			const searchTerm = search.trim().toLowerCase();
			conditions.push(
				sql`(LOWER(${invoices.supplier}) LIKE ${`%${searchTerm}%`} OR LOWER(${
					invoices.invoiceNumber
				}) LIKE ${`%${searchTerm}%`})`
			);
		}

		// Status filter
		if (status === 'paid') {
			conditions.push(eq(invoices.paid, true));
		} else if (status === 'unpaid') {
			conditions.push(eq(invoices.paid, false));
		}

		// Execute query with filters
		let query = db.select().from(invoices);

		if (conditions.length > 0) {
			query = query.where(and(...conditions)) as any;
		}

		const allInvoices = await query.orderBy(desc(invoices.timestamp)).limit(limitNum).offset(offsetNum);

		return c.json(allInvoices);
	} catch (error) {
		console.error('Get invoices error:', error);
		return c.json({ success: false, message: 'Failed to get invoices' }, 500);
	}
});

// Protected: Update invoice payment status
invoiceRouter.patch('/:id', authMiddleware, async (c) => {
	try {
		const id = parseInt(c.req.param('id'));
		const body = await c.req.json();

		// Build update object with only provided fields
		const updateData: any = {};
		if (body.supplier !== undefined) updateData.supplier = body.supplier;
		if (body.branch !== undefined) updateData.branch = body.branch;
		if (body.date !== undefined) updateData.date = body.date;
		if (body.invoiceNumber !== undefined) updateData.invoiceNumber = body.invoiceNumber;
		if (body.total !== undefined) updateData.total = body.total;
		if (body.description !== undefined) updateData.description = body.description;
		if (body.paid !== undefined) updateData.paid = body.paid;
		if (body.paidDate !== undefined) updateData.paidDate = body.paidDate;

		const [updatedInvoice] = await db.update(invoices).set(updateData).where(eq(invoices.id, id)).returning();

		return c.json({ success: true, invoice: updatedInvoice });
	} catch (error) {
		console.error('Update invoice error:', error);
		return c.json({ success: false, message: 'Failed to update invoice' }, 500);
	}
});

// Protected: Delete invoice
invoiceRouter.delete('/:id', authMiddleware, async (c) => {
	try {
		const id = parseInt(c.req.param('id'));

		await db.delete(invoices).where(eq(invoices.id, id));

		return c.json({ success: true, message: 'Invoice deleted' });
	} catch (error) {
		console.error('Delete invoice error:', error);
		return c.json({ success: false, message: 'Failed to delete invoice' }, 500);
	}
});

export { invoiceRouter };
