# Invoice CV. Amlaza Baraka - Modern Stack

Modern, high-performance invoice management system built with **SolidJS**, **Bun**, **Hono**, and **PostgreSQL**.

## 🚀 Technology Stack

### Frontend

- **SolidJS** - Fine-grained reactive UI framework
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first CSS
- **Vite** - Lightning-fast build tool
- **Solid Router** - Client-side routing

### Backend

- **Bun** - Ultra-fast JavaScript runtime
- **Hono** - Lightweight web framework
- **Drizzle ORM** - Type-safe database queries
- **PostgreSQL** - Robust relational database
- **JWT** - Secure authentication

### Infrastructure

- **Docker & Docker Compose** - Containerization
- **Nginx** - Reverse proxy
- **Multi-container architecture**

## 📦 Project Structure

```
invoice-web/
├── backend/          # Bun + Hono backend
│   ├── src/
│   │   ├── index.ts     # Main server
│   │   ├── db/          # Database schema & client
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Auth & CORS
│   │   └── utils/       # JWT, password utils
│   ├── scripts/         # Seed data
│   └── package.json
│
├── frontend/        # SolidJS frontend
│   ├── src/
│   │   ├── App.tsx      # Main app component
│   │   ├── index.tsx    # Entry point
│   │   ├── routes/      # Page components
│   │   ├── components/  # Reusable UI components
│   │   ├── stores/      # State management
│   │   ├── services/    # API calls
│   │   └── types/       # TypeScript types
│   └── package.json
│
├── nginx/           # Nginx configuration
├── docker-compose.yml
├── deploy.bat    # Windows deployment script
└── deploy.sh     # Linux/Mac deployment script
```

## ⚡ Quick Start

### Prerequisites

- **Docker** and **Docker Compose** installed
- **Bun** (optional, for local development)
- **Node.js 18+** (optional, for frontend development)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd invoice-web
```

### 2. Configure Environment

```bash
# Copy example environment file
copy .env.example .env     # Windows
cp .env.example .env       # Linux/Mac

# Edit .env and set your JWT_SECRET
# Generate with: openssl rand -base64 32
```

### 3. Deploy with Docker

**Windows:**

```cmd
deploy.bat
```

**Linux/Mac:**

```bash
chmod +x deploy.sh
./deploy.sh
```

### 4. Access the Application

- **Frontend:** http://localhost:8600
- **API Health:** http://localhost:8600/health

### Default Credentials

```
Admin: admin / admin123
User:  user / user123
```

## 🛠️ Development

### Backend Development

```bash
cd backend

# Install dependencies
bun install

# Generate database migrations
bun run db:generate

# Run migrations
bun run db:migrate

# Seed database
bun run db:seed

# Start development server
bun run dev
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🗄️ Database

### Schema

**Tables:**

- `users` - Admin/user accounts
- `suppliers` - Supplier list (52 companies)
- `invoices` - Invoice records

### Database Operations

```bash
# Connect to PostgreSQL
docker-compose -f docker-compose.yml exec postgres psql -U postgres -d invoice_db

# Backup database
docker-compose -f docker-compose.yml exec postgres pg_dump -U postgres invoice_db > backup.sql

# Restore database
docker-compose -f docker-compose.yml exec -T postgres psql -U postgres invoice_db < backup.sql

# View logs
docker-compose -f docker-compose.yml logs postgres
```

## 🔐 API Endpoints

### Public Endpoints

- `POST /api/invoices` - Create new invoice
- `GET /api/suppliers/list` - Get supplier list

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Create new user (admin only)

### Protected Endpoints (Requires JWT)

- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/paginated` - Get paginated invoices
- `PATCH /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `GET /api/suppliers` - Get all suppliers (with details)
- `POST /api/suppliers` - Create supplier
- `DELETE /api/suppliers/:id` - Delete supplier
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `DELETE /api/users/:id` - Delete user

## 🎨 Features

### Frontend (Public)

- ✅ Invoice input form with validation
- ✅ Searchable supplier dropdown
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Toast notifications

### Admin Dashboard

- ✅ Secure JWT authentication
- ✅ View all invoices
- ✅ Search and filter invoices
- ✅ Toggle payment status
- ✅ Delete invoices
- ✅ Statistics dashboard
- ✅ Real-time updates

## 🐳 Docker Commands

```bash
# Start services
docker-compose -f docker-compose.yml up -d

# View logs
docker-compose -f docker-compose.yml logs -f

# Stop services
docker-compose -f docker-compose.yml down

# Rebuild containers
docker-compose -f docker-compose.yml up --build -d

# Remove volumes (caution: deletes data)
docker-compose -f docker-compose.yml down -v

# Execute commands in backend
docker-compose -f docker-compose.yml exec backend bun run <script>

# Access backend shell
docker-compose -f docker-compose.yml exec backend sh
```

## 📊 Performance Benefits

| Metric          | Original Stack | Modern Stack    | Improvement           |
| --------------- | -------------- | --------------- | --------------------- |
| **Runtime**     | Node.js        | Bun             | **3-4x faster**       |
| **Frontend**    | Vanilla JS     | SolidJS         | **Better reactivity** |
| **Database**    | JSON file      | PostgreSQL      | **ACID compliance**   |
| **Type Safety** | None           | Full TypeScript | **Fewer bugs**        |
| **Build Time**  | N/A            | Vite            | **Instant HMR**       |

## 🔧 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose -f docker-compose.yml ps

# View PostgreSQL logs
docker-compose -f docker-compose.yml logs postgres

# Restart PostgreSQL
docker-compose -f docker-compose.yml restart postgres
```

### Frontend Not Loading

```bash
# Check frontend logs
docker-compose -f docker-compose.yml logs frontend

# Rebuild frontend
docker-compose -f docker-compose.yml up --build frontend
```

### Backend API Errors

```bash
# Check backend logs
docker-compose -f docker-compose.yml logs backend

# Restart backend
docker-compose -f docker-compose.yml restart backend
```

## 🚀 Production Deployment

### 1. Update Environment Variables

```bash
# Generate secure JWT secret
openssl rand -base64 32

# Update .env file with production values
JWT_SECRET=<your-generated-secret>
DB_PASSWORD=<secure-password>
```

### 2. Configure Domain

Update `nginx/nginx.conf` with your domain:

```nginx
server_name your-domain.com;
```

### 3. Enable HTTPS

Add SSL certificates to nginx configuration or use reverse proxy (Cloudflare, Caddy, etc.)

### 4. Deploy

```bash
docker-compose -f docker-compose.yml up -d --build
```

## 📝 Migration from Old Stack

To migrate data from the old JSON-based system:

1. Export existing `db.json` data
2. Transform to SQL format
3. Import using: `docker-compose -f docker-compose.yml exec -T postgres psql -U postgres invoice_db < data.sql`

Or create a custom migration script.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **SolidJS** - Amazing reactive framework
- **Bun** - Game-changing JavaScript runtime
- **Hono** - Lightweight and fast web framework
- **PostgreSQL** - Rock-solid database

---

**Built with ❤️ for CV. Amlaza Baraka**
