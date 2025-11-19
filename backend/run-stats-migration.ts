import { db } from './src/db/client';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
	try {
		console.log('Running stats migration...');

		// Read the migration file
		const migrationPath = path.join(__dirname, 'src/db/migrations/0003_add_stats_table.sql');
		const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

		// Execute the migration
		await db.execute(sql.raw(migrationSQL));

		console.log('✓ Stats table created successfully!');
		console.log('✓ Triggers installed successfully!');
		console.log('✓ Initial data populated!');

		process.exit(0);
	} catch (error) {
		console.error('Migration error:', error);
		process.exit(1);
	}
}

runMigration();
