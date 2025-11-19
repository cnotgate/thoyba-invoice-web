# Invoice Management System

Modern, fast, and secure invoice tracking and management system with admin dashboard.

## 🚀 Quick Start

Deploy the entire system with one command:

```bash
# Windows
deploy.bat

# Linux/Mac
./deploy.sh
```

Access the application at: **http://localhost:8600**

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123`

> ⚠️ Change the default password immediately after first login!

---

## 📚 Documentation

- **[DOCUMENTATION.md](DOCUMENTATION.md)** - Complete technical documentation, architecture, API reference, and deployment guide

---

## 🎯 Features

✅ **Public Invoice Form** - Anyone can submit invoices  
✅ **Admin Dashboard** - Manage all invoices with authentication  
✅ **Search & Filter** - Find invoices quickly by number, supplier, status  
✅ **Payment Tracking** - Mark invoices as paid/unpaid  
✅ **Supplier Management** - Add and manage suppliers  
✅ **User Management** - Create and manage admin users  
✅ **Dark Mode** - Easy on the eyes 🌙  
✅ **Responsive Design** - Works on all devices 📱  
✅ **Type-Safe** - Full TypeScript support  
✅ **High Performance** - Stats caching with 10-20x faster dashboard  
✅ **Auto-sync** - Real-time stats updates with PostgreSQL triggers  
✅ **Indonesian Currency Support** - Proper handling of "4.000.000,00" format  

---

## 🛠️ Technology Stack

### Frontend
- **SolidJS** - Reactive UI framework (faster than React)
- **TypeScript** - Type safety
- **TailwindCSS** - Modern styling
- **Vite** - Lightning-fast builds

### Backend
- **Bun** - Ultra-fast JavaScript runtime (3-4x faster than Node.js)
- **Hono** - Lightweight web framework
- **PostgreSQL** - Reliable relational database with stats caching
- **Drizzle ORM** - Type-safe database queries
- **JWT** - Secure authentication

### Infrastructure
- **Docker & Docker Compose** - Containerization
- **Nginx** - Reverse proxy and load balancing
- **SSL/TLS** - HTTPS support via Let's Encrypt

---

## ⚡ Quick Setup (5 Minutes)

### Prerequisites

- ✅ **Docker Desktop** installed and running
- ✅ **Git** (if cloning from repository)
- ✅ Command line access

### Step 1: Clone the Repository

```bash
git clone https://github.com/cnotgate/thoyba-invoice-web.git
cd thoyba-invoice-web
```

### Step 2: Create Environment File

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

Edit `.env` and set a secure JWT secret:

```env
JWT_SECRET=your-super-secret-key-here-change-this
POSTGRES_PASSWORD=your-secure-db-password
```

> 💡 Generate a secure key: `openssl rand -base64 32`

### Step 3: Deploy

**Windows:**
```cmd
deploy.bat
```

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

### Step 4: Access the Application

- **Frontend:** http://localhost:8600
- **API:** http://localhost:8600/api
- **Health Check:** http://localhost:8600/health

**Login with default credentials:**
- Username: `admin`
- Password: `admin123`

---

## 💻 Development

### Backend Development

```bash
cd backend
bun install
bun run dev  # Runs on http://localhost:3001
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev  # Runs on http://localhost:3000
```

### Useful Scripts

```bash
cd backend

# Run migrations
bun run migrate

# Seed database
bun run scripts/seed.ts

# Import legacy data
bun run scripts/import-legacy-invoices.ts

# Force refresh stats cache
bun run scripts/force-update-stats.ts

# Check for duplicates
bun run scripts/check-production-duplicates.ts
```

---

## 🚀 Production Deployment

### Quick Deploy to VPS

```bash
# 1. On local machine - push to GitHub
git push origin master

# 2. On VPS - install Docker
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. Clone and deploy
cd /var/www
sudo git clone https://github.com/cnotgate/thoyba-invoice-web.git
cd thoyba-invoice-web
sudo cp .env.example .env
sudo nano .env  # Edit JWT_SECRET and passwords
sudo docker compose up -d --build
sleep 30
sudo docker compose exec backend bun run scripts/run-stats-migration.ts

# 4. Setup Nginx reverse proxy and SSL
# See DOCUMENTATION.md for complete instructions
```

For complete production deployment guide, see [DOCUMENTATION.md](DOCUMENTATION.md).

---

## 📁 Project Structure

```
invoice-web/
├── backend/                 # Backend API (Bun + Hono)
│   ├── src/
│   │   ├── index.ts        # Main entry point
│   │   ├── db/             # Database layer
│   │   ├── routes/         # API endpoints
│   │   └── middleware/     # Auth middleware
│   └── scripts/            # Utility scripts
│
├── frontend/               # Frontend UI (SolidJS)
│   ├── src/
│   │   ├── routes/         # Page components
│   │   ├── components/     # Reusable components
│   │   ├── stores/         # State management
│   │   └── services/       # API calls
│   └── package.json
│
├── nginx/                  # Nginx configuration
├── docker-compose.yml      # Docker orchestration
├── deploy.bat             # Windows deployment
├── deploy.sh              # Linux/Mac deployment
├── README.md              # This file
└── DOCUMENTATION.md       # Complete technical docs
```

---

## 🔧 Troubleshooting

### Port Already in Use

```bash
# Windows
netstat -ano | findstr :8600
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8600 | xargs kill -9
```

### Database Connection Issues

```bash
docker compose logs db
docker compose restart db
```

### Stats Not Updating

```bash
docker compose exec backend bun run scripts/force-update-stats.ts
```

For more troubleshooting tips, see [DOCUMENTATION.md](DOCUMENTATION.md).

---

## ⚠️ Important Notes

- **Performance:** Stats caching provides 10-20x faster dashboard loading
- **Currency:** Indonesian format (4.000.000,00) is properly supported
- **Security:** Change default passwords immediately after deployment
- **Backup:** Regular database backups recommended

---

## 📝 License

MIT License - Feel free to use this project for personal or commercial purposes.

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a Pull Request.

---

**Built with ❤️ using modern web technologies**
