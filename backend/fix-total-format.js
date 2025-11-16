const fs = require('fs');
const path = require('path');

// Path to database
const dbPath = path.join(__dirname, 'db.json');

// Function to format number to Indonesian format
function formatToIndonesianCurrency(number) {
	// Convert to string and remove existing formatting
	let numStr = number.toString().replace(/\./g, '').replace(',', '.');

	// Parse to number
	const num = parseFloat(numStr);

	if (isNaN(num)) {
		return '0,00';
	}

	// Format with Indonesian locale (but we need to adjust for our specific format)
	// First format as currency then extract just the number part
	const formatted = new Intl.NumberFormat('id-ID', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(num);

	return formatted;
}

// Function to check if total format is valid
function isValidTotalFormat(total) {
	// Should be in format like "1.234.567,89" or "123,45"
	const indonesianFormat = /^(\d{1,3}(\.\d{3})*|\d+),\d{2}$/;
	return indonesianFormat.test(total);
}

// Function to fix total format in database
async function fixTotalFormat() {
	try {
		console.log('Reading database...');

		// Read current database
		const dbText = fs.readFileSync(dbPath, 'utf8');
		const db = JSON.parse(dbText);

		if (!db.invoices || !Array.isArray(db.invoices)) {
			console.log('No invoices found in database');
			return;
		}

		console.log(`Found ${db.invoices.length} invoices`);
		let fixedCount = 0;

		// Process each invoice
		db.invoices.forEach((invoice, index) => {
			if (invoice.total && !isValidTotalFormat(invoice.total)) {
				// Try to parse the current total and reformat it
				const currentTotal = invoice.total;
				let numericValue;

				try {
					// Parse current format
					numericValue = parseFloat(currentTotal.replace(/\./g, '').replace(',', '.'));
				} catch (error) {
					console.log(`Error parsing total for invoice ${invoice.id}: ${currentTotal}`);
					return;
				}

				if (!isNaN(numericValue)) {
					const newTotal = formatToIndonesianCurrency(numericValue);
					console.log(`Fixing invoice ${invoice.id}: "${currentTotal}" -> "${newTotal}"`);
					invoice.total = newTotal;
					fixedCount++;
				}
			}
		});

		// Write back to database
		fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
		console.log(`\nFixed ${fixedCount} invoice totals`);
		console.log('Database updated successfully');

		// Show some examples
		console.log('\nExamples of fixed totals:');
		const examples = db.invoices.filter((inv) => inv.total).slice(0, 5);
		examples.forEach((inv) => {
			console.log(`${inv.supplier} - ${inv.total}`);
		});
	} catch (error) {
		console.error('Error fixing total format:', error);
	}
}

// Run the fix
fixTotalFormat();
