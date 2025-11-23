import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { db } from '../src/db/client';
import { invoices } from '../src/db/schema';
import { sql } from 'drizzle-orm';

interface CSVRow {
	Timestamp: string;
	'Nama Supplier': string;
	Cabang: string;
	'Tanggal Nota': string;
	'No. Faktur': string;
	Total: string;
	Keterangan: string;
	'': string;
	Status: string;
	'Tanggal Pembayaran': string;
}

function parseIndonesianDate(dateStr: string): string {
	if (!dateStr) return '';

	// Handle DD/MM/YYYY format
	const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
	if (ddmmyyyyMatch) {
		const [, day, month, year] = ddmmyyyyMatch;
		return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
	}

	// Handle "DD Month YYYY" format (e.g., "17 Januari 2024")
	const monthMap: Record<string, string> = {
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

	const longMatch = dateStr.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/);
	if (longMatch) {
		const [, day, monthName, year] = longMatch;
		const month = monthMap[monthName];
		if (month) {
			return `${day.padStart(2, '0')}/${month}/${year}`;
		}
	}

	return dateStr;
}

function parseTimestamp(timestampStr: string): Date | null {
	if (!timestampStr) return null;

	// Parse DD/MM/YYYY HH:mm:ss
	const match = timestampStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/);
	if (match) {
		const [, day, month, year, hour, minute, second] = match;
		const date = new Date(
			parseInt(year),
			parseInt(month) - 1,
			parseInt(day),
			parseInt(hour),
			parseInt(minute),
			parseInt(second)
		);
		return date;
	}

	return null;
}

function parseTotal(totalStr: string): string {
	if (!totalStr) return '0';

	// Remove "Rp" and spaces first
	let cleaned = totalStr.replace(/Rp/gi, '').replace(/\s+/g, '');

	// Detect format from the CSV:
	// 1. " Rp 4.118.000,00 " - Indonesian with comma (dots=thousands, comma=decimal)
	// 2. "165.522" - Plain with dots only (dots=thousands, no decimal)
	// 3. " 56.489.562.78 " - Plain with dots (dots=thousands AND last .XX is decimal)

	if (cleaned.includes(',')) {
		// Format 1: Indonesian with comma
		// "4.118.000,00" → "4118000.00"
		cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
	} else if (/\.\d{2}$/.test(cleaned)) {
		// Format 3: Ends with .XX (2 digits) - last dot is decimal
		// "56.489.562.78" → "56489562.78"
		// Split into parts: everything before last dot, and last 2 digits
		const lastDotIndex = cleaned.lastIndexOf('.');
		const integerPart = cleaned.substring(0, lastDotIndex).replace(/\./g, '');
		const decimalPart = cleaned.substring(lastDotIndex + 1);
		cleaned = integerPart + '.' + decimalPart;
	} else {
		// Format 2: Plain with dots as thousands only
		// "165.522" → "165522"
		cleaned = cleaned.replace(/\./g, '');
	}

	// Parse as float
	const num = parseFloat(cleaned);
	if (isNaN(num)) return '0';

	return num.toFixed(2);
}

async function reimportFromCSV() {
	try {
		console.log('🔄 Starting CSV reimport with correct timestamps...\n');

		// Read CSV file
		const csvPath = path.join(__dirname, '..', '..', 'source-of-truth.csv');
		const fileContent = fs.readFileSync(csvPath, 'utf-8');

		// Parse CSV
		const records: CSVRow[] = parse(fileContent, {
			columns: true,
			skip_empty_lines: true,
			trim: true,
		});

		console.log(`📊 Found ${records.length} records in CSV\n`);

		let successCount = 0;
		let errorCount = 0;
		const errors: string[] = [];

		// Clear existing data
		console.log('🗑️  Truncating invoices table...');
		await db.execute(sql`TRUNCATE TABLE invoices RESTART IDENTITY CASCADE`);
		console.log('✅ Table truncated\n');

		// Import each record
		for (let i = 0; i < records.length; i++) {
			const record = records[i];

			try {
				let timestamp = parseTimestamp(record.Timestamp);

				// If timestamp is empty/invalid, use date as fallback at 00:00:00
				if (!timestamp) {
					const date = parseIndonesianDate(record['Tanggal Nota']);
					const dateMatch = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
					if (dateMatch) {
						const [, day, month, year] = dateMatch;
						timestamp = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0);
					} else {
						// If date also invalid, skip this record
						throw new Error(`Invalid timestamp and date: ${record.Timestamp} / ${record['Tanggal Nota']}`);
					}
				}

				const total = parseTotal(record.Total);
				const date = parseIndonesianDate(record['Tanggal Nota']);
				const paid = record.Status?.toUpperCase() === 'TRUE';
				const paidDate = record['Tanggal Pembayaran'] ? parseIndonesianDate(record['Tanggal Pembayaran']) : null;

				await db.insert(invoices).values({
					supplier: record['Nama Supplier'],
					branch: record.Cabang,
					date: date,
					invoiceNumber: record['No. Faktur'],
					total: total,
					description: record.Keterangan || '',
					timestamp: timestamp,
					paid: paid,
					paidDate: paidDate,
				});

				successCount++;

				// Progress indicator
				if ((i + 1) % 100 === 0) {
					console.log(`   Imported ${i + 1}/${records.length} records...`);
				}
			} catch (error: any) {
				errorCount++;
				const errMsg = `Row ${i + 1} (${record['No. Faktur']}): ${error.message}`;
				errors.push(errMsg);
				if (errorCount <= 10) {
					console.error(`❌ ${errMsg}`);
				}
			}
		}

		console.log('\n' + '='.repeat(60));
		console.log('✅ Import completed!');
		console.log(`   Success: ${successCount} records`);
		console.log(`   Errors: ${errorCount} records`);

		if (errors.length > 10) {
			console.log(`   (Showing first 10 errors, ${errors.length - 10} more not shown)`);
		}

		// Verify one sample record
		console.log('\n🔍 Verifying sample record (SJ-2511-120033):');
		const sample = await db.query.invoices.findFirst({
			where: (invoices, { eq }) => eq(invoices.invoiceNumber, 'SJ-2511-120033'),
		});

		if (sample) {
			console.log(`   Invoice: ${sample.invoiceNumber}`);
			console.log(`   Timestamp: ${sample.timestamp}`);
			console.log(`   Date: ${sample.date}`);
			console.log(`   Supplier: ${sample.supplier}`);
			console.log(`   Total: ${sample.total}`);
		}

		console.log('\n✨ Done! Database now has correct timestamps from CSV.\n');
	} catch (error: any) {
		console.error('❌ Fatal error:', error.message);
		process.exit(1);
	}
}

// Run import
reimportFromCSV()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error('Fatal error:', error);
		process.exit(1);
	});
