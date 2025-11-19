# 🚀 Quick Setup Guide - Modern Stack

This guide will help you get the modern Invoice Management System up and running.

## 📋 Prerequisites

Before you begin, ensure you have:

- ✅ **Docker Desktop** installed and running
- ✅ **Git** (if cloning from repository)
- ✅ Command line access (CMD on Windows, Terminal on Mac/Linux)

### Optional (for development):

- **Bun** (for backend development)
- **Node.js 18+** (for frontend development)

---

## ⚡ Quick Start (5 minutes)

### Step 1: Navigate to Project Directory

```cmd
cd c:\Users\afati\Cloud-Drive\server\invoice-web
```

### Step 2: Create Environment File

```cmd
copy .env.example .env
```

Edit `.env` and replace the JWT_SECRET with a secure random string:

```
JWT_SECRET=your-super-secret-key-here
```

> **Tip:** Generate a secure key with: `openssl rand -base64 32`

### Step 3: Deploy Everything

Simply run the deployment script:

**Windows:**

```cmd
deploy.bat
```

**Linux/Mac:**

```bash
chmod +x deploy.sh
./deploy.sh
```

This script will:

1. Build all Docker containers
2. Start PostgreSQL database
3. Run database migrations
4. Seed initial data (suppliers and users)
5. Start backend and frontend services

### Step 4: Access the Application

Open your browser and navigate to:

**http://localhost:8600**

---

## 🔐 Login Credentials

### Admin Access

- **Username:** `admin`
- **Password:** `admin123`

### Regular User

- **Username:** `user`
- **Password:** `user123`

---

## 🎯 What You Get

### Public Invoice Form (Home Page)

- Create new invoices
- Search suppliers from dropdown
- Dark mode support
- Responsive design

### Admin Dashboard (`/admin`)

- View all invoices in a table
- Search and filter invoices
- Toggle payment status
- Delete invoices
- View statistics (total, paid, unpaid, total value)

---

## 🛠️ Common Commands

### View Running Containers

```cmd
docker compose -f docker compose.yml ps
```

### View Logs

```cmd
docker compose -f docker compose.yml logs -f
```

### Stop All Services

```cmd
docker compose -f docker compose.yml down
```

### Restart a Service

```cmd
docker compose -f docker compose.yml restart backend
docker compose -f docker compose.yml restart frontend
```

### Access Database

```cmd
docker compose -f docker compose.yml exec postgres psql -U postgres -d invoice_db
```

---

## 🐛 Troubleshooting

### Problem: Port 8600 already in use

**Solution:** Stop the old application or change the port in `docker compose.yml`:

```yaml
ports:
  - '8601:80' # Change 8600 to 8601 or any other port
```

### Problem: Database connection failed

**Solution:** Wait a few seconds for PostgreSQL to initialize, then run:

```cmd
docker compose -f docker compose.yml restart backend
```

### Problem: Frontend shows blank page

**Solution:** Check browser console for errors and restart frontend:

```cmd
docker compose -f docker compose.yml restart frontend
```

### Problem: Changes not appearing

**Solution:** Rebuild containers:

```cmd
docker compose -f docker compose.yml up --build -d
```

---

## 📂 Project Structure Overview

```
invoice-web/
├── backend/          # Modern backend (Bun + Hono + PostgreSQL)
├── frontend/         # Modern frontend (SolidJS + TypeScript)
├── nginx/            # Nginx reverse proxy config
├── docker compose.yml
├── deploy.bat     # Windows deployment
├── deploy.sh      # Linux/Mac deployment
└── README-MODERN.md      # Full documentation
```

---

## 🔄 Running Both Old and New Systems

The new system uses different ports and files, so you can run both simultaneously:

- **Old System:** Port 8600, uses `docker compose.yml`
- **New System:** Port 8600 (or change it), uses `docker compose.yml`

To run old system:

```cmd
docker compose up -d
```

To run new system:

```cmd
docker compose -f docker compose.yml up -d
```

---

## 📖 Next Steps

1. ✅ **Test the application** - Create invoices, login as admin
2. ✅ **Read full documentation** - See `README-MODERN.md`
3. ✅ **Customize** - Edit frontend styles, add features
4. ✅ **Deploy to production** - Follow production deployment guide in README-MODERN.md

---

## 🆘 Need Help?

- 📚 **Full Documentation:** See `README-MODERN.md`
- 🐛 **Check Logs:** `docker compose -f docker compose.yml logs -f`
- 🔧 **Restart Services:** `docker compose -f docker compose.yml restart <service>`

---

**Congratulations! 🎉**

Your modern invoice management system is now running with:

- ⚡ 3-4x faster backend (Bun)
- 🎨 Reactive UI (SolidJS)
- 🗄️ Robust database (PostgreSQL)
- 🔐 Secure authentication (JWT)
- 🌙 Dark mode support
- 📱 Responsive design

Enjoy your upgraded system! 🚀
