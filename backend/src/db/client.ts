import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 
	`postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'invoice_db'}`;

// Configure postgres client with proper connection pooling and retry settings
export const client = postgres(connectionString, {
	max: 10,                    // Maximum number of connections in pool
	idle_timeout: 20,           // Close idle connections after 20 seconds
	connect_timeout: 10,        // Wait 10 seconds for connection
	prepare: false,             // Disable prepared statements for better compatibility
	onnotice: () => {},         // Silence notices
});

export const db = drizzle(client, { schema });
