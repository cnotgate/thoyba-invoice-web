import { db, client } from '../src/db/client';
import { invoices, suppliers } from '../src/db/schema';
import * as fs from 'fs';
import * as path from 'path';
import { eq } from 'drizzle-orm';

interface LegacyInvoice {
	id: string;
	supplier: string;
	branch: 'Kuripan' | 'Cempaka' | 'Gatot';
	date: string;
	invoiceNumber: string;
	total: string;
	description?: string;
	timestamp: string;
	paid: boolean;
	paymentDate?: string;
	imported?: boolean;
}

interface LegacyDB {
	invoices: LegacyInvoice[];
}

// Convert DD/MM/YYYY to YYYY-MM-DD
function convertDateFormat(dateStr: string): string {
	if (!dateStr) return new Date().toISOString().split('T')[0];

	// Check if already in YYYY-MM-DD format
	if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
		return dateStr;
	}

	// Handle "DD Month YYYY" format (e.g., "17 Januari 2024")
	const monthMap: { [key: string]: string } = {
		Januari: '01',
		Februari: '02',
		Maret: '03',
		April: '04',
		Mei: '05',
		Juni: '06',
		Juli: '07',
		Agustus: '08',
		September: '09',
		Oktober: '10',
		November: '11',
		Desember: '12',
	};

	const parts = dateStr.split(' ');
	if (parts.length === 3) {
		const day = parts[0].padStart(2, '0');
		const month = monthMap[parts[1]] || '01';
		const year = parts[2];
		return `${year}-${month}-${day}`;
	}

	// Handle DD/MM/YYYY format
	if (dateStr.includes('/')) {
		const [day, month, year] = dateStr.split('/');
		if (day && month && year) {
			return `${year.padStart(4, '20')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
		}
	}

	// Fallback
	return new Date().toISOString().split('T')[0];
}

// Normalize total (remove dots, keep only numbers)
function normalizeTotal(total: string): string {
	return total.replace(/\./g, '').replace(/,/g, '');
}

// Convert timestamp string to ISO format
function convertTimestamp(timestampStr: string): string {
	if (!timestampStr) {
		return new Date().toISOString();
	}

	// Handle DD/MM/YYYY HH:mm:ss format
	if (timestampStr.includes('/') && timestampStr.includes(':')) {
		const [datePart, timePart] = timestampStr.split(' ');
		const [day, month, year] = datePart.split('/');
		const [hours, minutes, seconds] = timePart.split(':');

		// Create date in format: YYYY-MM-DDTHH:mm:ss.000Z
		const isoString = `${year.padStart(4, '20')}-${month.padStart(2, '0')}-${day.padStart(
			2,
			'0'
		)}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}.000Z`;
		return isoString;
	}

	// If already a valid timestamp, return as is
	if (!isNaN(Number(timestampStr))) {
		return new Date(Number(timestampStr)).toISOString();
	}

	// Fallback
	return new Date().toISOString();
}

// Ensure supplier exists, create if not
async function ensureSupplierExists(supplierName: string) {
	try {
		const existing = await db.select().from(suppliers).where(eq(suppliers.name, supplierName)).limit(1);

		if (existing.length === 0) {
			await db.insert(suppliers).values({ name: supplierName });
			console.log(`  ✅ Created new supplier: ${supplierName}`);
		}
	} catch (error: any) {
		if (error.code === '23505') {
			// Already exists, ignore
		} else {
			console.error(`  ⚠️  Error ensuring supplier ${supplierName}:`, error.message);
		}
	}
}

async function importLegacyInvoices() {
	console.log('📦 Starting legacy invoice import...\n');

	try {
		// Read legacy db.json
		const legacyDbPath = path.join(__dirname, '../../legacy/backend/db.json');

		if (!fs.existsSync(legacyDbPath)) {
			console.error('❌ Legacy db.json not found at:', legacyDbPath);
			console.log('Expected path:', legacyDbPath);
			process.exit(1);
		}

		console.log('📖 Reading legacy database...');
		const legacyData: LegacyDB = JSON.parse(fs.readFileSync(legacyDbPath, 'utf-8'));

		const totalInvoices = legacyData.invoices.length;
		console.log(`📊 Found ${totalInvoices} invoices in legacy database\n`);

		let imported = 0;
		let skipped = 0;
		let errors = 0;

		console.log('🔄 Processing invoices...\n');

		for (let i = 0; i < legacyData.invoices.length; i++) {
			const legacy = legacyData.invoices[i];

			// Progress indicator every 100 invoices
			if (i > 0 && i % 100 === 0) {
				console.log(`   Progress: ${i}/${totalInvoices} (${Math.round((i / totalInvoices) * 100)}%)`);
			}

			try {
				// Ensure supplier exists
				await ensureSupplierExists(legacy.supplier);

				// Check if invoice already exists by invoice number
				const existing = await db
					.select()
					.from(invoices)
					.where(eq(invoices.invoiceNumber, legacy.invoiceNumber))
					.limit(1);

				if (existing.length > 0) {
					skipped++;
					continue;
				}

				// Convert and insert
				const convertedDate = convertDateFormat(legacy.date);
				const convertedPaymentDate = legacy.paymentDate ? convertDateFormat(legacy.paymentDate) : undefined;
				const normalizedTotal = normalizeTotal(legacy.total);
				const convertedTimestamp = convertTimestamp(legacy.timestamp);

				await db.insert(invoices).values({
					supplier: legacy.supplier,
					branch: legacy.branch,
					date: convertedDate,
					invoiceNumber: legacy.invoiceNumber,
					total: normalizedTotal,
					description: legacy.description || '',
					timestamp: new Date(convertedTimestamp),
					paid: legacy.paid,
					paidDate: convertedPaymentDate,
				});

				imported++;
			} catch (error: any) {
				errors++;
				console.error(`  ❌ Error importing invoice ${legacy.invoiceNumber}:`, error.message);
			}
		}

		console.log('\n' + '='.repeat(60));
		console.log('📊 Import Summary:');
		console.log('='.repeat(60));
		console.log(`✅ Successfully imported: ${imported} invoices`);
		console.log(`⏭️  Skipped (duplicates):  ${skipped} invoices`);
		console.log(`❌ Errors:               ${errors} invoices`);
		console.log(`📦 Total processed:      ${totalInvoices} invoices`);
		console.log('='.repeat(60));

		if (imported > 0) {
			console.log('\n🎉 Import completed successfully!');
		} else {
			console.log('\n⚠️  No new invoices were imported (all already exist)');
		}
	} catch (error) {
		console.error('❌ Import failed:', error);
		process.exit(1);
	} finally {
		await client.end();
	}
}

importLegacyInvoices();
