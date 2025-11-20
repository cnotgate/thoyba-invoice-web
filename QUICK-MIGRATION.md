# 🚀 Quick Migration Guide - TL;DR

## Cara Tercepat (Recommended)

```bash
# 1. Backup dulu!
pg_dump -U postgres invoice_db > backup_$(date +%Y%m%d).sql

# 2. Stop backend
pm2 stop invoice-backend
# atau: docker-compose stop backend

# 3. Run migration
cd backend
bun run migrate-simple.ts

# 4. Start backend
pm2 start invoice-backend
# atau: docker-compose start backend

# 5. Test
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -d '{"supplier":"Test","branch":"Kuripan","date":"2025-11-20","invoiceNumber":"TEST-001","total":"5000000.00"}'
```

## Atau Pakai Script Otomatis

### Linux/Mac:
```bash
chmod +x deploy-migration-to-production.sh
./deploy-migration-to-production.sh
```

### Windows:
```cmd
deploy-migration-to-production.bat
```

## Rollback (Jika Ada Masalah)

```bash
psql -U postgres invoice_db < backup_YYYYMMDD.sql
```

## Verifikasi Cepat

```bash
# Check column type
psql -U postgres -d invoice_db -c "\d invoices"

# Check total masih sama
psql -U postgres -d invoice_db -c "SELECT COUNT(*), SUM(total) FROM invoices"
```

## Estimasi Waktu

- **Total Downtime**: 3-5 menit
- **Backup**: 1-2 menit
- **Migration**: 2-3 menit  
- **Verification**: 30 detik

## Support Files

📚 **Dokumentasi Lengkap**:
- `PRODUCTION-MIGRATION-GUIDE.md` - Full documentation
- `backend/src/db/migrations/README.md` - Migration history
- `backend/src/db/migrations/VISUAL-TIMELINE.md` - Visual timeline

🔧 **Migration Files**:
- `backend/migrate-simple.ts` - Main migration script
- `deploy-migration-to-production.sh` - Linux/Mac deploy script
- `deploy-migration-to-production.bat` - Windows deploy script

## Emergency Contact

❌ **Jika Ada Error**:
1. STOP migration
2. Screenshot error
3. Rollback dari backup
4. Check logs: `/var/log/postgresql/postgresql.log`

✅ **Success Indicators**:
- Column type = `numeric` (DECIMAL)
- Total amount sama seperti sebelumnya
- Test invoice bisa dibuat dengan format decimal
- Backend berjalan normal

---
**Last Updated**: 20 Nov 2025  
**Tested**: ✅ Dev environment (5,040 invoices, 100% success)
