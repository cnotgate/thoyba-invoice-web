import { Hono } from 'hono';
import { db } from '../db/client';
import { suppliers } from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';

const supplierRouter = new Hono();

// Public: Get all suppliers (list of names)
supplierRouter.get('/list', async (c) => {
	try {
		const allSuppliers = await db.select().from(suppliers).orderBy(asc(suppliers.name));
		return c.json(allSuppliers.map((s) => s.name));
	} catch (error) {
		console.error('Get suppliers error:', error);
		return c.json({ error: 'Failed to get suppliers' }, 500);
	}
});

// Protected: Get all suppliers (with full details)
supplierRouter.get('/', authMiddleware, async (c) => {
	try {
		const allSuppliers = await db.select().from(suppliers).orderBy(asc(suppliers.name));
		return c.json(allSuppliers);
	} catch (error) {
		console.error('Get suppliers error:', error);
		return c.json({ error: 'Failed to get suppliers' }, 500);
	}
});

// Protected: Create supplier
supplierRouter.post('/', authMiddleware, async (c) => {
	try {
		const { name } = await c.req.json();

		const [newSupplier] = await db.insert(suppliers).values({ name }).returning();

		return c.json({ success: true, supplier: newSupplier });
	} catch (error) {
		console.error('Create supplier error:', error);
		return c.json({ success: false, message: 'Failed to create supplier' }, 500);
	}
});

// Protected: Update supplier
supplierRouter.patch('/:id', authMiddleware, async (c) => {
	try {
		const id = parseInt(c.req.param('id'));
		const { name } = await c.req.json();

		const [updatedSupplier] = await db.update(suppliers).set({ name }).where(eq(suppliers.id, id)).returning();

		return c.json({ success: true, supplier: updatedSupplier });
	} catch (error) {
		console.error('Update supplier error:', error);
		return c.json({ success: false, message: 'Failed to update supplier' }, 500);
	}
});

// Protected: Delete supplier
supplierRouter.delete('/:id', authMiddleware, async (c) => {
	try {
		const id = parseInt(c.req.param('id'));

		await db.delete(suppliers).where(eq(suppliers.id, id));

		return c.json({ success: true, message: 'Supplier deleted' });
	} catch (error) {
		console.error('Delete supplier error:', error);
		return c.json({ success: false, message: 'Failed to delete supplier' }, 500);
	}
});

export { supplierRouter };
