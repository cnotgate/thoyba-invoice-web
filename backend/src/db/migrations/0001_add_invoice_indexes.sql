-- Migration: Add indexes to invoices table for improved query performance
-- Created: 2025-11-19

-- Add index on supplier column for filtering by supplier
CREATE INDEX IF NOT EXISTS idx_invoices_supplier ON invoices(supplier);

-- Add index on date column for date range queries and sorting
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);

-- Add index on paid column for filtering paid/unpaid invoices
CREATE INDEX IF NOT EXISTS idx_invoices_paid ON invoices(paid);

-- Add index on timestamp column for sorting by creation time
CREATE INDEX IF NOT EXISTS idx_invoices_timestamp ON invoices(timestamp);

-- Add index on branch column for filtering by branch
CREATE INDEX IF NOT EXISTS idx_invoices_branch ON invoices(branch);
