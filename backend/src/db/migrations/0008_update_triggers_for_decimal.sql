-- Migration: Drop parse_indonesian_currency function and update triggers
-- Now that total is DECIMAL, we don't need the parsing function anymore

-- Step 1: Update the trigger function to work with DECIMAL directly
CREATE OR REPLACE FUNCTION update_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate all stats (total is now DECIMAL, no parsing needed)
    UPDATE stats SET
        total_invoices = (SELECT COUNT(*)::INTEGER FROM invoices),
        paid_invoices = (SELECT COUNT(*)::INTEGER FROM invoices WHERE paid = true),
        unpaid_invoices = (SELECT COUNT(*)::INTEGER FROM invoices WHERE paid = false),
        total_value = (
            SELECT COALESCE(SUM(total), 0)
            FROM invoices
        ),
        last_updated = CURRENT_TIMESTAMP
    WHERE id = 1;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Recreate triggers
CREATE TRIGGER invoice_insert_trigger
AFTER INSERT ON invoices
FOR EACH STATEMENT
EXECUTE FUNCTION update_stats();

CREATE TRIGGER invoice_update_trigger
AFTER UPDATE ON invoices
FOR EACH STATEMENT
EXECUTE FUNCTION update_stats();

CREATE TRIGGER invoice_delete_trigger
AFTER DELETE ON invoices
FOR EACH STATEMENT
EXECUTE FUNCTION update_stats();

-- Step 3: Drop the parse_indonesian_currency function (no longer needed)
DROP FUNCTION IF EXISTS parse_indonesian_currency(TEXT);

-- Step 4: Recalculate stats immediately
UPDATE stats SET
    total_invoices = (SELECT COUNT(*)::INTEGER FROM invoices),
    paid_invoices = (SELECT COUNT(*)::INTEGER FROM invoices WHERE paid = true),
    unpaid_invoices = (SELECT COUNT(*)::INTEGER FROM invoices WHERE paid = false),
    total_value = (
        SELECT COALESCE(SUM(total), 0)
        FROM invoices
    ),
    last_updated = CURRENT_TIMESTAMP
WHERE id = 1;
