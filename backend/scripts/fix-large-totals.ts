import { db } from '../src/db/client';
import { invoices } from '../src/db/schema';
import { sql } from 'drizzle-orm';

/**
 * Advanced fix for incorrectly parsed totals
 * 
 * This handles cases where invoices were parsed with wrong decimal placement
 * Strategy: Check invoices with totals > 100M and analyze their patterns
 */

async function fixLargeTotals() {
	try {
		console.log('🔍 Analyzing invoices with large totals...\n');

		// Find invoices > 100 million (suspiciously high for most businesses)
		const largeInvoices = await db
			.select()
			.from(invoices)
			.where(sql`${invoices.total} > 100000000`)
			.orderBy(sql`${invoices.total} DESC`);

		if (largeInvoices.length === 0) {
			console.log('✅ No invoices > 100M found. All values look correct!');
			return;
		}

		console.log(`📊 Found ${largeInvoices.length} invoices with totals > 100 million:\n`);

		// Show all large invoices for review
		console.log('Invoices BEFORE fix:');
		console.log('━'.repeat(100));
		console.log('Invoice Number          | Total (Rp)          | Date        | Supplier');
		console.log('━'.repeat(100));
		
		let totalBeforeFix = 0;
		largeInvoices.forEach((inv) => {
			const invoiceNum = inv.invoiceNumber.padEnd(25);
			const total = parseFloat(inv.total as string);
			totalBeforeFix += total;
			const totalStr = total.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padStart(19);
			const date = inv.date.padEnd(12);
			const supplier = inv.supplier.substring(0, 40);
			console.log(`${invoiceNum} | ${totalStr} | ${date} | ${supplier}`);
		});
		console.log('━'.repeat(100));
		console.log(`\nTotal BEFORE fix: Rp ${totalBeforeFix.toLocaleString('id-ID', { minimumFractionDigits: 2 })}`);
		console.log(`Total AFTER fix (÷100): Rp ${(totalBeforeFix / 100).toLocaleString('id-ID', { minimumFractionDigits: 2 })}\n`);

		// Ask for confirmation (in production, you'd want manual review)
		console.log('⚠️  These invoices will be divided by 100.');
		console.log('   Example: 989,605,576.00 → 9,896,055.76');
		console.log('   Example: 974,459,140.00 → 9,744,591.40\n');

		console.log('🔧 Fixing totals by dividing by 100...\n');

		// Fix each invoice
		let fixed = 0;
		for (const invoice of largeInvoices) {
			const oldTotal = parseFloat(invoice.total as string);
			const newTotal = (oldTotal / 100).toFixed(2);

			await db
				.update(invoices)
				.set({ total: newTotal })
				.where(sql`${invoices.id} = ${invoice.id}`);

			fixed++;
			if (fixed % 10 === 0) {
				console.log(`   Fixed ${fixed}/${largeInvoices.length} invoices...`);
			}
		}

		console.log(`✅ Fixed ${fixed} invoices!\n`);

		// Verify the fix
		const verifyInvoices = await db
			.select()
			.from(invoices)
			.where(sql`${invoices.id} IN (${sql.raw(largeInvoices.slice(0, 10).map((i) => i.id).join(','))})`);

		console.log('Sample invoices AFTER fix:');
		console.log('━'.repeat(100));
		console.log('Invoice Number          | Total (Rp)          | Date        | Supplier');
		console.log('━'.repeat(100));
		
		verifyInvoices.forEach((inv) => {
			const invoiceNum = inv.invoiceNumber.padEnd(25);
			const total = parseFloat(inv.total as string).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padStart(19);
			const date = inv.date.padEnd(12);
			const supplier = inv.supplier.substring(0, 40);
			console.log(`${invoiceNum} | ${total} | ${date} | ${supplier}`);
		});
		console.log('━'.repeat(100));
		console.log();

		// Show new database totals
		const result = await db.execute(
			sql`SELECT COUNT(*) as count, SUM(total) as total FROM invoices`
		);

		const stats = result[0] as { count: string; total: string };
		console.log(`📊 Database totals after fix:`);
		console.log(`   Total invoices: ${stats.count}`);
		console.log(`   Total value: Rp ${parseFloat(stats.total).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
		console.log();

		// Verify no more large invoices
		const remaining = await db
			.select()
			.from(invoices)
			.where(sql`${invoices.total} > 100000000`);

		if (remaining.length > 0) {
			console.log(`⚠️  Warning: ${remaining.length} invoices still > 100M after fix`);
		} else {
			console.log('✅ No invoices > 100M remaining. All totals look correct!');
		}

		console.log('\n✨ Done!');
	} catch (error) {
		console.error('❌ Error fixing totals:', error);
		throw error;
	} finally {
		process.exit(0);
	}
}

fixLargeTotals();
