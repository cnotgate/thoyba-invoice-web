const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'db.json');

try {
	// Read database
	const dbText = fs.readFileSync(dbPath, 'utf8');
	const db = JSON.parse(dbText);

	console.log('Total invoices before cleanup:', db.invoices.length);

	// Filter out empty invoices (missing supplier, invoice number, or total)
	const originalCount = db.invoices.length;
	const cleanedInvoices = db.invoices.filter((invoice) => {
		return (
			invoice.supplier &&
			invoice.invoiceNumber &&
			invoice.total &&
			invoice.supplier.trim() !== '' &&
			invoice.invoiceNumber.trim() !== '' &&
			invoice.total.trim() !== ''
		);
	});

	const removedCount = originalCount - cleanedInvoices.length;
	db.invoices = cleanedInvoices;

	// Write back to database
	fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

	console.log('Empty invoices removed:', removedCount);
	console.log('Total invoices after cleanup:', cleanedInvoices.length);
} catch (error) {
	console.error('Error cleaning database:', error);
}
