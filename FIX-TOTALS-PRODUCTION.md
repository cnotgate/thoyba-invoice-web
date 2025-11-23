# Fix Total Values in Production (VPS)

**Problem:** Some invoice totals were parsed incorrectly due to a bug in number format handling. Invoices with format like `56.489.562.78` (56 million) were stored as 5.6 billion.

**Solution:** Run the `fix-total-values.ts` script to divide incorrectly high totals by 100.

---

## Steps to Fix Production Database

### 1. Push the Fix Script to GitHub

```bash
git add backend/scripts/fix-total-values.ts
git commit -m "Add script to fix incorrectly parsed total values"
git push origin master
```

### 2. Connect to VPS and Pull Updates

```bash
ssh root@139.59.229.135
cd /root/invoice-web
git pull origin master
```

### 3. Run the Fix Script

**Inside Docker container:**

```bash
# Find the backend container name
docker ps

# Execute the script inside the container
docker exec -it invoice-web-backend-1 bun run scripts/fix-total-values.ts
```

**Alternative (if you need to enter the container):**

```bash
# Enter the backend container
docker exec -it invoice-web-backend-1 sh

# Inside container, run the script
cd /app
bun run scripts/fix-total-values.ts

# Exit container
exit
```

### Expected Output:

```
🔍 Checking for incorrectly parsed totals...

📊 Found X invoices with totals > 1 billion:

Sample invoices BEFORE fix:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
110103-SI-25-047927: 5648956278.00
110103-SI-25-053148: 5307129558.00
110103-SI-25-046579: 5261621112.00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current total of suspicious invoices: Rp 404,812,987,123.90
After fix (÷ 100): Rp 4,048,129,871.24

🔧 Fixing totals by dividing by 100...

   Fixed 100/X invoices...
   Fixed 200/X invoices...
✅ Fixed X invoices!

Sample invoices AFTER fix:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
110103-SI-25-047927: 56489562.78
110103-SI-25-053148: 53071295.58
110103-SI-25-046579: 52616211.12
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Database totals after fix:
   Total invoices: 5112
   Total value: Rp 27,163,495,480.63

✨ Done!
```

---

## Verification Queries

After running the script, verify the fix **inside the database container**:

```bash
# Enter the database container
docker exec -it invoice-web-db-1 psql -U postgres -d invoice_db

# Inside psql, run these queries:

-- Check for any remaining suspicious totals
SELECT COUNT(*) FROM invoices WHERE total > 1000000000;
-- Should return: 0

-- Check total value
SELECT COUNT(*), SUM(total) FROM invoices;
-- Should return: 5112 | ~27 billion (not 404 billion)

-- Check specific invoice
SELECT invoice_number, total FROM invoices WHERE invoice_number = '110103-SI-25-047927';
-- Should return: 56489562.78 (not 5648956278.00)

-- Exit psql
\q
```

**One-liner verification (outside container):**

```bash
# Check total
docker exec -it invoice-web-db-1 psql -U postgres -d invoice_db -c "SELECT COUNT(*), SUM(total) FROM invoices"

# Check suspicious invoices
docker exec -it invoice-web-db-1 psql -U postgres -d invoice_db -c "SELECT COUNT(*) FROM invoices WHERE total > 1000000000"
```

---

## What This Script Does

1. **Identifies** invoices with totals > 1 billion (abnormally high)
2. **Divides** those totals by 100 to get correct value
3. **Updates** the database in-place
4. **Verifies** the fix with before/after samples

---

## Safety Notes

- ✅ **Safe to run multiple times** - only fixes invoices > 1 billion
- ✅ **No data loss** - only updates total column
- ✅ **Tested on local** database first
- ✅ **Reversible** - if needed, multiply by 100 again

---

## If Something Goes Wrong

1. **Backup before running (inside database container):**

   ```bash
   docker exec -it invoice-web-db-1 pg_dump -U postgres -d invoice_db > /root/backup_before_fix.sql
   ```

2. **Restore if needed:**
   ```bash
   docker exec -i invoice-web-db-1 psql -U postgres -d invoice_db < /root/backup_before_fix.sql
   ```

---

## Root Cause (Fixed in Code)

The bug was in `reimport-from-csv.ts` parseTotal() function. It didn't handle format `56.489.562.78` correctly:

- ❌ Old: Read as 5,648,956,278 (5.6 billion)
- ✅ New: Read as 56,489,562.78 (56 million)

The code fix is already in GitHub, so future imports will be correct.
