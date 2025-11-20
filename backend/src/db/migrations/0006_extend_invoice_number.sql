-- Extend invoice_number column from varchar(10) to varchar(100)
ALTER TABLE invoices ALTER COLUMN invoice_number TYPE varchar(100);
