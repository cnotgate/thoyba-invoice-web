import { db, client } from '../src/db/client';
import { users, suppliers, invoices } from '../src/db/schema';
import { hashPassword } from '../src/utils/password';

// Real supplier names from legacy database
const supplierNames = [
	'Cv Sukses Mandiri',
	'PT. Air Mandiri Distribusindo',
	'PT. Akasia Inter Nusa',
	'PT. Antarmitra Sembada',
	'PT. Anugerah Argon Mandiri',
	'PT. Anugerah Pharmindo Lestari',
	'PT. Bahtera Laju Nusantara',
	'PT. Bangun Citra Lestari',
	'PT. Berkat Sukses Sentosa',
	'PT. Cahaya Makmur Prima Sejahtera',
	'PT. Cahaya Pelita Borneo',
	'PT. Cahaya Putri Bintang',
	'PT. Daya Muda Agung',
	'PT. Dialogue Garmindo Utama',
	'PT. Enseval Putra Mega Trading',
	'PT. IndoMarco Adi Prima',
	'PT. Intiboga Mandiri',
	'PT. Kreasi Perdana Indonesia',
	'PT. Laris Sukses Abadi',
	'PT. Laut Indah Jaya',
	'PT. Laut Timur Ardiprima',
	'PT. Mahkota Lestari',
	'PT. Maju Anugerah Jaya Usaha',
	'PT. Maju Anugerah Jaya Utama',
	'PT. Marga Nusantara Jaya',
	'PT. Mensa Bina Sukses',
	'PT. Mitra Usaha Sukses Sejahtera',
	'PT. Mulia Anugerah Distribusindo',
	'PT. Obor Baru Maju',
	'PT. Oliver Bayi Andalan',
	'PT. Parit Padang Global',
	'PT. Penta Valent',
	'PT. Pulau Baru Jaya',
	'PT. Pundi Mas Sejahtera',
	'PT. Putera Raja Sejahtera',
	'PT. Sejahtera Sukses Sejati Banjarmasin',
	'PT. Selamat Sejahtera Sejati',
	'PT. Semangat Selamat Sejahtera',
	'PT. Sinar Alam Timur',
	'PT. Sumber Sehat Makmur',
	'PT. Surya Timur Raya',
	'PT. Tempo',
	'PT. Tigaraksa Satria',
	'PT. Wildan Cahaya Asri',
	'Winning Mulia',
];

async function seed() {
	console.log('🌱 Seeding database...');

	try {
		// Create users (skip if already exists)
		try {
			console.log('Creating admin user...');
			const adminPassword = await hashPassword('admin123');
			await db.insert(users).values({
				username: 'admin',
				password: adminPassword,
				role: 'admin',
			});

			console.log('Creating regular user...');
			const userPassword = await hashPassword('user123');
			await db.insert(users).values({
				username: 'user',
				password: userPassword,
				role: 'user',
			});
		} catch (error: any) {
			if (error.code === '23505') {
				console.log('Users already exist, skipping...');
			} else {
				throw error;
			}
		}

		// Insert suppliers (skip if already exists)
		console.log(`Inserting ${supplierNames.length} suppliers...`);
		let insertedCount = 0;
		let skippedCount = 0;
		for (const name of supplierNames) {
			try {
				await db.insert(suppliers).values({ name });
				insertedCount++;
			} catch (error: any) {
				if (error.code === '23505') {
					// Supplier already exists, skip
					skippedCount++;
				} else {
					throw error;
				}
			}
		}
		console.log(`✅ Inserted ${insertedCount} suppliers, skipped ${skippedCount} duplicates`);

		// Insert sample invoice
		console.log('Creating sample invoice...');
		await db.insert(invoices).values({
			supplier: 'PT Sumber Rejeki',
			branch: 'Kuripan',
			date: '2025-11-18',
			invoiceNumber: 'INV-2025-001',
			total: '6000000',
			description: 'Pembelian barang elektronik',
			paid: false,
		});

		console.log('✅ Seeding completed successfully!');
		console.log('\n📝 Default credentials:');
		console.log('   Admin - username: admin, password: admin123');
		console.log('   User  - username: user, password: user123');
	} catch (error) {
		console.error('❌ Seeding failed:', error);
		process.exit(1);
	} finally {
		await client.end();
	}
}

seed();
