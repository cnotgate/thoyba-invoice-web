# Importing Legacy Data to Production

This guide explains how to import legacy invoice data to your production server.

## Background

The `legacy/` folder is excluded from version control (`.gitignore`) because it contains old implementation files. However, you may want to import historical invoice data from the legacy database.

## Option 1: Import During Initial Setup (Recommended)

### Step 1: Copy Legacy Database to Server

```bash
# From your local machine, copy legacy db.json to server
scp legacy/backend/db.json user@your-server:/tmp/legacy-db.json

# Or use any file transfer method (SFTP, rsync, etc.)
```

### Step 2: Copy into Container

```bash
# SSH into your server
ssh user@your-server

# Copy file into backend container
cd /path/to/invoice-web
docker compose cp /tmp/legacy-db.json backend:/app/legacy-db.json
```

### Step 3: Run Import Script

Create a temporary import script in the container:

```bash
docker compose exec backend sh -c 'cat > /app/import-temp.ts << "EOF"
import { db, client } from "./src/db/client";
import { invoices } from "./src/db/schema";
import { readFileSync } from "fs";

async function importLegacy() {
    try {
        const data = JSON.parse(readFileSync("/app/legacy-db.json", "utf-8"));
        let count = 0;

        for (const inv of data.invoices || []) {
            try {
                await db.insert(invoices).values({
                    supplier: inv.supplier || "Unknown",
                    branch: inv.branch || "Kuripan",
                    date: inv.date || new Date().toISOString().split("T")[0],
                    invoiceNumber: inv.invoiceNumber || `LEGACY-${Date.now()}`,
                    total: inv.total || "0",
                    description: inv.description || null,
                    paid: inv.paid || false,
                    paidDate: inv.paidDate || null,
                    timestamp: inv.timestamp ? new Date(inv.timestamp) : new Date(),
                });
                count++;
                if (count % 100 === 0) console.log(`Imported ${count}...`);
            } catch (err) {
                console.error(`Skip invoice ${inv.invoiceNumber}`);
            }
        }

        console.log(`✅ Imported ${count} invoices`);
        await client.end();
    } catch (error) {
        console.error("Import failed:", error);
        process.exit(1);
    }
}

importLegacy();
EOF'

# Run the import
docker compose exec backend bun run /app/import-temp.ts

# Clean up
docker compose exec backend rm /app/import-temp.ts /app/legacy-db.json
```

## Option 2: Use Existing Import Script (Development Only)

If you're running locally with the legacy folder:

```bash
cd backend
bun run db:seed  # This will automatically import legacy data if available
```

## Option 3: Manual Import via Admin Panel

1. Export legacy data to CSV format
2. Login to admin panel
3. Use the import feature to upload CSV data

## Option 4: Direct Database Import

If you have a PostgreSQL dump:

```bash
# Export from legacy system
docker compose exec postgres pg_dump -U postgres legacy_db > legacy_backup.sql

# Import to new system
docker compose exec -T postgres psql -U postgres invoice_db < legacy_backup.sql
```

## Verifying Import

After import, verify the data:

```bash
# Check invoice count
docker compose exec postgres psql -U postgres invoice_db -c "SELECT COUNT(*) FROM invoices;"

# Check sample data
docker compose exec postgres psql -U postgres invoice_db -c "SELECT * FROM invoices LIMIT 5;"
```

## Notes

- Legacy folder is excluded from Git for cleaner repository
- Import is optional - the system works fine without historical data
- Historical data can be imported anytime after deployment
- The `seed.ts` script gracefully handles missing legacy data
- In production, seed script will skip legacy import with a helpful message

## Troubleshooting

### "Legacy database not found"

This is normal in production. The legacy folder is not deployed. Use Option 1 to manually copy and import data.

### "Permission denied"

Make sure the copied file has correct permissions:

```bash
chmod 644 /tmp/legacy-db.json
```

### Import Takes Too Long

For large datasets (5000+ invoices), the import may take 5-10 minutes. This is normal. The script shows progress every 100 records.
