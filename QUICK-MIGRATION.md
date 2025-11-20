# 🚀 Quick Migration Guide - TL;DR

## Cara Tercepat (Recommended) - Docker

### Script Otomatis (PALING MUDAH):

#### Linux/Mac:

```bash
chmod +x deploy-migration-docker.sh
./deploy-migration-docker.sh
```

#### Windows:

```cmd
deploy-migration-docker.bat
```

### Manual Steps (Jika Prefer Manual):

```bash
# 1. Backup dulu!
docker exec invoice-postgres pg_dump -U postgres invoice_db > backup_$(date +%Y%m%d).sql

# 2. Copy script ke container
docker cp backend/migrate-simple.ts invoice-backend:/app/migrate-simple.ts

# 3. Stop backend
docker-compose stop backend

# 4. Run migration
docker-compose run --rm backend bun run /app/migrate-simple.ts

# 5. Start backend
docker-compose start backend

# 6. Test
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -d '{"supplier":"Test","branch":"Kuripan","date":"2025-11-20","invoiceNumber":"TEST-001","total":"5000000.00"}'
```

## Rollback (Jika Ada Masalah)

```bash
docker-compose stop backend
docker exec invoice-postgres psql -U postgres invoice_db < backup_YYYYMMDD.sql
docker-compose start backend
```

## Verifikasi Cepat

```bash
# Check column type
docker exec invoice-postgres psql -U postgres -d invoice_db -c "\d invoices"

# Check total masih sama
docker exec invoice-postgres psql -U postgres -d invoice_db -c "SELECT COUNT(*), SUM(total) FROM invoices"
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
