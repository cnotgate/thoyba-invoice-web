# System Architecture - Modern Stack

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    User's Browser                            │
│                  http://localhost:8600                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Nginx Reverse Proxy                         │
│                      Port 80                                 │
│  Routes:                                                     │
│    / → Frontend (SPA)                                       │
│    /api/* → Backend API                                     │
└─────────┬─────────────────────────┬──────────────────────────┘
          │                         │
          ▼                         ▼
┌──────────────────────┐  ┌──────────────────────────────────┐
│  Frontend Container  │  │     Backend Container            │
│    SolidJS + Vite    │  │      Bun + Hono                 │
│      Port 80         │  │      Port 3001                   │
│                      │  │                                  │
│  - Home page         │  │  API Endpoints:                  │
│  - Login page        │  │  - POST /api/auth/login          │
│  - Admin dashboard   │  │  - GET /api/invoices            │
│  - Dark mode         │  │  - POST /api/invoices            │
│  - Responsive UI     │  │  - GET /api/suppliers/list       │
└──────────────────────┘  └──────────┬───────────────────────┘
                                     │
                                     ▼
                          ┌────────────────────────┐
                          │  PostgreSQL Container  │
                          │      Port 5432         │
                          │                        │
                          │  Tables:               │
                          │  - users               │
                          │  - invoices            │
                          │  - suppliers           │
                          │                        │
                          │  Volume:               │
                          │  postgres_data         │
                          └────────────────────────┘
```

## Container Details

### 1. Nginx Container

```
Name: invoice-nginx
Image: nginx:alpine
Port: 8600:80
Role: Reverse proxy and load balancer
```

### 2. Frontend Container

```
Name: invoice-frontend
Build: frontend/Dockerfile
Tech: SolidJS + TypeScript + TailwindCSS
Build Tool: Vite
Output: Static files served by nginx
```

### 3. Backend Container

```
Name: invoice-backend
Build: backend/Dockerfile
Tech: Bun + Hono + Drizzle ORM
Runtime: Bun (3-4x faster than Node.js)
Environment:
  - PORT=3001
  - DB_HOST=postgres
  - JWT_SECRET=<from .env>
```

### 4. PostgreSQL Container

```
Name: invoice-postgres
Image: postgres:16-alpine
Port: 5432
Volume: postgres_data (persistent)
Environment:
  - POSTGRES_DB=invoice_db
  - POSTGRES_USER=postgres
  - POSTGRES_PASSWORD=postgres
```

## Data Flow

### 1. User Creates Invoice (Public)

```
User fills form
      │
      ▼
[Frontend] Validates input
      │
      ▼
POST /api/invoices
      │
      ▼
[Backend] Receives request
      │
      ▼
[Backend] Inserts to PostgreSQL
      │
      ▼
[Database] Stores invoice
      │
      ▼
[Backend] Returns success
      │
      ▼
[Frontend] Shows success toast
      │
      ▼
Form resets
```

### 2. Admin Login Flow

```
User enters credentials
      │
      ▼
[Frontend] POST /api/auth/login
      │
      ▼
[Backend] Queries users table
      │
      ▼
[Backend] Verifies password (bcrypt)
      │
      ▼
[Backend] Generates JWT token
      │
      ▼
[Backend] Returns token + user info
      │
      ▼
[Frontend] Stores token in localStorage
      │
      ▼
[Frontend] Redirects to /admin
```

### 3. Admin Views Invoices

```
Admin navigates to /admin
      │
      ▼
[Frontend] Checks auth token
      │
      ▼
GET /api/invoices
Headers: Authorization: Bearer <token>
      │
      ▼
[Backend] Validates JWT token
      │
      ▼
[Backend] Queries invoices table
      │
      ▼
[Backend] Returns invoice list
      │
      ▼
[Frontend] Renders table
      │
      ▼
User sees all invoices
```

## Network Architecture

```
invoice-network (bridge)
    │
    ├── postgres (postgres:5432)
    │
    ├── backend (backend:3001)
    │    └── connects to → postgres:5432
    │
    ├── frontend (frontend:80)
    │
    └── nginx (0.0.0.0:8600 → 80)
         ├── / → frontend:80
         └── /api → backend:3001
```

## Volume Mapping

```
Host System
    │
    ├── backend/ → Built into backend container
    │
    ├── frontend/ → Built into frontend container
    │
    └── Docker Volume: postgres_data
         └── Mapped to → /var/lib/postgresql/data
                          (inside postgres container)
```

## Development vs Production

### Development Mode

```
Host Machine
    │
    ├── backend/ (source code)
    │    └── bun run dev (watches files)
    │        └── localhost:3001
    │
    └── frontend/ (source code)
         └── npm run dev (Vite dev server)
             └── localhost:3000
                  └── Proxies /api → localhost:3001
```

### Production Mode (Docker)

```
Docker Compose
    │
    ├── Build backend → Bun + compiled TS
    │    └── Runs in container
    │
    ├── Build frontend → Vite build → static files
    │    └── Served by nginx
    │
    └── Nginx routes everything
         └── Single entry point: localhost:8600
```

## Security Layers

```
1. Network Level
   └── Docker bridge network (isolated)

2. Authentication Level
   ├── JWT tokens (24h expiry)
   ├── Bcrypt password hashing
   └── Middleware protection

3. Database Level
   ├── Drizzle ORM (SQL injection protection)
   ├── Type-safe queries
   └── Connection pooling

4. Application Level
   ├── TypeScript (type safety)
   ├── Input validation
   └── CORS configuration
```

## Scaling Strategy

### Horizontal Scaling (Multiple Instances)

```
                Load Balancer
                      │
        ┌─────────────┼─────────────┐
        │             │             │
    Backend 1    Backend 2    Backend 3
        └─────────────┼─────────────┘
                      │
                PostgreSQL
              (with replication)
```

### Vertical Scaling (Resource Increase)

```
docker compose.yml:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

## Monitoring Points

```
1. Nginx
   └── Access logs, error logs

2. Backend
   ├── API response times
   ├── Database query performance
   └── Error rates

3. PostgreSQL
   ├── Connection count
   ├── Query performance
   └── Storage usage

4. System
   ├── CPU usage
   ├── Memory usage
   └── Network I/O
```

## Deployment Pipeline

```
1. Code Changes
      │
      ▼
2. Git Commit
      │
      ▼
3. Run deploy.bat
      │
      ▼
4. Docker builds images
      │
      ▼
5. Database migrations
      │
      ▼
6. Start all containers
      │
      ▼
7. Application ready!
```

## File Structure Mapping

```
Project Root
│
├── backend/         → Backend container
│   ├── src/            → Compiled with Bun
│   └── Dockerfile      → Build instructions
│
├── frontend/        → Frontend container
│   ├── src/            → Built with Vite
│   ├── dist/           → Static output
│   └── Dockerfile      → Build + nginx config
│
├── nginx/
│   └── nginx.conf      → Copied to nginx container
│
└── docker compose.yml  → Orchestrates everything
```

## Technology Stack Map

```
Frontend Layer:
  ├── SolidJS (UI framework)
  ├── TypeScript (type safety)
  ├── TailwindCSS (styling)
  ├── Vite (build tool)
  └── Solid Router (routing)

Backend Layer:
  ├── Bun (runtime)
  ├── Hono (web framework)
  ├── Drizzle ORM (database)
  ├── TypeScript (type safety)
  ├── jose (JWT)
  └── bcrypt (passwords)

Database Layer:
  ├── PostgreSQL 16
  ├── Persistent volume
  └── ACID compliance

Infrastructure:
  ├── Docker
  ├── Docker Compose
  └── Nginx
```

---

This architecture provides:
✅ **Scalability** - Can grow with your needs
✅ **Security** - Multiple layers of protection
✅ **Performance** - Optimized at every level
✅ **Maintainability** - Clear separation of concerns
✅ **Reliability** - Containerized and isolated
