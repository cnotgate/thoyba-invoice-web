/**
 * Simplified Migration: Convert total to DECIMAL format
 * This script handles everything in the right order
 */

import { db } from './src/db/client';
import { invoices } from './src/db/schema';
import { sql } from 'drizzle-orm';

function parseToDecimal(value: string): string {
	const trimmed = value.trim();

	// Format: "Rp 56.489.562,78" (Indonesian with Rp prefix)
	if (trimmed.startsWith('Rp')) {
		const cleaned = trimmed
			.replace('Rp', '')
			.replace(/\s/g, '')
			.replace(/\./g, '') // Remove thousand separators
			.replace(',', '.'); // Convert decimal comma to dot
		return parseFloat(cleaned).toFixed(2);
	}

	// Format: "56.489.562,78" (Indonesian without Rp)
	if (trimmed.includes(',')) {
		const cleaned = trimmed
			.replace(/\./g, '') // Remove thousand separators
			.replace(',', '.'); // Convert decimal comma to dot
		return parseFloat(cleaned).toFixed(2);
	}

	// Format: "56.489.562.78" (multiple dots with 2-digit decimal ending)
	const multiDotPattern = /^\d+(\.\d{3})+\.\d{2}$/;
	if (multiDotPattern.test(trimmed)) {
		const parts = trimmed.split('.');
		const decimalPart = parts.pop()!; // Last part is decimal
		const integerPart = parts.join('');
		return parseFloat(`${integerPart}.${decimalPart}`).toFixed(2);
	}

	// Format: "649.44" (American decimal with single dot)
	const singleDotPattern = /^\d+\.\d{2}$/;
	if (singleDotPattern.test(trimmed)) {
		return parseFloat(trimmed).toFixed(2);
	}

	// Format: "388800" (plain integer)
	if (/^\d+$/.test(trimmed)) {
		return parseFloat(trimmed).toFixed(2);
	}

	// Default: try to parse as-is
	return parseFloat(trimmed).toFixed(2);
}

