import { pgTable, serial, varchar, timestamp, boolean, text, index, integer, decimal } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
	id: serial('id').primaryKey(),
	username: varchar('username', { length: 50 }).notNull().unique(),
	password: varchar('password', { length: 255 }).notNull(),
	role: varchar('role', { length: 20 }).notNull().default('user'),
	createdAt: timestamp('created_at').defaultNow(),
});

export const suppliers = pgTable('suppliers', {
	id: serial('id').primaryKey(),
	name: varchar('name', { length: 255 }).notNull().unique(),
	createdAt: timestamp('created_at').defaultNow(),
});

export const stats = pgTable('stats', {
	id: serial('id').primaryKey(),
	totalInvoices: integer('total_invoices').notNull().default(0),
	paidInvoices: integer('paid_invoices').notNull().default(0),
	unpaidInvoices: integer('unpaid_invoices').notNull().default(0),
	totalValue: decimal('total_value', { precision: 15, scale: 2 }).notNull().default('0'),
	lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

export const invoices = pgTable(
	'invoices',
	{
		id: serial('id').primaryKey(),
		supplier: varchar('supplier', { length: 255 }).notNull(),
		branch: varchar('branch', { length: 50 }).notNull(),
		date: varchar('date', { length: 50 }).notNull(),
		invoiceNumber: varchar('invoice_number', { length: 100 }).notNull(),
		total: decimal('total', { precision: 15, scale: 2 }).notNull(),
		description: text('description'),
		timestamp: timestamp('timestamp').defaultNow(),
		paid: boolean('paid').default(false),
		paidDate: varchar('paid_date', { length: 50 }),
	},
	(table) => ({
		supplierIdx: index('idx_invoices_supplier').on(table.supplier),
		dateIdx: index('idx_invoices_date').on(table.date),
		paidIdx: index('idx_invoices_paid').on(table.paid),
		timestampIdx: index('idx_invoices_timestamp').on(table.timestamp),
		branchIdx: index('idx_invoices_branch').on(table.branch),
		invoiceNumberIdx: index('idx_invoices_invoice_number').on(table.invoiceNumber),
	})
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type Stats = typeof stats.$inferSelect;
export type NewStats = typeof stats.$inferInsert;
