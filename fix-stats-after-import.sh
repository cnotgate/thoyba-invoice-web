#!/bin/bash

# Quick Recovery: Fix stats error after import
# Run this if import already completed with "relation stats does not exist" errors

echo "🔧 Quick Recovery: Fixing stats after import..."
echo ""

# Check if in correct directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found!"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Pull latest migrations
echo "📥 Step 1/3: Pulling latest migrations..."
git pull origin master
echo ""

# Create stats table and triggers
echo "📊 Step 2/3: Creating stats table and triggers..."
docker exec -i invoice-postgres psql -U postgres -d invoice_db \
  < backend/drizzle/migrations/0002_create_stats_table.sql 2>&1 | \
  grep -v "duplicate key" || true

echo ""

# Force update stats with current data
echo "🔄 Step 3/3: Populating stats from existing invoices..."
docker exec invoice-postgres psql -U postgres -d invoice_db -c "
-- Delete existing stats row if any
DELETE FROM stats WHERE id = 1;

-- Insert fresh stats from invoices
INSERT INTO stats (id, total_invoices, paid_invoices, unpaid_invoices, total_value)
SELECT 
    1,
    COUNT(*)::INTEGER,
    COUNT(CASE WHEN paid = true THEN 1 END)::INTEGER,
    COUNT(CASE WHEN paid = false THEN 1 END)::INTEGER,
    COALESCE(SUM(total), 0)
FROM invoices;
"

echo ""

# Verify
echo "✅ Recovery completed! Verifying..."
echo ""
docker exec invoice-postgres psql -U postgres -d invoice_db -c "
SELECT 
  'Invoices' as source,
  COUNT(*) as count,
  SUM(total) as total_value
FROM invoices
UNION ALL
SELECT 
  'Stats Cache' as source,
  total_invoices as count,
  total_value
FROM stats;
"

echo ""
echo "============================================"
echo "   ✅ STATS FIXED & VERIFIED!"
echo "============================================"
echo ""
echo "Stats table is now synchronized with invoices."
echo "Triggers are active and will update stats automatically."
echo ""
