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

### Step 1: Export dari Local

```bash
# Export hanya table invoices (data-only)
docker exec invoice-postgres pg_dump \
  -U postgres \
  -d invoice_db \
  --table=invoices \
  --data-only \
  --column-inserts \
  > invoices_export.sql
```

**Hasil:** File `invoices_export.sql` berisi semua INSERT statements

### Step 2: Verify Export

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

### Step 5: Truncate & Import

```bash
# Truncate table invoices
docker exec invoice-postgres psql \
  -U postgres \
  -d invoice_db \
  -c "TRUNCATE TABLE invoices RESTART IDENTITY CASCADE;"

# Import data
docker exec -i invoice-postgres psql \
  -U postgres \
  -d invoice_db \
  < invoices_export.sql
```

### Step 6: Verify

```bash
# Check count dan total
docker exec invoice-postgres psql \
  -U postgres \
  -d invoice_db \
  -c "SELECT COUNT(*), SUM(total) FROM invoices;"

# Check sample records
docker exec invoice-postgres psql \
  -U postgres \
  -d invoice_db \
  -c "SELECT * FROM invoices ORDER BY id DESC LIMIT 5;"
```

---

## 🤖 Option 2: Automated Script (EASIEST)

### Linux/Mac:

```bash
# Edit configuration di script
nano sync-data-to-vps.sh

# Ubah:
# VPS_HOST="your-vps-ip"
# VPS_USER="your-ssh-user"
# VPS_PATH="/path/to/invoice-web"

# Run script
chmod +x sync-data-to-vps.sh
./sync-data-to-vps.sh
```

### Windows:

```cmd
REM Edit configuration di script
notepad sync-data-to-vps.bat

REM Run script
sync-data-to-vps.bat

REM Follow manual steps untuk transfer file
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
