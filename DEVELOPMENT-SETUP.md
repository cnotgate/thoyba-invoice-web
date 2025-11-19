# Development Setup - Windows

This guide will help you set up the invoice management system for local development on Windows.

## Prerequisites

### 1. Install Bun (JavaScript Runtime)

Bun is required for the backend. Install it via PowerShell:

```powershell
# Open PowerShell as Administrator and run:
powershell -c "irm bun.sh/install.ps1 | iex"
```

After installation, restart your terminal and verify:

```bash
bun --version
```

**Alternative:** Download from [bun.sh](https://bun.sh) if the script doesn't work.

### 2. Install Node.js and npm

Node.js is required for the frontend build tools.

1. Download from [nodejs.org](https://nodejs.org/) (LTS version recommended)
2. Install and verify:

```bash
node --version
npm --version
```

### 3. Install PostgreSQL (Database)

**Option A: Install PostgreSQL Locally**

1. Download from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
2. Install with default settings
3. Remember the password you set for the `postgres` user
4. Verify installation:

```bash
psql --version
```

**Option B: Use Docker (Recommended)**

1. Install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
2. Start Docker Desktop
3. Run PostgreSQL container:

```bash
docker run -d ^
  --name invoice-postgres ^
  -e POSTGRES_USER=postgres ^
  -e POSTGRES_PASSWORD=postgres ^
  -e POSTGRES_DB=invoice_db ^
  -p 5432:5432 ^
  postgres:16-alpine
```

## Project Setup

### Step 1: Clone/Navigate to Project

```bash
cd C:\Users\afati\Cloud-Drive\server\invoice-web
```

### Step 2: Setup Environment Variables

Create a `.env` file in the project root:

```bash
copy .env.example .env
```

Edit `.env` and set a secure JWT secret:

```env
JWT_SECRET=your-super-secure-jwt-secret-here
NODE_ENV=development
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=invoice_db
```

**Generate a secure JWT secret:**

```bash
# PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

### Step 3: Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
bun install

# Generate database migrations
bun run db:generate

# Run migrations to create tables
bun run db:migrate

# Seed database with initial data (52 suppliers + 2 users)
bun run db:seed

# Start development server with hot reload
bun run dev
```

Backend will run at: **http://localhost:3001**

### Step 4: Frontend Setup (New Terminal)

Open a new terminal/command prompt:

```bash
# Navigate to frontend
cd C:\Users\afati\Cloud-Drive\server\invoice-web\frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run at: **http://localhost:3000**

## Development Workflow

### Running the Application

You need **3 terminals** running simultaneously:

**Terminal 1: Database (if using Docker)**

```bash
docker start invoice-postgres
```

**Terminal 2: Backend**

```bash
cd backend
bun run dev
```

**Terminal 3: Frontend**

```bash
cd frontend
npm run dev
```

### Access Points

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Database:** localhost:5432

### Default Login Credentials

After seeding the database:

- **Admin:** `admin` / `admin123`
- **User:** `user` / `user123`

## Common Development Commands

### Backend Commands

```bash
cd backend

# Development with hot reload
bun run dev

# Build for production
bun run build

# Run production build
bun run start

# Database operations
bun run db:generate    # Generate new migrations from schema changes
bun run db:migrate     # Apply migrations
bun run db:seed        # Seed database with initial data
bun run db:push        # Push schema changes directly (dev only)
```

### Frontend Commands

```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check
```

## Database Management

### Connect to PostgreSQL

**Using psql:**

```bash
psql -h localhost -U postgres -d invoice_db
```

**Using Docker:**

```bash
docker exec -it invoice-postgres psql -U postgres -d invoice_db
```

### Common SQL Queries

```sql
-- View all tables
\dt

-- View all suppliers
SELECT * FROM suppliers;

-- View all invoices
SELECT * FROM invoices ORDER BY timestamp DESC LIMIT 10;

-- View all users
SELECT id, username, role FROM users;

-- Exit psql
\q
```

### Reset Database

If you need to start fresh:

```bash
cd backend

# Drop and recreate (careful - deletes all data!)
psql -h localhost -U postgres -d invoice_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Re-run migrations and seed
bun run db:migrate
bun run db:seed
```

## Troubleshooting

### Issue: "Bun command not found"

**Solution:** Restart your terminal after installing Bun, or add to PATH manually:

```
C:\Users\<YourUsername>\.bun\bin
```

### Issue: "Cannot connect to PostgreSQL"

**Solutions:**

1. Check if PostgreSQL is running:

   - **Local install:** Check Services (services.msc)
   - **Docker:** `docker ps` (should show invoice-postgres)

2. Verify connection settings in `.env` file

3. Check if port 5432 is available:
   ```bash
   netstat -ano | findstr :5432
   ```

### Issue: "Port 3000 or 3001 already in use"

**Solution:** Kill the process or change the port:

```bash
# Find process using port
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

Or change port in:

- Backend: `.env` (PORT=3001)
- Frontend: `frontend/vite.config.ts` (server.port)

### Issue: Database migration errors

**Solution:**

```bash
cd backend

# Check current migration status
bun run db:push

# If schema is out of sync, regenerate migrations
bun run db:generate
bun run db:migrate
```

### Issue: Frontend CORS errors

**Solution:** The backend is configured to allow `localhost:3000`. If you changed the frontend port, update `backend/src/index.ts`:

```typescript
app.use(
	'/*',
	cors({
		origin: ['http://localhost:3000', 'http://localhost:8600'],
		// Add your custom port here
	})
);
```

## IDE Setup (VS Code)

### Recommended Extensions

1. **Bun for Visual Studio Code** - Bun support
2. **TypeScript Vue Plugin (Volar)** - For SolidJS/TSX
3. **Tailwind CSS IntelliSense** - CSS autocomplete
4. **ESLint** - Code linting
5. **Prettier** - Code formatting
6. **PostgreSQL** - Database management

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
	"typescript.tsdk": "node_modules/typescript/lib",
	"editor.formatOnSave": true,
	"editor.defaultFormatter": "esbenp.prettier-vscode",
	"editor.codeActionsOnSave": {
		"source.fixAll.eslint": true
	},
	"[typescript]": {
		"editor.defaultFormatter": "esbenp.prettier-vscode"
	},
	"[typescriptreact]": {
		"editor.defaultFormatter": "esbenp.prettier-vscode"
	}
}
```

## Project Structure

```
invoice-web/
├── backend/              # Bun + Hono backend
│   ├── src/
│   │   ├── db/          # Database schema and client
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Auth middleware
│   │   └── utils/       # Utilities (JWT, password)
│   ├── scripts/
│   │   └── seed.ts      # Database seeding
│   └── drizzle.config.ts
│
├── frontend/             # SolidJS frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── routes/      # Page routes
│   │   ├── stores/      # State management
│   │   ├── services/    # API client
│   │   └── types/       # TypeScript types
│   └── vite.config.ts
│
└── docker-compose.yml    # Production deployment
```

## Making Changes

### Adding a New API Endpoint

1. Create/edit route in `backend/src/routes/`
2. Add route to `backend/src/index.ts`
3. Restart backend: `bun run dev`

### Modifying Database Schema

1. Edit `backend/src/db/schema.ts`
2. Generate migration: `bun run db:generate`
3. Apply migration: `bun run db:migrate`

### Adding a New Frontend Page

1. Create component in `frontend/src/routes/`
2. Add route in `frontend/src/App.tsx`
3. Frontend auto-reloads

## Performance Tips

- **Bun** is much faster than Node.js for the backend
- Use `bun run dev` for hot reload during development
- Frontend uses Vite for instant HMR (Hot Module Replacement)
- Database queries are optimized with Drizzle ORM

## Next Steps

1. ✅ Set up development environment (this guide)
2. 📚 Read API documentation in `README-MODERN.md`
3. 🎨 Customize frontend UI/styling
4. 🔧 Add new features
5. 🚀 Deploy with `deploy.bat` when ready

## Need Help?

- Check `README-MODERN.md` for complete documentation
- See `ARCHITECTURE.md` for system design
- Review API endpoints in backend route files
- Check browser console for frontend errors
- Check terminal for backend errors

---

**Happy Coding! 🚀**
