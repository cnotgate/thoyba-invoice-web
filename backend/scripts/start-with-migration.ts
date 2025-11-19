#!/usr/bin/env bun
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, client } from '../src/db/client';
import { users } from '../src/db/schema';
import { hashPassword } from '../src/utils/password';
import { eq } from 'drizzle-orm';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Generate a secure random password
function generatePassword(length: number = 16): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
	let password = '';
	const crypto = require('crypto');
	const array = new Uint8Array(length);
	crypto.getRandomValues(array);

	for (let i = 0; i < length; i++) {
		password += chars[array[i] % chars.length];
	}
	return password;
}

// Wait for database to be ready
async function waitForDatabase(maxRetries = 30, delay = 1000): Promise<void> {
	console.log('⏳ Waiting for database to be ready...');

	for (let i = 0; i < maxRetries; i++) {
		try {
			await client`SELECT 1`;
			console.log('✅ Database is ready!');
			return;
		} catch (error) {
			console.log(`   Attempt ${i + 1}/${maxRetries} - Database not ready yet...`);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw new Error('Database connection timeout after ' + maxRetries + ' attempts');
}

async function startApp() {
	// Wait for database to be ready first
	await waitForDatabase();

	console.log('🔄 Running database migrations...');

	try {
		// Run migrations
		await migrate(db, { migrationsFolder: './drizzle/migrations' });
		console.log('✅ Migrations completed successfully!');

		// Check if admin user exists, if not create one
		console.log('🔍 Checking for admin user...');
		const existingAdmin = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);

		if (existingAdmin.length === 0) {
			console.log('👤 Creating default admin user...');

			// Generate secure random password
			const plainPassword = generatePassword(16);
			const hashedPassword = await hashPassword(plainPassword);

			// Create admin user
			await db.insert(users).values({
				username: 'admin',
				password: hashedPassword,
				role: 'admin',
			});

			// Save credentials to file
			const credentialsPath = join(process.cwd(), 'ADMIN_CREDENTIALS.txt');
			const credentialsContent = `
===========================================
ADMIN CREDENTIALS - GENERATED ON STARTUP
===========================================

Username: admin
Password: ${plainPassword}

⚠️  IMPORTANT SECURITY NOTES:
1. This password was auto-generated on first startup
2. Save this password in a secure location
3. Change this password after first login
4. Delete this file after saving the password
5. Never commit this file to version control

Generated: ${new Date().toISOString()}
===========================================
`;

			writeFileSync(credentialsPath, credentialsContent);

			console.log('✅ Admin user created!');
			console.log('📄 Credentials saved to: ADMIN_CREDENTIALS.txt');
			console.log('⚠️  IMPORTANT: Save the password from ADMIN_CREDENTIALS.txt and delete the file!');
		} else {
			console.log('✅ Admin user already exists');
		}

		// DON'T close the client - the app needs to keep using it!
		// The connection pool will be managed by the postgres client

		// Start the application
		console.log('🚀 Starting application...');

		// Import and start Bun server
		const { default: server } = await import('../src/index');
		const port = server.port || 3001;

		// Start Bun HTTP server
		Bun.serve({
			port: port,
			fetch: server.fetch,
		});

		console.log(`✅ Server running on port ${port}`);
	} catch (error) {
		console.error('❌ Startup failed:', error);
		process.exit(1);
	}
}

startApp();
