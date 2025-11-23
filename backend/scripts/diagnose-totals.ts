import { db } from '../src/db/client';
import { invoices } from '../src/db/schema';
import { sql } from 'drizzle-orm';

/**
 * Diagnostic script to analyze invoice totals and identify issues
 */

async function diagnoseTotals() {
	try {
		console.log('🔍 Analyzing invoice totals...\n');

		// Get overall statistics
		const result = await db.execute(
			sql`SELECT 
				COUNT(*) as count, 
				MIN(total) as min_total,
				MAX(total) as max_total,
				AVG(total) as avg_total,
				SUM(total) as sum_total
			FROM invoices`
		);

		const stats = result[0] as any;
		console.log('📊 Overall Statistics:');
		console.log('━'.repeat(80));
		console.log(`Total invoices: ${stats.count}`);
		console.log(
			`Min total: Rp ${parseFloat(stats.min_total).toLocaleString('id-ID', { minimumFractionDigits: 2 })}`
		);
		console.log(
			`Max total: Rp ${parseFloat(stats.max_total).toLocaleString('id-ID', { minimumFractionDigits: 2 })}`
		);
		console.log(
			`Avg total: Rp ${parseFloat(stats.avg_total).toLocaleString('id-ID', { minimumFractionDigits: 2 })}`
		);
		console.log(
			`Sum total: Rp ${parseFloat(stats.sum_total).toLocaleString('id-ID', { minimumFractionDigits: 2 })}`
		);
		console.log('━'.repeat(80));
		console.log();

		// Check distribution by ranges
		const ranges = [
			{ name: '< 1 million', min: 0, max: 1000000 },
			{ name: '1M - 10M', min: 1000000, max: 10000000 },
			{ name: '10M - 50M', min: 10000000, max: 50000000 },
			{ name: '50M - 100M', min: 50000000, max: 100000000 },
			{ name: '100M - 500M', min: 100000000, max: 500000000 },
			{ name: '500M - 1B', min: 500000000, max: 1000000000 },
			{ name: '> 1 billion', min: 1000000000, max: 999999999999 },
		];

		console.log('📈 Distribution by Range:');
		console.log('━'.repeat(80));

		for (const range of ranges) {
			const result = await db.execute(
				sql`SELECT COUNT(*) as count, SUM(total) as sum_total 
					FROM invoices 
					WHERE total >= ${range.min} AND total < ${range.max}`
			);
			const rangeStats = result[0] as any;
			const count = parseInt(rangeStats.count);
			const sum = parseFloat(rangeStats.sum_total || 0);

			if (count > 0) {
				console.log(
					`${range.name.padEnd(20)} : ${count.toString().padStart(5)} invoices | Total: Rp ${sum.toLocaleString(
						'id-ID',
						{ minimumFractionDigits: 2 }
					)}`
				);
			}
		}
		console.log('━'.repeat(80));
		console.log();

		// Show top 20 highest invoices
		const highInvoices = await db
			.select()
			.from(invoices)
			.where(sql`${invoices.total} > 10000000`)
			.orderBy(sql`${invoices.total} DESC`)
			.limit(20);

		console.log('🔝 Top 20 Highest Invoices (> 10M):');
		console.log('━'.repeat(80));
		console.log('No  | Invoice Number          | Total (Rp)          | Date        | Supplier');
		console.log('━'.repeat(80));

		highInvoices.forEach((inv, idx) => {
			const num = (idx + 1).toString().padStart(2);
			const invoiceNum = inv.invoiceNumber.padEnd(25);
			const total = parseFloat(inv.total as string)
				.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
				.padStart(19);
			const date = inv.date.padEnd(12);
			const supplier = inv.supplier.substring(0, 30);
			console.log(`${num}  | ${invoiceNum} | ${total} | ${date} | ${supplier}`);
		});
		console.log('━'.repeat(80));
		console.log();

		// Check for anomalies (invoices > 1 billion)
		const anomalies = await db
			.select()
			.from(invoices)
			.where(sql`${invoices.total} > 1000000000`);

		if (anomalies.length > 0) {
			console.log(`⚠️  WARNING: Found ${anomalies.length} invoices with totals > 1 billion (likely incorrect):`);
			console.log('━'.repeat(80));
			anomalies.slice(0, 10).forEach((inv) => {
				console.log(
					`${inv.invoiceNumber}: Rp ${parseFloat(inv.total as string).toLocaleString('id-ID', {
						minimumFractionDigits: 2,
					})}`
				);
			});
			if (anomalies.length > 10) {
				console.log(`... and ${anomalies.length - 10} more`);
			}
			console.log('━'.repeat(80));
		} else {
			console.log('✅ No invoices > 1 billion found. Data looks healthy!');
		}

		console.log();
		console.log('✨ Analysis complete!');
	} catch (error) {
		console.error('❌ Error during analysis:', error);
		throw error;
	} finally {
		process.exit(0);
	}
}

diagnoseTotals();
