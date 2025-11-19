# Update Deployment - Stats Migration

## For Existing Deployments

Jika aplikasi sudah ter-deploy sebelumnya dan ingin menambahkan fitur stats caching, ikuti langkah berikut:

### Step 1: Update Code

```bash
# On VPS server
cd /var/www/thoyba-invoice-web
sudo git pull origin master
```

### Step 2: Rebuild & Restart

```bash
# Stop containers
sudo docker compose down

# Rebuild with new code
sudo docker compose up -d --build

# Wait for containers to start
sleep 30
```

### Step 3: Run Stats Migration (ONE-TIME)

```bash
# Run migration inside backend container
sudo docker compose exec backend bun run scripts/run-stats-migration.ts
```

**Expected Output:**

```
Running stats migration...
✓ Stats table created successfully!
✓ Triggers installed successfully!
✓ Initial data populated!
```

### Step 4: Verify Stats

```bash
# Check stats data
sudo docker compose exec backend bun run scripts/show-stats.ts
```

**Expected Output:**

```
=== Current Stats in Database ===

📊 Statistics:
  Total Invoices: 4998
  Paid Invoices: 4139
  Unpaid Invoices: 859
  Total Value: Rp 560.581.143.798
  Last Updated: 20/11/2025, 04.53.51

✅ Stats table is working correctly!
```

### Step 5: Test Dashboard

Open `https://your-domain.com/admin` dan perhatikan:

- ✅ Dashboard load **jauh lebih cepat** (10-20x faster)
- ✅ Stats tetap akurat (auto-update dengan triggers)
- ✅ No errors di console

---

## What Changed?

### Backend:

1. **New table**: `stats` untuk caching statistik
2. **3 triggers**: Auto-update saat invoice INSERT/UPDATE/DELETE
3. **Modified endpoint**: `/api/invoices/stats` menggunakan cached data
4. **New migration**: `0003_add_stats_table.sql`

### Frontend:

- ✅ **No changes needed!** Frontend tetap menggunakan endpoint yang sama
- Dashboard otomatis lebih cepat karena backend sudah menggunakan cache

### Performance Gain:

- **Before**: 3 aggregation queries, full table scan (~100-300ms)
- **After**: 1 simple SELECT from cache (~5-10ms)
- **Result**: **10-20x faster** dashboard load! 🚀

---

## Rollback (if needed)

Jika ada masalah, rollback dengan:

```bash
# Revert to previous version
cd /var/www/thoyba-invoice-web
sudo git checkout <previous-commit-hash>
sudo docker compose down
sudo docker compose up -d --build
```

Note: Stats table tidak akan mengganggu data lain jika dibiarkan.

---

## Troubleshooting

**Error: "relation stats does not exist"**

- Run migration: `sudo docker compose exec backend bun run scripts/run-stats-migration.ts`

**Stats tidak update:**

- Check triggers: `sudo docker compose exec postgres psql -U postgres -d invoice_db -c "\d stats"`
- Should show triggers on invoices table

**Dashboard masih lambat:**

- Clear browser cache
- Check backend logs: `sudo docker compose logs backend`
- Verify stats endpoint: `curl http://localhost:3001/api/invoices/stats`

---

**Total Update Time: ~5 minutes** (termasuk migration)

Done! Dashboard sekarang 10-20x lebih cepat! 🎉
