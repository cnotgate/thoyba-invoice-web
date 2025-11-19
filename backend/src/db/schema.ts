import { pgTable, serial, varchar, timestamp, boolean, text, index } from 'drizzle-orm/pg-core';

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

export const invoices = pgTable(
	'invoices',
	{
		id: serial('id').primaryKey(),
		supplier: varchar('supplier', { length: 255 }).notNull(),
		branch: varchar('branch', { length: 50 }).notNull(),
		date: varchar('date', { length: 10 }).notNull(),
		invoiceNumber: varchar('invoice_number', { length: 100 }).notNull(),
		total: varchar('total', { length: 50 }).notNull(),
		description: text('description'),
		timestamp: timestamp('timestamp').defaultNow(),
		paid: boolean('paid').default(false),
		paidDate: varchar('paid_date', { length: 10 }),
	},
	(table) => ({
		supplierIdx: index('idx_invoices_supplier').on(table.supplier),
		dateIdx: index('idx_invoices_date').on(table.date),
		paidIdx: index('idx_invoices_paid').on(table.paid),
		timestampIdx: index('idx_invoices_timestamp').on(table.timestamp),
		branchIdx: index('idx_invoices_branch').on(table.branch),
	})
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
