# 🔄 Sync Data dari Local ke VPS

Panduan untuk sinkronisasi data invoice dari database local ke VPS production.

---

## 🎯 Kapan Perlu Sync?

- ✅ Setelah fix migration dan mau data VPS sama dengan local
- ✅ Data di VPS corrupt atau tidak akurat
- ✅ Fresh deployment dan mau populate dengan data existing
- ✅ Setelah testing local dan mau push ke production

---

## ⚠️ Sebelum Mulai

**PENTING:**

1. ✅ Pastikan data local sudah dalam format DECIMAL yang benar
2. ✅ Backup database VPS dulu!
3. ✅ Notify users akan ada downtime 5-10 menit
4. ✅ Test di staging dulu kalau ada

---

## 🚀 Option 1: Export-Import Full Data (RECOMMENDED)

### Step 1: Export dari Local (Non-Docker)

**Windows (PowerShell):**

```powershell
# Export hanya table invoices (data-only)
pg_dump -U postgres -d invoice_db --table=invoices --data-only --column-inserts > invoices_export.sql
```

**Linux/Mac (jika local pakai Docker):**

```bash
docker exec invoice-postgres pg_dump \
  -U postgres -d invoice_db \
  --table=invoices --data-only --column-inserts \
  > invoices_export.sql
```

**Hasil:** File `invoices_export.sql` berisi semua INSERT statements

### Step 2: Verify Export

**Windows:**

```powershell
# Count records
(Get-Content invoices_export.sql | Select-String "INSERT INTO").Count

# Check file size
Get-Item invoices_export.sql | Select-Object Name, Length
```

**Linux/Mac:**

```bash
# Count records
grep -c "INSERT INTO" invoices_export.sql

# Check file size
ls -lh invoices_export.sql
```

### Step 3: Transfer ke VPS

```bash
# Via SCP
scp invoices_export.sql user@vps-ip:/path/to/invoice-web/

# Atau via SFTP/WinSCP jika dari Windows
```

### Step 4: Backup VPS Database

```bash
# SSH ke VPS
ssh user@vps-ip

cd /path/to/invoice-web

# Backup database
docker exec invoice-postgres pg_dump \
  -U postgres \
  invoice_db \
  > backup_before_sync_$(date +%Y%m%d_%H%M%S).sql
```

### Step 5: Disable Triggers & Truncate (IMPORTANT!)

```bash
# Drop ALL triggers before import to avoid errors
docker exec invoice-postgres psql -U postgres -d invoice_db -c "
DROP TRIGGER IF EXISTS trigger_stats_insert ON invoices;
DROP TRIGGER IF EXISTS trigger_stats_update ON invoices;
DROP TRIGGER IF EXISTS trigger_stats_delete ON invoices;
"

# Truncate table invoices
docker exec invoice-postgres psql \
  -U postgres \
  -d invoice_db \
  -c "TRUNCATE TABLE invoices RESTART IDENTITY CASCADE;"
```

**⚠️ PENTING:** Triggers HARUS di-drop dulu! Kalau tidak, trigger akan fired saat import dan error karena stats belum ada.

### Step 6: Import Data

```bash
# Import data (aman karena triggers sudah di-drop)
docker exec -i invoice-postgres psql \
  -U postgres \
  -d invoice_db \
  < invoices_export.sql
```

### Step 7: Create Stats Table & Recreate Triggers

```bash
# Pull latest migrations
cd /path/to/invoice-web
git pull origin master

# Create stats table dan recreate triggers
docker exec -i invoice-postgres psql -U postgres -d invoice_db \
  < backend/drizzle/migrations/0002_create_stats_table.sql
```

**Note:** Jika muncul error `duplicate key`, itu normal (stats row sudah ada). Yang penting table dan triggers created.

### Step 8: Verify

```bash
# Check count dan total
docker exec invoice-postgres psql \
  -U postgres \
  -d invoice_db \
  -c "SELECT COUNT(*), SUM(total) FROM invoices;"

# Check stats table populated (should match invoice count/total)
docker exec invoice-postgres psql \
  -U postgres \
  -d invoice_db \
  -c "SELECT * FROM stats;"

# Check sample records
docker exec invoice-postgres psql \
  -U postgres \
  -d invoice_db \
  -c "SELECT * FROM invoices ORDER BY id DESC LIMIT 5;"

# Check triggers recreated
docker exec invoice-postgres psql \
  -U postgres \
  -d invoice_db \
  -c "\dS+ invoices" | grep -i trigger
```

---

## 🤖 Option 2: Automated Script (EASIEST)

### Windows (Native PostgreSQL):

**PowerShell (RECOMMENDED):**

```powershell
# Edit configuration di script
notepad sync-data-to-vps.ps1

# Ubah:
# $LOCAL_USER = "postgres"
# $LOCAL_DB = "invoice_db"
# $VPS_HOST = "your-vps-ip"
# $VPS_USER = "your-ssh-user"
# $VPS_PATH = "/path/to/invoice-web"

# Run script
.\sync-data-to-vps.ps1
```

**CMD (Alternative):**

```cmd
REM Edit configuration di script
notepad sync-data-to-vps.bat

REM Run script
sync-data-to-vps.bat

REM Follow manual steps untuk transfer file
```

### Linux/Mac:

