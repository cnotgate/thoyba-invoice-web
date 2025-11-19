-- Create stats table to cache dashboard statistics
CREATE TABLE IF NOT EXISTS stats (
    id SERIAL PRIMARY KEY,
    total_invoices INTEGER NOT NULL DEFAULT 0,
    paid_invoices INTEGER NOT NULL DEFAULT 0,
    unpaid_invoices INTEGER NOT NULL DEFAULT 0,
    total_value DECIMAL(15, 2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial row (will be updated by triggers)
INSERT INTO stats (total_invoices, paid_invoices, unpaid_invoices, total_value)
SELECT 
    COUNT(*)::INTEGER,
    COUNT(CASE WHEN paid = true THEN 1 END)::INTEGER,
    COUNT(CASE WHEN paid = false THEN 1 END)::INTEGER,
    COALESCE(SUM(
        CAST(
            regexp_replace(total, '[^0-9.]', '', 'g') AS DECIMAL(15, 2)
        )
    ), 0)
FROM invoices;

-- Function to update stats
CREATE OR REPLACE FUNCTION update_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate all stats
    UPDATE stats SET
        total_invoices = (SELECT COUNT(*)::INTEGER FROM invoices),
        paid_invoices = (SELECT COUNT(*)::INTEGER FROM invoices WHERE paid = true),
        unpaid_invoices = (SELECT COUNT(*)::INTEGER FROM invoices WHERE paid = false),
        total_value = (
            SELECT COALESCE(SUM(
                CAST(
                    regexp_replace(total, '[^0-9.]', '', 'g') AS DECIMAL(15, 2)
                )
            ), 0)
            FROM invoices
        ),
        last_updated = CURRENT_TIMESTAMP
    WHERE id = 1;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for INSERT
CREATE TRIGGER trigger_stats_insert
AFTER INSERT ON invoices
FOR EACH STATEMENT
EXECUTE FUNCTION update_stats();

-- Trigger for UPDATE
CREATE TRIGGER trigger_stats_update
AFTER UPDATE ON invoices
FOR EACH STATEMENT
EXECUTE FUNCTION update_stats();

-- Trigger for DELETE
CREATE TRIGGER trigger_stats_delete
AFTER DELETE ON invoices
FOR EACH STATEMENT
EXECUTE FUNCTION update_stats();
