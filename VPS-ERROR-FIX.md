# 🚨 Fix VPS Error: "column cannot be cast automatically"

## Error yang Muncul:
```
PostgresError: column "total" cannot be cast automatically to type numeric
hint: "You might need to specify \"USING total::numeric(15,2)\"."
```

## Penyebab:
- Backend sudah update ke schema DECIMAL
- Database di VPS masih pakai VARCHAR
- Drizzle migration tidak bisa auto-convert

## ✅ Solusi Cepat (5 Menit):

### 1. Pull Latest Code
```bash
cd /path/to/invoice-web
git pull origin master
```

**Perubahan yang di-pull:**
- ✅ Migration file baru: `0001_alter_total_to_decimal.sql`
- ✅ Migration file baru: `0002_create_stats_table.sql`
- ✅ Dengan proper USING clause untuk convert data
- ✅ Support format Indonesia dan plain number
- ✅ Create stats table dan triggers

### 2. Restart Container
```bash
docker-compose down
docker-compose up -d
```

**Yang terjadi saat startup:**
- Container backend akan run `scripts/start-with-migration.ts`
- Migration Drizzle akan detect file baru
- Execute ALTER TABLE dengan USING clause
- Convert semua data VARCHAR → DECIMAL
- Backend start normal

### 3. Monitor Logs
```bash
docker-compose logs -f backend
```

**Expected output:**
```
✅ Running database migrations...
✅ Migration applied: 0001_alter_total_to_decimal
✅ Database migrations completed successfully
✅ Server is running on port 3001
```

### 4. Verify
```bash
# Check column type
docker exec invoice-postgres psql -U postgres -d invoice_db -c "\d invoices"

# Should show: total | numeric(15,2)

# Check grand total
docker exec invoice-postgres psql -U postgres -d invoice_db -c "SELECT SUM(total) FROM invoices;"
```

---

## � Error Tambahan: "relation 'stats' does not exist"

**Cause:** Table `stats` belum ada setelah import data.

**Solution:**
```bash
# Pull latest migrations
cd /path/to/invoice-web
git pull origin master

# Restart untuk run migration 0002_create_stats_table.sql
docker-compose restart backend

# Atau manual:
docker exec -i invoice-postgres psql -U postgres -d invoice_db \
  < backend/drizzle/migrations/0002_create_stats_table.sql
```

---

## �🔄 Alternative: Manual Migration (Jika Pull Gagal)

Jika tidak bisa pull atau prefer manual:

```bash
# 1. Stop backend
docker-compose stop backend

# 2. Run SQL manual
docker exec -it invoice-postgres psql -U postgres -d invoice_db

# 3. Execute untuk ALTER column:
ALTER TABLE invoices 
ALTER COLUMN total TYPE DECIMAL(15,2) 
USING (
  CASE 
    WHEN total ~ '^[0-9]+(\.[0-9]+)?$' THEN total::DECIMAL(15,2)
    ELSE (
      CAST(
        REPLACE(
          REPLACE(
            REPLACE(total, 'Rp ', ''),
            '.', ''
          ),
          ',', '.'
        ) AS DECIMAL(15,2)
      )
    )
  END
);

# 4. Exit dan start backend
\q
docker-compose start backend
```

---

## 📊 Verifikasi Berhasil:

1. ✅ Backend start tanpa error
2. ✅ Column type: `numeric(15,2)`
3. ✅ Grand total tetap sama
4. ✅ Bisa submit invoice baru dengan format decimal

---

## ⚠️ Jika Masih Error:

1. Check logs detail:
```bash
docker-compose logs backend | grep -A 20 "error"
```

2. Check database connection:
```bash
docker exec invoice-backend bun run test-connection.ts
```

3. Check migration status:
```bash
docker exec invoice-postgres psql -U postgres -d invoice_db -c "SELECT * FROM drizzle.__drizzle_migrations;"
```

4. Rollback jika perlu:
```bash
# Restore dari backup
docker-compose stop backend
docker exec invoice-postgres psql -U postgres -d invoice_db < backup.sql
docker-compose start backend
```

---

## 🎯 Summary:

**Root Cause:** Schema mismatch between code (DECIMAL) and database (VARCHAR)

**Fix:** Pull latest code → Restart → Auto migration with proper USING clause

**Time:** ~2-3 minutes downtime

**Risk:** Low (migration tested locally, includes data conversion logic)
