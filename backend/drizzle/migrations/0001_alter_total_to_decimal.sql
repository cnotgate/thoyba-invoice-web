-- Migration: Update total column from VARCHAR to DECIMAL
-- Generated: 2025-11-20

-- This migration properly converts the total column with USING clause
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
