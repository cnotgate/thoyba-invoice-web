-- Migration: Create or update stats table for DECIMAL format
-- This migration ensures stats table exists and triggers work with DECIMAL

-- Create stats table if not exists
CREATE TABLE IF NOT EXISTS stats (
    id SERIAL PRIMARY KEY,
    total_invoices INTEGER NOT NULL DEFAULT 0,
    paid_invoices INTEGER NOT NULL DEFAULT 0,
    unpaid_invoices INTEGER NOT NULL DEFAULT 0,
    total_value DECIMAL(15, 2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Drop existing function and triggers (if any)
DROP TRIGGER IF EXISTS trigger_stats_insert ON invoices;
DROP TRIGGER IF EXISTS trigger_stats_update ON invoices;
DROP TRIGGER IF EXISTS trigger_stats_delete ON invoices;
DROP FUNCTION IF EXISTS update_stats() CASCADE;

-- Create function to update stats (compatible with DECIMAL)
CREATE OR REPLACE FUNCTION update_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate all stats
    UPDATE stats SET
        total_invoices = (SELECT COUNT(*)::INTEGER FROM invoices),
        paid_invoices = (SELECT COUNT(*)::INTEGER FROM invoices WHERE paid = true),
        unpaid_invoices = (SELECT COUNT(*)::INTEGER FROM invoices WHERE paid = false),
        total_value = (SELECT COALESCE(SUM(total), 0) FROM invoices),
        last_updated = CURRENT_TIMESTAMP
    WHERE id = 1;
    
    -- If no row exists, insert one
    IF NOT FOUND THEN
        INSERT INTO stats (id, total_invoices, paid_invoices, unpaid_invoices, total_value)
        VALUES (
            1,
            (SELECT COUNT(*)::INTEGER FROM invoices),
            (SELECT COUNT(*)::INTEGER FROM invoices WHERE paid = true),
            (SELECT COUNT(*)::INTEGER FROM invoices WHERE paid = false),
            (SELECT COALESCE(SUM(total), 0) FROM invoices)
        );
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_stats_insert
AFTER INSERT ON invoices
FOR EACH STATEMENT
EXECUTE FUNCTION update_stats();

CREATE TRIGGER trigger_stats_update
AFTER UPDATE ON invoices
FOR EACH STATEMENT
EXECUTE FUNCTION update_stats();

CREATE TRIGGER trigger_stats_delete
AFTER DELETE ON invoices
FOR EACH STATEMENT
EXECUTE FUNCTION update_stats();

-- Initialize stats if table is empty
INSERT INTO stats (id, total_invoices, paid_invoices, unpaid_invoices, total_value)
SELECT 
    1,
    COUNT(*)::INTEGER,
    COUNT(CASE WHEN paid = true THEN 1 END)::INTEGER,
    COUNT(CASE WHEN paid = false THEN 1 END)::INTEGER,
    COALESCE(SUM(total), 0)
FROM invoices
WHERE NOT EXISTS (SELECT 1 FROM stats WHERE id = 1);
