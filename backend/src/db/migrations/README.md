# Database Migrations - Urutan dan Penjelasan

## Urutan Migrations (Kronologis)

### ✅ 0001_add_invoice_indexes.sql

**Tanggal**: 19 Nov 2025, 7:21 PM  
**Status**: Sudah dijalankan  
**Fungsi**: Menambahkan indexes untuk performa query

- Index pada `supplier` (filter by supplier)
- Index pada `date` (date range queries)
- Index pada `paid` (filter paid/unpaid)
- Index pada `timestamp` (sort by creation time)
- Index pada `branch` (filter by branch)

**Dampak**: ✅ Meningkatkan performa query filter dan sorting

---

### ✅ 0002_add_invoice_number_index.sql

**Tanggal**: 19 Nov 2025, 10:16 PM  
**Status**: Sudah dijalankan  
**Fungsi**: Menambahkan index pada `invoice_number`

- Index untuk pencarian by invoice number

**Dampak**: ✅ Meningkatkan performa search by invoice number

---

### ✅ 0003_add_stats_table.sql

**Tanggal**: 19 Nov 2025, 9:51 PM  
**Status**: Sudah dijalankan  
**Fungsi**: Membuat tabel `stats` dan triggers

- Tabel `stats` untuk cache statistik
- Trigger `update_stats()` untuk auto-update
- Triggers pada INSERT, UPDATE, DELETE invoices

**Dampak**: ✅ Dashboard stats lebih cepat (cached)

---

### ✅ 0004_fix_indonesian_currency_parsing.sql

**Tanggal**: 19 Nov 2025, 11:28 PM  
**Status**: Sudah dijalankan  
**Fungsi**: Fix parsing format Indonesia

- Function `parse_indonesian_currency()` untuk parse format "4.000.000,00"
- Update trigger untuk menggunakan parsing yang benar
- Recalculate stats dengan parsing yang benar

**Dampak**: ✅ Stats total sudah benar (sebelumnya salah parsing)

**NOTE**: Function ini sudah di-DROP di migration 0008 karena tidak dibutuhkan lagi

---

### ✅ 0005_extend_date_columns.sql

**Tanggal**: 20 Nov 2025, 11:26 AM  
**Status**: Sudah dijalankan  
**Fungsi**: Extend kolom date

- `date`: varchar(10) → varchar(50)
- `paid_date`: varchar(10) → varchar(50)

**Dampak**: ✅ Bisa menyimpan format date yang lebih panjang

---

### ✅ 0006_extend_invoice_number.sql

**Tanggal**: 20 Nov 2025, 11:26 AM  
**Status**: Sudah dijalankan  
**Fungsi**: Extend kolom invoice_number

- `invoice_number`: varchar(10) → varchar(100)

**Dampak**: ✅ Bisa menyimpan invoice number yang lebih panjang

---

### ✅ 0007_change_total_to_decimal.sql

**Tanggal**: 20 Nov 2025, 11:31 AM  
**Status**: Sudah dijalankan (via migrate-simple.ts)  
**Fungsi**: Convert kolom total ke DECIMAL

- Drop triggers temporarily (untuk menghindari conflict)
- Add kolom `total_temp` dengan tipe DECIMAL(15,2)
- Convert data dari VARCHAR formatted ke DECIMAL
- Drop kolom `total` lama
- Rename `total_temp` → `total`
- Add constraint `total_positive`

**Format Conversion**:

- `"Rp 56.489.562,78"` → `56489562.78`
- `"56.489.562,78"` → `56489562.78`
- `"649.44"` → `649.44`
- `"388800"` → `388800.00`

**Dampak**: ✅ Total disimpan sebagai DECIMAL, tidak perlu parsing lagi

**NOTE**: Migration ini dijalankan via script `migrate-simple.ts`, bukan langsung via SQL

---

### ✅ 0008_update_triggers_for_decimal.sql

**Tanggal**: 20 Nov 2025, 11:31 AM  
**Status**: Sudah dijalankan (via migrate-simple.ts)  
**Fungsi**: Update triggers untuk DECIMAL

- Update function `update_stats()` untuk langsung `SUM(total)` tanpa parsing
- Recreate triggers (INSERT, UPDATE, DELETE)
- Drop function `parse_indonesian_currency()` (tidak dibutuhkan lagi)
- Recalculate stats dengan DECIMAL

**Dampak**: ✅ Stats calculation lebih cepat, tidak perlu parsing

---

## Timeline Migrasi Total Format

### Phase 1: Format Indonesia dengan Parsing (19-20 Nov)

1. ✅ 0003: Buat stats table dengan trigger
2. ✅ 0004: Fix parsing format Indonesia ("4.000.000,00")
3. **Status**: Total masih VARCHAR, perlu parsing setiap query

