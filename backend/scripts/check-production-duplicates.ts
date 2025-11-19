import { db } from '../src/db/client';
import { sql } from 'drizzle-orm';

async function checkProductionDuplicates() {
	console.log('=== Checking Production Duplicates ===\n');

	// Check for duplicate invoice numbers
	const duplicates = await db.execute(sql`
		SELECT 
			invoice_number,
			COUNT(*) as duplicate_count,
			array_agg(id) as ids,
			array_agg(total) as totals,
			SUM(CAST(regexp_replace(total, '[^0-9.]', '', 'g') AS DECIMAL(20, 2))) as sum_of_duplicates
		FROM invoices
		GROUP BY invoice_number
		HAVING COUNT(*) > 1
		ORDER BY COUNT(*) DESC
		LIMIT 20
	`) as any;

	if (duplicates.length > 0) {
		console.log(`⚠️  Found ${duplicates.length} duplicate invoice numbers:\n`);
		
		let totalDuplicateInvoices = 0;
		let totalDuplicateValue = 0;

		duplicates.forEach((dup: any, idx: number) => {
			console.log(`${idx + 1}. ${dup.invoice_number}`);
			console.log(`   Count: ${dup.duplicate_count}`);
			console.log(`   IDs: ${dup.ids}`);
			console.log(`   Totals: ${dup.totals}`);
			console.log(`   Sum: Rp ${Number(dup.sum_of_duplicates).toLocaleString('id-ID')}\n`);
			
			totalDuplicateInvoices += Number(dup.duplicate_count) - 1; // -1 because we keep one
			totalDuplicateValue += Number(dup.sum_of_duplicates);
		});

		console.log('💔 Impact of Duplicates:');
		console.log(`  Duplicate invoice entries: ${totalDuplicateInvoices}`);
		console.log(`  Total value in duplicates: Rp ${totalDuplicateValue.toLocaleString('id-ID')}`);
		console.log('\n❌ DUPLICATES ARE INFLATING THE TOTAL!\n');
		
	} else {
		console.log('✅ No duplicates found\n');
	}

	// Check total count
	const stats = await db.execute(sql`
		SELECT 
			COUNT(*) as total_invoices,
			COUNT(DISTINCT invoice_number) as unique_invoices,
			SUM(CAST(regexp_replace(total, '[^0-9.]', '', 'g') AS DECIMAL(20, 2))) as total_value
		FROM invoices
	`) as any;

	console.log('📊 Summary:');
	console.log(`  Total invoice rows: ${stats[0].total_invoices}`);
	console.log(`  Unique invoice numbers: ${stats[0].unique_invoices}`);
	console.log(`  Difference (duplicates): ${Number(stats[0].total_invoices) - Number(stats[0].unique_invoices)}`);
	console.log(`  Total value: Rp ${Number(stats[0].total_value).toLocaleString('id-ID')}`);

	if (Number(stats[0].total_invoices) !== Number(stats[0].unique_invoices)) {
		console.log('\n💡 SOLUTION: Run duplicate cleanup script to remove extras');
	}

	process.exit(0);
}

checkProductionDuplicates();