```bash
# Edit configuration di script
nano sync-data-to-vps.sh

# Set LOCAL_DOCKER=false untuk native PostgreSQL
# Set LOCAL_DOCKER=true untuk Docker PostgreSQL
# VPS_HOST="your-vps-ip"
# VPS_USER="your-ssh-user"
# VPS_PATH="/path/to/invoice-web"

# Run script
chmod +x sync-data-to-vps.sh
./sync-data-to-vps.sh
```

Script akan otomatis:

- ✅ Export data local
- ✅ Backup VPS database
- ✅ Transfer file (Linux/Mac)
- ✅ Truncate table
- ✅ Import data
- ✅ Verify totals

---

## 📊 Option 3: Copy Specific Records Only

Jika hanya mau sync beberapa invoice tertentu:

```bash
# Export specific date range
docker exec invoice-postgres pg_dump \
  -U postgres \
  -d invoice_db \
  --table=invoices \
  --data-only \
  --column-inserts \
  -t invoices \
  --where="date >= '2025-01-01'" \
  > recent_invoices.sql

# Transfer dan import sama seperti option 1
```

---

## 🔍 Verification Checklist

Setelah sync, verify ini:

```bash
# 1. Count records
docker exec invoice-postgres psql -U postgres -d invoice_db \
  -c "SELECT COUNT(*) FROM invoices;"

# 2. Grand total
docker exec invoice-postgres psql -U postgres -d invoice_db \
  -c "SELECT SUM(total) FROM invoices;"

# 3. Check column type
docker exec invoice-postgres psql -U postgres -d invoice_db \
  -c "\d invoices"
# Should show: total | numeric(15,2)

# 4. Sample records
docker exec invoice-postgres psql -U postgres -d invoice_db \
  -c "SELECT no_invoice, total FROM invoices ORDER BY id DESC LIMIT 10;"

# 5. Test backend
curl http://localhost:8600/api/invoices | jq '.invoices | length'

# 6. Test submit new invoice via UI
# Submit test invoice dan verify tersimpan
```

---

## 🎯 Expected Results

**Before Sync (VPS):**

- Count: varies
- Total: might be incorrect
- Format: might be VARCHAR or wrong

**After Sync (VPS):**

- Count: sama dengan local
- Total: sama dengan local (e.g., 26.90 Miliar)
- Format: DECIMAL(15,2)
- Column type: `numeric(15,2)`

---

## ⚠️ Troubleshooting

### Error: "relation 'stats' does not exist" during import

**Cause:** Triggers fired during import, tapi stats table belum ada.

**Quick Fix (jika sudah terlanjur import):**

**Option A - Automated Script (EASIEST):**
```bash
# Linux/Mac
chmod +x fix-stats-after-import.sh
./fix-stats-after-import.sh

# Windows
fix-stats-after-import.bat
```

**Option B - Manual Steps:**
```bash
cd /path/to/invoice-web

# Pull latest migrations
git pull origin master

# Create stats table
docker exec -i invoice-postgres psql -U postgres -d invoice_db \
  < backend/drizzle/migrations/0002_create_stats_table.sql

# Populate stats from existing invoices
docker exec invoice-postgres psql -U postgres -d invoice_db -c "
DELETE FROM stats WHERE id = 1;
INSERT INTO stats (id, total_invoices, paid_invoices, unpaid_invoices, total_value)
SELECT 
    1,
    COUNT(*)::INTEGER,
    COUNT(CASE WHEN paid = true THEN 1 END)::INTEGER,
    COUNT(CASE WHEN paid = false THEN 1 END)::INTEGER,
    COALESCE(SUM(total), 0)
FROM invoices;
"

# Verify
docker exec invoice-postgres psql -U postgres -d invoice_db \
  -c "SELECT * FROM stats;"
```

**Prevention:** Selalu **drop triggers dulu** sebelum import (lihat Step 5), lalu recreate setelah import selesai.

### Error: "TRUNCATE TABLE requires permission"

```bash
# Login sebagai postgres superuser
docker exec -it invoice-postgres psql -U postgres invoice_db
TRUNCATE TABLE invoices RESTART IDENTITY CASCADE;
\q
```

### Error: "INSERT failed - duplicate key"

```bash
# Reset sequence
docker exec invoice-postgres psql -U postgres -d invoice_db -c \
  "SELECT setval('invoices_id_seq', (SELECT MAX(id) FROM invoices));"
```

### Rollback jika gagal

```bash
docker exec -i invoice-postgres psql -U postgres invoice_db < backup_before_sync_YYYYMMDD_HHMMSS.sql
```

---

## 📝 Summary

**Recommended Flow:**

1. Export local → transfer → backup VPS → truncate → import → verify
2. Atau gunakan automated script
3. Downtime: ~5-10 menit
4. Sangat low risk (ada backup)

**Alternative:**

- Jika tidak mau truncate, bisa pakai `pg_restore` dengan `--clean` flag
- Atau manual delete dan insert per batch

**After Sync:**

- Test submit invoice baru
- Verify frontend masih berfungsi
- Monitor logs untuk errors
- Hapus backup files setelah confirmed OK

---

## 🔗 Related Docs

- `PRODUCTION-MIGRATION-GUIDE.md` - Migration VARCHAR → DECIMAL
- `VPS-ERROR-FIX.md` - Fix error "cannot cast automatically"
- `QUICK-MIGRATION.md` - Quick reference untuk migration
