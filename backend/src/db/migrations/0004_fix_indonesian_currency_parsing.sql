-- Fix parsing for Indonesian number format (4.000.000,00)
-- Previous parsing was wrong: regexp_replace(total, '[^0-9.]', '', 'g') 
-- This kept dots which caused 4.000.000 to be parsed as 4.0

-- Step 1: Increase DECIMAL precision to handle larger values
ALTER TABLE stats ALTER COLUMN total_value TYPE DECIMAL(20, 2);

-- Step 2: Create corrected parsing function
CREATE OR REPLACE FUNCTION parse_indonesian_currency(amount TEXT)
RETURNS DECIMAL(20, 2) AS $$
BEGIN
    -- Indonesian format: 4.000.000,00
    -- 1. Remove dots (thousands separator)
    -- 2. Replace comma with dot (decimal separator)
    -- 3. Cast to DECIMAL
    RETURN CAST(
        regexp_replace(
            regexp_replace(amount, '\.', '', 'g'),  -- Remove dots
            ',', '.'                                 -- Replace comma with dot
        ) AS DECIMAL(20, 2)
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 3: Recalculate stats with correct parsing
UPDATE stats SET
    total_invoices = (SELECT COUNT(*)::INTEGER FROM invoices),
    paid_invoices = (SELECT COUNT(*)::INTEGER FROM invoices WHERE paid = true),
    unpaid_invoices = (SELECT COUNT(*)::INTEGER FROM invoices WHERE paid = false),
    total_value = (
        SELECT COALESCE(SUM(parse_indonesian_currency(total)), 0)
        FROM invoices
    ),
    last_updated = CURRENT_TIMESTAMP
WHERE id = 1;

-- Step 4: Update the trigger function to use correct parsing
CREATE OR REPLACE FUNCTION update_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate all stats with correct Indonesian format parsing
    UPDATE stats SET
        total_invoices = (SELECT COUNT(*)::INTEGER FROM invoices),
        paid_invoices = (SELECT COUNT(*)::INTEGER FROM invoices WHERE paid = true),
        unpaid_invoices = (SELECT COUNT(*)::INTEGER FROM invoices WHERE paid = false),
        total_value = (
            SELECT COALESCE(SUM(parse_indonesian_currency(total)), 0)
            FROM invoices
        ),
        last_updated = CURRENT_TIMESTAMP
    WHERE id = 1;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers remain the same (already created in 0003)
-- No need to recreate them

-- Verify the fix
SELECT 
    'Fixed Stats' as status,
    total_invoices,
    paid_invoices,
    unpaid_invoices,
    total_value,
    last_updated
FROM stats WHERE id = 1;
