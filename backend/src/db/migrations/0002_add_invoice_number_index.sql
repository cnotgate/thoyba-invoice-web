-- Add index on invoice_number for faster search queries
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
