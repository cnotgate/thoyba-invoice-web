import { db } from '../src/db/client';
import { invoices } from '../src/db/schema';
import { sql } from 'drizzle-orm';

/**
 * This script fixes incorrectly parsed total values in the database.
 *
 * Problem: Some invoices have totals that were multiplied by 100 due to
 * incorrect parsing of formats like "56.489.562.78" (56 million)
 * being read as 5.6 billion instead.
 *
 * Solution: Identify invoices with abnormally high totals (> 1 billion)
 * and divide them by 100 to get the correct value.
 */

async function fixTotalValues() {
	try {
		console.log('🔍 Checking for incorrectly parsed totals...\n');

		// Find all invoices with suspiciously high totals (> 1 billion)
		const suspiciousInvoices = await db
			.select()
			.from(invoices)
			.where(sql`${invoices.total} > 1000000000`);

		if (suspiciousInvoices.length === 0) {
			console.log('✅ No suspicious totals found. All values look correct!');
			return;
		}

		console.log(`📊 Found ${suspiciousInvoices.length} invoices with totals > 1 billion:\n`);

		// Show samples before fixing
		console.log('Sample invoices BEFORE fix:');
		console.log('━'.repeat(80));
		suspiciousInvoices.slice(0, 5).forEach((inv) => {
			console.log(`${inv.invoiceNumber}: ${inv.total}`);
		});
		console.log('━'.repeat(80));
		console.log();

		// Calculate what the new total would be
		const currentTotal = suspiciousInvoices.reduce((sum, inv) => sum + parseFloat(inv.total as string), 0);

		console.log(`Current total of suspicious invoices: Rp ${currentTotal.toLocaleString('id-ID')}`);
		console.log(`After fix (÷ 100): Rp ${(currentTotal / 100).toLocaleString('id-ID')}`);
		console.log();

		console.log('🔧 Fixing totals by dividing by 100...\n');

		// Fix each invoice by dividing total by 100
		let fixed = 0;
		for (const invoice of suspiciousInvoices) {
			const oldTotal = parseFloat(invoice.total as string);
			const newTotal = (oldTotal / 100).toFixed(2);

			await db
				.update(invoices)
				.set({ total: newTotal })
				.where(sql`${invoices.id} = ${invoice.id}`);

			fixed++;
			if (fixed % 100 === 0) {
				console.log(`   Fixed ${fixed}/${suspiciousInvoices.length} invoices...`);
			}
		}

		console.log(`✅ Fixed ${fixed} invoices!\n`);

		// Verify the fix
		const verifyInvoices = await db
			.select()
			.from(invoices)
			.where(
				sql`${invoices.id} IN (${sql.raw(
					suspiciousInvoices
						.slice(0, 5)
						.map((i) => i.id)
						.join(',')
				)})`
			);

		console.log('Sample invoices AFTER fix:');
		console.log('━'.repeat(80));
		verifyInvoices.forEach((inv) => {
			console.log(`${inv.invoiceNumber}: ${inv.total}`);
		});
		console.log('━'.repeat(80));
		console.log();

		// Show new database totals
		const result = await db.execute(sql`SELECT COUNT(*) as count, SUM(total) as total FROM invoices`);

		const stats = result[0] as { count: string; total: string };
		console.log(`📊 Database totals after fix:`);
		console.log(`   Total invoices: ${stats.count}`);
		console.log(
			`   Total value: Rp ${parseFloat(stats.total).toLocaleString('id-ID', {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			})}`
		);
		console.log();
		console.log('✨ Done!');
	} catch (error) {
		console.error('❌ Error fixing totals:', error);
		throw error;
	} finally {
		process.exit(0);
	}
}

fixTotalValues();
