import { db } from '../src/db/client';
import { sql } from 'drizzle-orm';

async function forceUpdateStats() {
	console.log('=== Force Updating Stats Table ===\n');

	// Manual update stats
	await db.execute(sql`
		UPDATE stats SET
			total_invoices = (SELECT COUNT(*)::INTEGER FROM invoices),
			paid_invoices = (SELECT COUNT(*)::INTEGER FROM invoices WHERE paid = true),
			unpaid_invoices = (SELECT COUNT(*)::INTEGER FROM invoices WHERE paid = false),
			total_value = (
				SELECT COALESCE(SUM(
					CAST(
						regexp_replace(total, '[^0-9.]', '', 'g') AS DECIMAL(15, 2)
					)
				), 0)
				FROM invoices
			),
			last_updated = CURRENT_TIMESTAMP
		WHERE id = 1
	`);

	console.log('✅ Stats table force updated!');

	// Show updated stats
	const updated = (await db.execute(sql`SELECT * FROM stats WHERE id = 1`)) as any;

	console.log('\n📊 Updated Stats:');
	console.log('  Total Invoices:', updated[0].total_invoices);
	console.log('  Paid Invoices:', updated[0].paid_invoices);
	console.log('  Unpaid Invoices:', updated[0].unpaid_invoices);
	console.log('  Total Value: Rp', Number(updated[0].total_value).toLocaleString('id-ID'));
	console.log('  Last Updated:', updated[0].last_updated);

	process.exit(0);
}

forceUpdateStats();
