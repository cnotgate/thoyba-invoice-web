#!/usr/bin/env bun
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, client } from '../src/db/client';
import { users } from '../src/db/schema';
import { hashPassword } from '../src/utils/password';
import { eq } from 'drizzle-orm';

async function startApp() {
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
			const adminPassword = await hashPassword('admin123');
			await db.insert(users).values({
				username: 'admin',
				password: adminPassword,
				role: 'admin',
			});
			console.log('✅ Admin user created! Username: admin, Password: admin123');
			console.log('⚠️  IMPORTANT: Change the default password after first login!');
		} else {
			console.log('✅ Admin user already exists');
		}
		
		// Close migration connection
		await client.end();
		
		// Start the application
		console.log('🚀 Starting application...');
		const app = await import('../src/index');
		console.log(`✅ Server running on port ${app.default.port || 3001}`);
		
	} catch (error) {
		console.error('❌ Startup failed:', error);
		process.exit(1);
	}
}

startApp();
