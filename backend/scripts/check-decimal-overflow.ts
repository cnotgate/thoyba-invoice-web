import { db } from '../src/db/client';
import { sql } from 'drizzle-orm';

async function checkDecimalOverflow() {
	console.log('=== Checking for DECIMAL Overflow Issues ===\n');

	// Check with DECIMAL(15,2) (current - MAX: 999,999,999,999.99)
	const withLimit = await db.execute(sql`
		SELECT 
			COUNT(*) as count,
			SUM(
				CAST(
					regexp_replace(total, '[^0-9.]', '', 'g') AS DECIMAL(15, 2)
				)
			) as sum_with_limit
		FROM invoices
	`) as any;

	console.log('📊 With DECIMAL(15, 2) - Current Implementation:');
	console.log('  Count:', withLimit[0].count);
	console.log('  Sum:', Number(withLimit[0].sum_with_limit).toLocaleString('id-ID'));
	console.log('  Max allowed: 999,999,999,999.99 (~999 miliar)\n');

	// Check with DECIMAL(20,2) (larger - MAX: 999,999,999,999,999.99)
	const withoutLimit = await db.execute(sql`
		SELECT 
			COUNT(*) as count,
			SUM(
				CAST(
					regexp_replace(total, '[^0-9.]', '', 'g') AS DECIMAL(20, 2)
				)
			) as sum_without_limit
		FROM invoices
	`) as any;

	console.log('📊 With DECIMAL(20, 2) - Larger Precision:');
	console.log('  Count:', withoutLimit[0].count);
	console.log('  Sum:', Number(withoutLimit[0].sum_without_limit).toLocaleString('id-ID'));
	console.log('  Max allowed: 999,999,999,999,999.99 (~999 triliun)\n');

	// Check for individual invoices that might overflow
	const largeValues = await db.execute(sql`
		SELECT 
			invoice_number,
			total,
			CAST(regexp_replace(total, '[^0-9.]', '', 'g') AS DECIMAL(20, 2)) as parsed_value
		FROM invoices
		WHERE CAST(regexp_replace(total, '[^0-9.]', '', 'g') AS DECIMAL(20, 2)) > 999999999999.99
		ORDER BY CAST(regexp_replace(total, '[^0-9.]', '', 'g') AS DECIMAL(20, 2)) DESC
		LIMIT 10
	`) as any;

	if (largeValues.length > 0) {
		console.log('⚠️  Found invoices EXCEEDING DECIMAL(15,2) limit (>999 billion):');
		largeValues.forEach((inv: any, idx: number) => {
			console.log(`  ${idx + 1}. ${inv.invoice_number}: Rp ${Number(inv.parsed_value).toLocaleString('id-ID')}`);
		});
		console.log('\n❌ THIS IS THE PROBLEM! These values are being TRUNCATED!\n');
	} else {
		console.log('✅ No invoices exceed DECIMAL(15,2) limit\n');
	}

	// Calculate the difference (data loss)
	const diff = Number(withoutLimit[0].sum_without_limit) - Number(withLimit[0].sum_with_limit);
	if (diff > 0) {
		console.log('💔 DATA LOSS DETECTED:');
		console.log(`  Lost amount: Rp ${diff.toLocaleString('id-ID')}`);
		console.log(`  Original: Rp ${Number(withoutLimit[0].sum_without_limit).toLocaleString('id-ID')}`);
		console.log(`  Truncated: Rp ${Number(withLimit[0].sum_with_limit).toLocaleString('id-ID')}`);
		console.log(`  Loss percentage: ${((diff / Number(withoutLimit[0].sum_without_limit)) * 100).toFixed(2)}%\n`);
	}

	console.log('💡 SOLUTION: Upgrade DECIMAL(15,2) to DECIMAL(20,2) in migrations');

	process.exit(0);
}

checkDecimalOverflow();