async function simplifiedMigration() {
	console.log('🔄 Starting simplified migration...\n');

	try {
		// Step 1: Drop all triggers AND function
		console.log('📌 Step 1: Dropping triggers and functions...');
		await db.execute(sql`
            DROP TRIGGER IF EXISTS invoice_insert_trigger ON invoices;
            DROP TRIGGER IF EXISTS invoice_update_trigger ON invoices;
            DROP TRIGGER IF EXISTS invoice_delete_trigger ON invoices;
            DROP TRIGGER IF EXISTS trigger_stats_insert ON invoices;
            DROP TRIGGER IF EXISTS trigger_stats_update ON invoices;
            DROP TRIGGER IF EXISTS trigger_stats_delete ON invoices;
            DROP FUNCTION IF EXISTS update_stats() CASCADE;
            DROP FUNCTION IF EXISTS parse_indonesian_currency(TEXT);
        `);
		console.log('   ✅ Triggers and functions dropped\n'); // Step 2: Fetch all invoices
		console.log('📊 Step 2: Fetching all invoices...');
		const allInvoices = await db.select().from(invoices);
		console.log(`   Found ${allInvoices.length} invoices\n`);

		// Step 3: Calculate total BEFORE
		console.log('💰 Step 3: Calculating total BEFORE migration...');
		let totalBefore = 0;
		for (const inv of allInvoices) {
			totalBefore += parseFloat(parseToDecimal(inv.total));
		}
		console.log(`   Total: ${(totalBefore / 1_000_000_000).toFixed(2)} Miliar\n`);

		// Step 4: Add temp column
		console.log('🔧 Step 4: Adding temporary column...');
		await db.execute(sql`
            ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total_temp DECIMAL(15,2);
        `);
		console.log('   ✅ Temp column added\n');

		// Step 5: Convert data using TypeScript (no triggers involved)
		console.log('🔄 Step 5: Converting data...');
		let converted = 0;
		for (const inv of allInvoices) {
			const decimalValue = parseToDecimal(inv.total);
			await db.execute(sql`
                UPDATE invoices 
                SET total_temp = ${decimalValue}::decimal(15,2)
                WHERE id = ${inv.id}
            `);
			converted++;
			if (converted % 500 === 0) {
				console.log(`   Progress: ${converted}/${allInvoices.length}`);
			}
		}
		console.log(`   ✅ Converted ${converted} invoices\n`);

		// Step 6: Drop old column and rename
		console.log('🔧 Step 6: Swapping columns...');
		await db.execute(sql`
            ALTER TABLE invoices DROP COLUMN total;
            ALTER TABLE invoices RENAME COLUMN total_temp TO total;
            ALTER TABLE invoices ALTER COLUMN total SET NOT NULL;
            ALTER TABLE invoices DROP CONSTRAINT IF EXISTS total_positive;
            ALTER TABLE invoices ADD CONSTRAINT total_positive CHECK (total >= 0);
        `);
		console.log('   ✅ Columns swapped\n');

		// Step 7: Update trigger function
		console.log('🔧 Step 7: Updating trigger function...');
		await db.execute(sql`
            CREATE OR REPLACE FUNCTION update_stats()
            RETURNS TRIGGER AS $$
            BEGIN
                UPDATE stats SET
                    total_invoices = (SELECT COUNT(*)::INTEGER FROM invoices),
                    paid_invoices = (SELECT COUNT(*)::INTEGER FROM invoices WHERE paid = true),
                    unpaid_invoices = (SELECT COUNT(*)::INTEGER FROM invoices WHERE paid = false),
                    total_value = (SELECT COALESCE(SUM(total), 0) FROM invoices),
                    last_updated = CURRENT_TIMESTAMP
                WHERE id = 1;
                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;
        `);
		console.log('   ✅ Function updated\n');

		// Step 8: Recreate triggers
		console.log('🔧 Step 8: Recreating triggers...');
		await db.execute(sql`
            CREATE TRIGGER invoice_insert_trigger
            AFTER INSERT ON invoices
            FOR EACH STATEMENT
            EXECUTE FUNCTION update_stats();

            CREATE TRIGGER invoice_update_trigger
            AFTER UPDATE ON invoices
            FOR EACH STATEMENT
            EXECUTE FUNCTION update_stats();

            CREATE TRIGGER invoice_delete_trigger
            AFTER DELETE ON invoices
            FOR EACH STATEMENT
            EXECUTE FUNCTION update_stats();
        `);
		console.log('   ✅ Triggers recreated\n');

		// Step 9: Drop old function
		console.log('🧹 Step 9: Cleaning up old function...');
		await db.execute(sql`
            DROP FUNCTION IF EXISTS parse_indonesian_currency(TEXT);
        `);
		console.log('   ✅ Old function dropped\n');

		// Step 10: Recalculate stats
		console.log('📊 Step 10: Recalculating stats...');
		await db.execute(sql`
            UPDATE stats SET
                total_invoices = (SELECT COUNT(*)::INTEGER FROM invoices),
                paid_invoices = (SELECT COUNT(*)::INTEGER FROM invoices WHERE paid = true),
                unpaid_invoices = (SELECT COUNT(*)::INTEGER FROM invoices WHERE paid = false),
                total_value = (SELECT COALESCE(SUM(total), 0) FROM invoices),
                last_updated = CURRENT_TIMESTAMP
            WHERE id = 1;
        `);
		console.log('   ✅ Stats recalculated\n');

		// Step 11: Verify
		console.log('✅ Step 11: Verifying migration...');
		const [result]: any = await db.execute(sql`
            SELECT 
                COUNT(*) as total_invoices,
                SUM(total) as total_value,
                MIN(total) as min_value,
                MAX(total) as max_value
            FROM invoices
        `);

		const stats = result;
		const totalAfter = parseFloat(stats.total_value || '0');

		console.log('─'.repeat(80));
		console.log(`   Total Invoices: ${stats.total_invoices}`);
		console.log(`   Total Value:    ${(totalAfter / 1_000_000_000).toFixed(2)} Miliar`);
		console.log(
			`   Min Value:      Rp ${parseFloat(stats.min_value).toLocaleString('id-ID', { minimumFractionDigits: 2 })}`
		);
		console.log(
			`   Max Value:      Rp ${parseFloat(stats.max_value).toLocaleString('id-ID', { minimumFractionDigits: 2 })}`
		);
		console.log('─'.repeat(80));
		console.log();

		const difference = totalAfter - totalBefore;
		const percentDiff = (Math.abs(difference) / totalBefore) * 100;

		console.log('📊 Migration Comparison:');
		console.log('─'.repeat(80));
		console.log(`   Before: ${(totalBefore / 1_000_000_000).toFixed(2)} Miliar`);
		console.log(`   After:  ${(totalAfter / 1_000_000_000).toFixed(2)} Miliar`);
		console.log(`   Diff:   ${(difference / 1_000_000_000).toFixed(2)} Miliar (${percentDiff.toFixed(4)}%)`);
		console.log('─'.repeat(80));
		console.log();

		if (percentDiff < 0.01) {
			console.log('✅ ✅ ✅ MIGRATION SUCCESSFUL! ✅ ✅ ✅');
			console.log('   Data integrity maintained (< 0.01% difference)');
			console.log('   All totals now stored as DECIMAL(15,2)');
		} else {
			console.log('⚠️  WARNING: Significant difference detected!');
			console.log('   Please review the migration results.');
		}
	} catch (error) {
		console.error('❌ Migration failed:', error);
		throw error;
	}
}

simplifiedMigration()
	.then(() => {
		console.log('\n✨ Migration completed successfully!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('\n❌ Migration failed:', error);
		process.exit(1);
	});
