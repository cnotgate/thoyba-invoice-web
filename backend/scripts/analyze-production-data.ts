import { db } from '../src/db/client';
import { sql } from 'drizzle-orm';

async function analyzeProductionData() {
	console.log('=== Production Data Analysis ===\n');

	// Get invoice count
	const countResult = (await db.execute(sql`
		SELECT COUNT(*) as total_count FROM invoices
	`)) as any;

	console.log('📊 Invoice Count:');
	console.log('  Total:', countResult[0].total_count);
	console.log('  Expected (from stats): 5070');
	console.log('  Difference:', 5070 - Number(countResult[0].total_count));

	// Calculate actual sum
	const sumResult = (await db.execute(sql`
		SELECT 
			SUM(CAST(regexp_replace(total, '[^0-9.]', '', 'g') AS DECIMAL(20, 2))) as actual_sum
		FROM invoices
	`)) as any;

	console.log('\n💰 Total Value:');
	console.log('  Actual Sum: Rp', Number(sumResult[0].actual_sum).toLocaleString('id-ID'));
	console.log('  Stats Table: Rp 404,250,241,096.06');
	console.log('  Difference: Rp', (Number(sumResult[0].actual_sum) - 404250241096.06).toLocaleString('id-ID'));

	// Check paid/unpaid breakdown
	const breakdown = (await db.execute(sql`
		SELECT 
			paid,
			COUNT(*) as count,
			SUM(CAST(regexp_replace(total, '[^0-9.]', '', 'g') AS DECIMAL(20, 2))) as sum_value
		FROM invoices
		GROUP BY paid
	`)) as any;

	console.log('\n📈 Breakdown by Payment Status:');
	breakdown.forEach((row: any) => {
		console.log(`  ${row.paid ? 'Paid' : 'Unpaid'}:`);
		console.log(`    Count: ${row.count}`);
		console.log(`    Total: Rp ${Number(row.sum_value).toLocaleString('id-ID')}`);
	});

	// Compare with your local data
	console.log('\n📊 Comparison with Local:');
	console.log('  Local: 4,998 invoices = Rp 560,581,143,798');
	console.log('  Production: 5,070 invoices = Rp 404,250,241,096');
	console.log('  Diff: +72 invoices but -156 billion rupiah');
	console.log('\n⚠️  More invoices but LESS total value = DATA QUALITY ISSUE');

	process.exit(0);
}

analyzeProductionData();
