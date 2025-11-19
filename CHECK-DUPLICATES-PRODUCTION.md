# Commands untuk Cek Duplikat di Production

## 1. Quick Check - Via SQL

```bash
# Connect ke server
ssh root@your-server-ip
cd /var/www/thoyba-invoice-web

# Cek jumlah duplikat
sudo docker compose exec postgres psql -U postgres invoice_db -c "
SELECT 
    COUNT(*) as total_invoices,
    COUNT(DISTINCT invoice_number) as unique_invoices,
    COUNT(*) - COUNT(DISTINCT invoice_number) as duplicate_count
FROM invoices;
"
```

**Output contoh:**
```
 total_invoices | unique_invoices | duplicate_count 
----------------+-----------------+-----------------
           5070 |            4998 |              72
```

## 2. Detailed Check - Via Script

```bash
# Run duplicate check script
sudo docker compose exec backend bun run scripts/check-production-duplicates.ts
```

**Output contoh:**
```
=== Checking Production Duplicates ===

⚠️  Found 20 duplicate invoice numbers:

1. INVBJM240103896
   Count: 3
   IDs: [1234, 2345, 3456]
   Totals: ["1.000.000,00", "1.000.000,00", "1.000.000,00"]
   Sum: Rp 3.000.000

2. INVBJM240601418
   Count: 2
   IDs: [4567, 5678]
   ...

📊 Summary:
  Total invoice rows: 5070
  Unique invoice numbers: 4998
  Difference (duplicates): 72
  Total value: Rp 562.048.970.028

💡 SOLUTION: Run duplicate cleanup script to remove extras
```

## 3. List All Duplicates

```bash
# Get list of all duplicate invoice numbers
sudo docker compose exec postgres psql -U postgres invoice_db -c "
SELECT 
    invoice_number,
    COUNT(*) as count
FROM invoices
GROUP BY invoice_number
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;
"
```

## 4. Check Specific Invoice

```bash
# Cek detail invoice tertentu (ganti INVOICE_NUMBER)
sudo docker compose exec postgres psql -U postgres invoice_db -c "
SELECT 
    id,
    invoice_number,
    supplier,
    date,
    total,
    paid,
    timestamp
FROM invoices
WHERE invoice_number = 'INVBJM240103896'
ORDER BY timestamp;
"
```

## 5. Analyze Duplicate Impact

```bash
# Hitung total value yang ter-duplikat
sudo docker compose exec postgres psql -U postgres invoice_db -c "
SELECT 
    COUNT(*) - COUNT(DISTINCT invoice_number) as duplicate_rows,
    SUM(parse_indonesian_currency(total)) - 
    SUM(DISTINCT_VALUE) as duplicate_value
FROM (
    SELECT DISTINCT ON (invoice_number)
        invoice_number,
        parse_indonesian_currency(total) as DISTINCT_VALUE
    FROM invoices
) unique_invoices,
invoices;
"
```

## 6. Quick Summary Command

```bash
# One-liner untuk cek duplikat
sudo docker compose exec postgres psql -U postgres invoice_db -c "
WITH duplicate_stats AS (
    SELECT 
        invoice_number,
        COUNT(*) as dup_count,
        array_agg(id) as ids
    FROM invoices
    GROUP BY invoice_number
    HAVING COUNT(*) > 1
)
SELECT 
    COUNT(*) as total_duplicate_groups,
    SUM(dup_count - 1) as total_extra_rows
FROM duplicate_stats;
"
```

**Output:**
```
 total_duplicate_groups | total_extra_rows 
------------------------+------------------
                     72 |               72
```

## 7. Export Duplicates to File

```bash
# Export ke CSV untuk analisa
sudo docker compose exec postgres psql -U postgres invoice_db -c "
COPY (
    SELECT 
        invoice_number,
        COUNT(*) as duplicate_count,
        array_agg(id) as all_ids,
        array_agg(total) as all_totals
    FROM invoices
    GROUP BY invoice_number
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
) TO '/tmp/duplicates.csv' WITH CSV HEADER;
"

# Copy file keluar dari container
sudo docker compose cp postgres:/tmp/duplicates.csv ./duplicates.csv

# Download ke local
scp root@your-server-ip:/var/www/thoyba-invoice-web/duplicates.csv .
```

---

## Cleanup Duplicates (Jika Diperlukan)

**⚠️ HATI-HATI: Backup database dulu sebelum cleanup!**

```bash
# Backup database
sudo docker compose exec postgres pg_dump -U postgres invoice_db > backup_before_cleanup.sql

# Run cleanup (keep oldest by timestamp)
sudo docker compose exec postgres psql -U postgres invoice_db -c "
DELETE FROM invoices
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY invoice_number 
                ORDER BY timestamp ASC
            ) as rn
        FROM invoices
    ) ranked
    WHERE rn > 1
);
"

# Force update stats after cleanup
sudo docker compose exec backend bun run scripts/force-update-stats.ts
```

---

## Verify After Cleanup

```bash
# Check no more duplicates
sudo docker compose exec postgres psql -U postgres invoice_db -c "
SELECT 
    COUNT(*) as total_invoices,
    COUNT(DISTINCT invoice_number) as unique_invoices
FROM invoices;
"

# Should show: total_invoices = unique_invoices
```

---

**Gunakan command #1 atau #2 untuk quick check di production!** 🔍
