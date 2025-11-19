# Invoice Management System

Modern invoice tracking and management system with admin dashboard.

## 🚀 Quick Start

Deploy the entire system with one command:

```bash
# Windows
deploy.bat

# Linux/Mac
./deploy.sh
```

Access the application at: **http://localhost:8600**

## 📚 Documentation

- **[README-MODERN.md](README-MODERN.md)** - Complete documentation (start here!)
- **[QUICK-SETUP.md](QUICK-SETUP.md)** - 5-minute setup guide
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture with diagrams

## 🎯 Features

✅ **Public Invoice Form** - Anyone can submit invoices  
✅ **Admin Dashboard** - Manage all invoices with authentication  
✅ **Search & Filter** - Find invoices quickly  
✅ **Payment Tracking** - Mark invoices as paid/unpaid  
✅ **Dark Mode** - Easy on the eyes  
✅ **Responsive Design** - Works on all devices  
✅ **Type-Safe** - Full TypeScript support

## 🛠️ Technology Stack

### Frontend

- **SolidJS** - Reactive UI framework (faster than React)
- **TypeScript** - Type safety
- **TailwindCSS** - Modern styling
- **Vite** - Lightning-fast builds

### Backend

- **Bun** - Ultra-fast JavaScript runtime (3-4x faster than Node.js)
- **Hono** - Lightweight web framework
- **PostgreSQL** - Reliable relational database
- **Drizzle ORM** - Type-safe database queries
- **JWT** - Secure authentication

### Infrastructure

- **Docker** - Containerized deployment
- **Nginx** - Reverse proxy
- **Docker Compose** - Multi-container orchestration

## 📁 Project Structure

```
invoice-web/
├── backend/         # Bun + Hono backend
├── frontend/        # SolidJS frontend
├── nginx/           # Nginx configuration
├── legacy/              # Original system files (archived)
├── deploy.bat    # Windows deployment
├── deploy.sh     # Linux/Mac deployment
└── docker-compose.yml
```

## 🔐 Default Credentials

After deployment, login with:

- **Admin**: `admin` / `admin123`
- **User**: `user` / `user123`

> ⚠️ Change these credentials in production!

## 📊 Performance

- **Backend**: 3-4x faster than Node.js
- **Frontend**: 60% less JavaScript bundle size
- **Database**: PostgreSQL with connection pooling
- **Build Time**: 2-3x faster with Bun

## 🗂️ Legacy System

The original system (vanilla JS + Node.js + json-server) has been moved to the `legacy/` directory.

See [legacy/LEGACY-INFO.md](legacy/LEGACY-INFO.md) for more information.

## 🚢 Deployment

### Development Mode

```bash
# Backend (with hot reload)
cd backend
bun install
bun run dev

# Frontend (with hot reload)
cd frontend
npm install
npm run dev
```

### Production Mode (Docker)

```bash
# One command deployment
deploy.bat   # Windows
./deploy.sh  # Linux/Mac

# Or manually
docker-compose -f docker-compose.yml up --build -d
```

## 📝 Common Commands

```bash
# View logs
docker-compose -f docker-compose.yml logs -f

# Stop containers
docker-compose -f docker-compose.yml down

# Restart containers
docker-compose -f docker-compose.yml restart

# Database migrations
cd backend
bun run db:migrate

# Seed database
bun run db:seed
```

## 🆘 Troubleshooting

### Port Already in Use

```bash
# Check what's using port 8600
netstat -ano | findstr :8600

# Stop existing containers
docker-compose -f docker-compose.yml down
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps

# View database logs
docker logs invoice-postgres
```

### Frontend Build Errors

```bash
# Clear cache and rebuild
cd frontend
rm -rf node_modules dist
npm install
npm run build
```

## 🔗 API Endpoints

### Public Endpoints

- `POST /api/invoices` - Create invoice
- `GET /api/suppliers/list` - Get suppliers

### Protected Endpoints (require JWT)

- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/paginated` - Get paginated invoices with stats
- `PATCH /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice

See [README-MODERN.md](README-MODERN.md) for complete API documentation.

## 🤝 Contributing

This is a modernized invoice management system. For questions or issues:

1. Check the documentation in [README-MODERN.md](README-MODERN.md)
2. Review [ARCHITECTURE.md](ARCHITECTURE.md) for system design
3. See [COMPARISON.md](COMPARISON.md) for legacy vs modern differences

## 📄 License

This project is for internal use.

---

**Quick Links:**

- [Complete Documentation](README-MODERN.md)
- [Quick Setup Guide](QUICK-SETUP.md)
- [System Architecture](ARCHITECTURE.md)
- [Legacy System Info](legacy/LEGACY-INFO.md)
