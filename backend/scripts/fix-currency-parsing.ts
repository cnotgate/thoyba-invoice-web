import { db } from '../src/db/client';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

async function fixCurrencyParsing() {
	try {
		console.log('=== Fixing Indonesian Currency Parsing ===\n');

		// Show current (wrong) stats
		console.log('📊 Current Stats (with wrong parsing):');
		const currentStats = await db.execute(sql`SELECT * FROM stats WHERE id = 1`) as any;
		if (currentStats.length > 0) {
			console.log('  Total Value:', Number(currentStats[0].total_value).toLocaleString('id-ID'));
		}

		// Read and execute the migration
		const migrationPath = path.join(__dirname, '../src/db/migrations/0004_fix_indonesian_currency_parsing.sql');
		const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

		console.log('\n🔧 Running migration...');
		await db.execute(sql.raw(migrationSQL));

		// Show fixed stats
		console.log('\n✅ Migration completed!\n');
		console.log('📊 Fixed Stats (with correct parsing):');
		const fixedStats = await db.execute(sql`SELECT * FROM stats WHERE id = 1`) as any;
		
		if (fixedStats.length > 0) {
			const stats = fixedStats[0];
			console.log('  Total Invoices:', stats.total_invoices);
			console.log('  Paid Invoices:', stats.paid_invoices);
			console.log('  Unpaid Invoices:', stats.unpaid_invoices);
			console.log('  Total Value: Rp', Number(stats.total_value).toLocaleString('id-ID'));
			console.log('  Last Updated:', stats.last_updated);
		}

		// Test the parsing function
		console.log('\n🧪 Testing parse_indonesian_currency function:');
		const tests = [
			'4.000.000,00',
			'1.234.567.890,50',
			'500.000,00',
			'99,99'
		];

		for (const test of tests) {
			const result = await db.execute(sql.raw(`SELECT parse_indonesian_currency('${test}') as parsed`)) as any;
			console.log(`  "${test}" → ${Number(result[0].parsed).toLocaleString('id-ID')}`);
		}

		console.log('\n✅ Currency parsing fixed successfully!');
		console.log('✅ Stats table updated with correct values!');
		console.log('✅ Triggers updated to use correct parsing!');

		process.exit(0);
	} catch (error) {
		console.error('❌ Migration error:', error);
		process.exit(1);
	}
}

fixCurrencyParsing();
