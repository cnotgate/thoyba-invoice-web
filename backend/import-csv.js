const fs = require('fs');
const path = require('path');

// Path to CSV file and database
const csvPath = 'C:\\Users\\afati\\Downloads\\Invoice Dubay (Responses) - Invoice DUBAY (1).csv';
const dbPath = path.join(__dirname, 'db.json');

// Function to parse CSV with proper quote and multiline handling
function parseCSV(csvText) {
	const lines = csvText.split('\n');
	const headers = parseCSVLine(lines[0]);

	const rows = [];
	let currentRecord = '';
	let inQuotes = false;

	for (let i = 1; i < lines.length; i++) {
		const line = lines[i];
		currentRecord += line;

		// Count quotes to see if we're still inside a quoted field
		const quoteCount = (currentRecord.match(/"/g) || []).length;
		inQuotes = quoteCount % 2 !== 0;

		// If we're not in quotes, this should be the end of a record
		if (!inQuotes && currentRecord.trim()) {
			const values = parseCSVLine(currentRecord);
			if (values.length >= headers.length) {
				const row = {};
				headers.forEach((header, index) => {
					row[header] = values[index] || '';
				});
				rows.push(row);
			}
			currentRecord = '';
		} else if (inQuotes) {
			// Add newline back if we're in quotes (multiline field)
			currentRecord += '\n';
		}
	}

	return { headers, rows };
}

// Function to parse a single CSV line handling quotes
function parseCSVLine(line) {
	const result = [];
	let current = '';
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];

		if (char === '"') {
			if (inQuotes && line[i + 1] === '"') {
				// Escaped quote
				current += '"';
				i++; // Skip next quote
			} else {
				// Toggle quote state
				inQuotes = !inQuotes;
			}
		} else if (char === ',' && !inQuotes) {
			// Field separator
			result.push(current.trim().replace(/^"|"$/g, ''));
			current = '';
		} else {
			current += char;
		}
	}

	// Add the last field
	result.push(current.trim().replace(/^"|"$/g, ''));

	return result;
}

// Function to convert CSV data to invoice format
function convertToInvoice(csvRow, index) {
	// Map CSV columns to invoice fields based on actual headers
	const invoice = {
		supplier: csvRow['Nama Supplier'] || '',
		branch: csvRow['Cabang'] || '',
		date: csvRow['Tanggal Nota'] || '',
		invoiceNumber: csvRow['No. Faktur'] || '',
		total: csvRow['Total'] || '0',
		description: csvRow['Keterangan'] || '',
		timestamp: csvRow['Timestamp'] || new Date().toISOString(),
		id: (Date.now() + index).toString(),
		paid: csvRow['Status'] === 'TRUE' || csvRow['Status'] === 'Lunas' || csvRow['Status'] === 'Paid' || false,
		paymentDate: csvRow['Tanggal Pembayaran'] || '',
		imported: true, // Flag to identify imported invoices
	};

	return invoice;
}

// Main import function
async function importCSV() {
	try {
		console.log('Reading CSV file...');

		// Read CSV file
		const csvText = fs.readFileSync(csvPath, 'utf8');
		console.log('CSV file read successfully');

		// Parse CSV
		const { headers, rows } = parseCSV(csvText);
		console.log(`Found ${rows.length} rows in CSV`);
		console.log('Headers:', headers);

		// Read current database
		let db = { invoices: [] };
		if (fs.existsSync(dbPath)) {
			const dbText = fs.readFileSync(dbPath, 'utf8');
			db = JSON.parse(dbText);
		}

		// Filter out previously imported CSV data (keep only manually added invoices)
		const existingManualInvoices = db.invoices.filter((invoice) => !invoice.imported);

		console.log(`Keeping ${existingManualInvoices.length} existing manual invoices`);

		// Convert CSV rows to invoices
		const newInvoices = rows.map((row, index) => convertToInvoice(row, index));

		// Add new invoices to existing manual ones
		db.invoices = [...existingManualInvoices, ...newInvoices];

		// Write back to database
		fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
		console.log(`Successfully imported ${newInvoices.length} invoices from CSV`);
		console.log(`Total invoices in database: ${db.invoices.length}`);

		// Show sample of imported data
		console.log('\nSample imported invoices:');
		newInvoices.slice(0, 5).forEach((invoice, index) => {
			console.log(
				`${index + 1}. ${invoice.supplier} - ${invoice.branch} - ${invoice.invoiceNumber} - ${invoice.total} - ${
					invoice.paid ? 'LUNAS' : 'BELUM'
				}`
			);
		});
	} catch (error) {
		console.error('Error importing CSV:', error);
	}
}

// Run the import
importCSV();