### Phase 2: Migrasi ke DECIMAL (20 Nov, 11:31 AM)

4. ✅ 0007: Convert total dari VARCHAR → DECIMAL(15,2)
5. ✅ 0008: Update triggers untuk bekerja dengan DECIMAL
6. **Status**: Total sekarang DECIMAL, tidak perlu parsing lagi

**Verifikasi**:

- ✅ 5,040 invoices converted
- ✅ Total sebelum: 26.90 Miliar
- ✅ Total sesudah: 26.90 Miliar
- ✅ Accuracy: 100% (0.0000% difference)

---

## Schema Current State

### Tabel: `invoices`

```sql
id              SERIAL PRIMARY KEY
supplier        VARCHAR(255) NOT NULL
branch          VARCHAR(50) NOT NULL
date            VARCHAR(50) NOT NULL           -- Extended dari varchar(10)
invoiceNumber   VARCHAR(100) NOT NULL          -- Extended dari varchar(10)
total           DECIMAL(15,2) NOT NULL         -- Changed dari varchar(50)
description     TEXT
timestamp       TIMESTAMP DEFAULT NOW()
paid            BOOLEAN DEFAULT FALSE
paidDate        VARCHAR(50)                    -- Extended dari varchar(10)

-- Constraints
CONSTRAINT total_positive CHECK (total >= 0)

-- Indexes
idx_invoices_supplier
idx_invoices_date
idx_invoices_paid
idx_invoices_timestamp
idx_invoices_branch
idx_invoices_invoice_number
```

### Tabel: `stats`

```sql
id              SERIAL PRIMARY KEY
totalInvoices   INTEGER NOT NULL DEFAULT 0
paidInvoices    INTEGER NOT NULL DEFAULT 0
unpaidInvoices  INTEGER NOT NULL DEFAULT 0
totalValue      DECIMAL(20,2) NOT NULL DEFAULT 0
lastUpdated     TIMESTAMP NOT NULL DEFAULT NOW()
```

### Functions & Triggers

```sql
-- Function
update_stats() RETURNS TRIGGER
  → Recalculates stats using SUM(total) directly (no parsing needed)

-- Triggers on invoices table
trigger_stats_insert  → AFTER INSERT → update_stats()
trigger_stats_update  → AFTER UPDATE → update_stats()
trigger_stats_delete  → AFTER DELETE → update_stats()
```

---

## Cara Menjalankan Migrations

### ⚠️ PENTING: Migrations 0007 & 0008 JANGAN dijalankan manual!

Migrations 0007 dan 0008 sudah dijalankan via script `migrate-simple.ts` yang melakukan:

1. Drop triggers & functions
2. Convert data
3. Update schema
4. Recreate triggers & functions

**Jika perlu menjalankan ulang** (misalnya di production):

```bash
cd backend
bun run migrate-simple.ts
```

### Untuk migrations lainnya (0001-0006):

Migrations ini sudah dijalankan secara incremental dan tidak perlu dijalankan ulang.

---

## Rollback Plan

Jika ada masalah dan perlu rollback ke format VARCHAR:

### Rollback 0008 & 0007:

```sql
-- 1. Drop triggers
DROP TRIGGER IF EXISTS invoice_insert_trigger ON invoices;
DROP TRIGGER IF EXISTS invoice_update_trigger ON invoices;
DROP TRIGGER IF EXISTS invoice_delete_trigger ON invoices;

-- 2. Add temp varchar column
ALTER TABLE invoices ADD COLUMN total_temp VARCHAR(50);

-- 3. Convert decimal back to Indonesian format
UPDATE invoices
SET total_temp = 'Rp ' ||
    REPLACE(
        TO_CHAR(total, 'FM999G999G999G999G999D00'),
        ',', '.'
    );

-- 4. Swap columns
ALTER TABLE invoices DROP COLUMN total;
ALTER TABLE invoices RENAME COLUMN total_temp TO total;
ALTER TABLE invoices ALTER COLUMN total SET NOT NULL;

-- 5. Restore old triggers (copy from migration 0004)
```

---

## Catatan Penting

### ✅ Yang Sudah Selesai

- [x] All migrations 0001-0008 executed successfully
- [x] Data integrity verified (100% accuracy)
- [x] Frontend updated to work with DECIMAL
- [x] Triggers & functions updated

### 📋 Next Steps

- [ ] Test submit invoice baru di production
- [ ] Monitor performa queries
- [ ] Backup database sebelum deploy

### 🚫 Jangan Lakukan

- ❌ JANGAN run migrations 0007-0008 manual via SQL
- ❌ JANGAN ubah schema tanpa migration
- ❌ JANGAN hapus migration files (untuk dokumentasi)

---

**Last Updated**: 20 November 2025, 11:45 AM  
**Database Status**: ✅ Up-to-date dengan semua migrations
