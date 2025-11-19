import * as fs from 'fs';
import * as path from 'path';

interface LegacyInvoice {
	id: string;
	invoiceNumber: string;
	supplierName: string;
	date: string;
	total: string;
	paid: boolean;
	receiptNumber?: string;
}

interface LegacyDB {
	invoices: LegacyInvoice[];
}

async function checkLegacyTotal() {
	console.log('=== Analyzing Legacy db.json ===\n');

	// Read legacy db.json
	const legacyPath = path.join(__dirname, '../../legacy/backend/db.json');

	if (!fs.existsSync(legacyPath)) {
		console.error('❌ Legacy db.json not found at:', legacyPath);
		process.exit(1);
	}

	const rawData = fs.readFileSync(legacyPath, 'utf-8');
	const db: LegacyDB = JSON.parse(rawData);

	console.log('📄 Legacy Database File:');
	console.log('  Path:', legacyPath);
	console.log('  Total invoices:', db.invoices.length);

	// Calculate totals
	let totalValue = 0;
	let paidCount = 0;
	let unpaidCount = 0;
	let paidValue = 0;
	let unpaidValue = 0;
	let parseErrors = 0;
	const largestInvoices: Array<{ number: string; value: number }> = [];

	db.invoices.forEach((invoice) => {
		// Parse total (remove non-numeric characters)
		const cleaned = invoice.total.replace(/[^0-9.]/g, '');
		const value = parseFloat(cleaned);

		if (isNaN(value)) {
			parseErrors++;
			console.warn(`  ⚠️  Cannot parse: ${invoice.invoiceNumber} = ${invoice.total}`);
			return;
		}

		totalValue += value;
		largestInvoices.push({ number: invoice.invoiceNumber, value });

		if (invoice.paid) {
			paidCount++;
			paidValue += value;
		} else {
			unpaidCount++;
			unpaidValue += value;
		}
	});

	// Sort and get top 10 largest
	largestInvoices.sort((a, b) => b.value - a.value);
	const top10 = largestInvoices.slice(0, 10);

	console.log('\n💰 Legacy Database Statistics:');
	console.log('  Total Invoices:', db.invoices.length);
	console.log('  Paid:', paidCount);
	console.log('  Unpaid:', unpaidCount);
	console.log('  Parse Errors:', parseErrors);
	console.log('  Total Value: Rp', totalValue.toLocaleString('id-ID'));
	console.log('  Paid Value: Rp', paidValue.toLocaleString('id-ID'));
	console.log('  Unpaid Value: Rp', unpaidValue.toLocaleString('id-ID'));

	console.log('\n🔝 Top 10 Largest Invoices in Legacy:');
	top10.forEach((inv, idx) => {
		console.log(`  ${idx + 1}. ${inv.number}: Rp ${inv.value.toLocaleString('id-ID')}`);
	});

	// Check for duplicates in legacy
	const invoiceNumbers = new Set<string>();
	const duplicates: string[] = [];

	db.invoices.forEach((invoice) => {
		if (invoiceNumbers.has(invoice.invoiceNumber)) {
			duplicates.push(invoice.invoiceNumber);
		} else {
			invoiceNumbers.add(invoice.invoiceNumber);
		}
	});

	if (duplicates.length > 0) {
		console.log('\n⚠️  Duplicates in Legacy Database:');
		console.log('  Count:', duplicates.length);
		console.log('  Sample:', duplicates.slice(0, 5).join(', '));
	} else {
		console.log('\n✅ No duplicates in legacy database');
	}

	console.log('\n📊 Comparison:');
	console.log('  Legacy db.json: Rp', totalValue.toLocaleString('id-ID'));
	console.log('  Local PostgreSQL: Rp 560,581,143,798');
	console.log('  Production PostgreSQL: Rp 404,250,241,096');
	console.log('\n  Legacy vs Local diff: Rp', (totalValue - 560581143798).toLocaleString('id-ID'));
	console.log('  Legacy vs Production diff: Rp', (totalValue - 404250241096).toLocaleString('id-ID'));

	if (Math.abs(totalValue - 560581143798) < 1000) {
		console.log('\n✅ Local matches legacy data!');
	} else if (Math.abs(totalValue - 404250241096) < 1000) {
		console.log('\n✅ Production matches legacy data!');
	} else {
		console.log('\n❌ Neither local nor production matches legacy!');
	}

	process.exit(0);
}

checkLegacyTotal();
