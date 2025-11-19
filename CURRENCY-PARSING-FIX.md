# Currency Parsing Fix - Migration 0004

## Problem

Indonesian number format was not parsed correctly in stats calculations:

```
Format: "4.000.000,00" (4 million with cents)
Wrong parsing: "4.000.000" → 4.0 (only first digits before dot)
Correct parsing: "4000000.00" → 4000000.0
```

This caused total values in stats to be **dramatically lower** than actual (e.g., 404 billion instead of 562 billion).

## Root Cause

The original migration used:
```sql
regexp_replace(total, '[^0-9.]', '', 'g')
```

This kept dots and removed everything else, so:
- `"4.000.000,00"` → `"4.000.000"` → parsed as `4.0` ❌

## Solution

Migration 0004 creates a proper parsing function:

```sql
CREATE OR REPLACE FUNCTION parse_indonesian_currency(amount TEXT)
RETURNS DECIMAL(20, 2) AS $$
BEGIN
    RETURN CAST(
        regexp_replace(
            regexp_replace(amount, '\.', '', 'g'),  -- Remove dots (thousands)
            ',', '.'                                 -- Replace comma with dot (decimal)
        ) AS DECIMAL(20, 2)
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

Now:
- `"4.000.000,00"` → `"4000000.00"` → parsed as `4000000.0` ✅

## Changes

1. **Increased DECIMAL precision**: `DECIMAL(15,2)` → `DECIMAL(20,2)` to handle larger totals
2. **Created parse_indonesian_currency()**: Proper parsing function
3. **Updated stats calculation**: Recalculated all stats with correct parsing
4. **Updated triggers**: All future calculations use correct parsing

## Deployment

### For New Installations

Already included in deployment flow:

```bash
sudo docker compose exec backend bun run scripts/run-stats-migration.ts
sudo docker compose exec backend bun run scripts/fix-currency-parsing.ts
```

### For Existing Installations

If you already have stats table with wrong values:

```bash
cd /var/www/thoyba-invoice-web
sudo git pull origin master
sudo docker compose exec backend bun run scripts/fix-currency-parsing.ts
```

This will:
- ✅ Upgrade DECIMAL precision
- ✅ Create parse_indonesian_currency function
- ✅ Recalculate all stats correctly
- ✅ Update triggers for future calculations

## Verification

After running the fix:

```bash
# Check stats
sudo docker compose exec backend bun run scripts/show-stats.ts

# Should show correct total (e.g., ~562 billion for 5070 invoices)
# Instead of wrong total (e.g., ~404 billion)
```

## Impact

Before fix:
```
5070 invoices = Rp 404,250,241,096 (WRONG - 28% loss)
```

After fix:
```
5070 invoices = Rp 562,048,970,028 (CORRECT)
```

**Difference**: ~158 billion rupiah recovered! 💰

## Testing

Test the parsing function:

```sql
SELECT parse_indonesian_currency('4.000.000,00');  -- Returns: 4000000.00
SELECT parse_indonesian_currency('1.234.567.890,50');  -- Returns: 1234567890.50
```

## Files Changed

- `backend/src/db/migrations/0004_fix_indonesian_currency_parsing.sql` - Migration
- `backend/scripts/fix-currency-parsing.ts` - Script to run migration
- `DEPLOYMENT-GUIDE.md` - Updated deployment steps
- `backend/SCRIPTS-README.md` - Documented new script

## Notes

- This fix is **backward compatible** - existing stats table will be upgraded
- All future invoice calculations will use correct parsing automatically
- No data loss - only recalculation with correct formula
- Local dev environment already working correctly (manually cleaned duplicates)
