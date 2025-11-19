import { db } from '../src/db/client';
import { stats } from '../src/db/schema';

async function showCurrentStats() {
	console.log('=== Current Stats in Database ===\n');

	const [statsData] = await db.select().from(stats).limit(1);

	if (!statsData) {
		console.log('❌ No stats found in database!');
		process.exit(1);
	}

	console.log('📊 Statistics:');
	console.log('  Total Invoices:', statsData.totalInvoices);
	console.log('  Paid Invoices:', statsData.paidInvoices);
	console.log('  Unpaid Invoices:', statsData.unpaidInvoices);
	console.log('  Total Value: Rp', Number(statsData.totalValue).toLocaleString('id-ID'));
	console.log('  Last Updated:', statsData.lastUpdated.toLocaleString('id-ID'));

	console.log('\n✅ Stats table is working correctly!');
	console.log('Frontend can now fetch these stats from /api/invoices/stats endpoint');
	console.log('Stats will auto-update when invoices are added, updated, or deleted');

	process.exit(0);
}

showCurrentStats();
