-- Migration: Change total column from varchar to decimal(15,2)
-- This will store plain numbers like 56489562.78 instead of formatted strings

-- Step 1: Drop triggers temporarily (will recreate later)
DROP TRIGGER IF EXISTS invoice_insert_trigger ON invoices;
DROP TRIGGER IF EXISTS invoice_update_trigger ON invoices;
DROP TRIGGER IF EXISTS invoice_delete_trigger ON invoices;

-- Step 2: Add temporary column
ALTER TABLE invoices ADD COLUMN total_temp DECIMAL(15,2);

-- Step 3: Convert existing data from varchar total to decimal total_temp
UPDATE invoices 
SET total_temp = 
    CASE
        -- Format: "Rp 56.489.562,78" (Indonesian with Rp prefix)
        WHEN total::text LIKE 'Rp%' THEN 
            (REPLACE(REPLACE(REPLACE(total::text, 'Rp ', ''), '.', ''), ',', '.'))::decimal(15,2)
        
        -- Format: "56.489.562,78" (Indonesian without Rp)
        WHEN total::text LIKE '%,%' THEN 
            (REPLACE(REPLACE(total::text, '.', ''), ',', '.'))::decimal(15,2)
        
        -- Format: "56.489.562.78" (dots only, last 2 digits are decimal)
        WHEN total::text ~ '^\d+(\.\d{3})+\.\d{2}$' THEN
            (REGEXP_REPLACE(
                SUBSTRING(total::text FROM 1 FOR LENGTH(total::text) - 3),
                '\.',
                '',
                'g'
            ) || '.' || SUBSTRING(total::text FROM LENGTH(total::text) - 1 FOR 2))::decimal(15,2)
        
        -- Format: "649.44" (American decimal)
        WHEN total::text ~ '^\d+\.\d{2}$' THEN total::decimal(15,2)
        
        -- Format: "388800" (plain integer)
        WHEN total::text ~ '^\d+$' THEN total::decimal(15,2)
        
        -- Default: try to parse as-is
        ELSE total::decimal(15,2)
    END;

-- Step 4: Drop old column and rename temp column
ALTER TABLE invoices DROP COLUMN total;
ALTER TABLE invoices RENAME COLUMN total_temp TO total;

-- Step 5: Add NOT NULL constraint
ALTER TABLE invoices ALTER COLUMN total SET NOT NULL;

-- Step 6: Add constraint to ensure positive values
ALTER TABLE invoices 
ADD CONSTRAINT total_positive CHECK (total >= 0);
