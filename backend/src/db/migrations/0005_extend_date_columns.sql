-- Extend date and paid_date columns
ALTER TABLE invoices ALTER COLUMN date TYPE varchar(50);
ALTER TABLE invoices ALTER COLUMN paid_date TYPE varchar(50);
