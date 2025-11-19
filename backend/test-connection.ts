import postgres from 'postgres';

// Test connection
const connectionString = `postgresql://postgres:postgres@localhost:5432/invoice_db`;

console.log('Testing connection to:', connectionString);

const client = postgres(connectionString);

try {
	const result = await client`SELECT version()`;
	console.log('✅ Connection successful!');
	console.log('PostgreSQL version:', result[0].version);
	await client.end();
} catch (error) {
	console.error('❌ Connection failed:', error.message);
	process.exit(1);
}
