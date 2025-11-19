# 🚀 Deployment Guide - Invoice Management System

Complete step-by-step guide to deploy your invoice management system to a VPS server.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Push to GitHub](#push-to-github)
3. [VPS Server Setup](#vps-server-setup)
4. [Clone & Configure](#clone--configure)
5. [Nginx Reverse Proxy](#nginx-reverse-proxy)
6. [SSL Certificate (HTTPS)](#ssl-certificate-https)
7. [Deploy Application](#deploy-application)
8. [Verification](#verification)
9. [Maintenance](#maintenance)

---

## 1. Prerequisites

### ✅ What You Need:

**On Your Local Machine:**

- Git installed
- Access to your GitHub account

**On Your VPS Server:**

- Ubuntu 20.04+ (or similar Linux distribution)
- Root or sudo access
- Domain name pointing to your VPS IP (optional but recommended)
- Minimum 1GB RAM, 1 CPU core
- Open ports: 80 (HTTP), 443 (HTTPS), 22 (SSH)

---

## 2. Push to GitHub

### Step 1: Check Git Status

```bash
cd c:\Users\afati\Cloud-Drive\server\invoice-web
git status
```

### Step 2: Stage All Changes

```bash
git add .
```

### Step 3: Commit Your Changes

```bash
git commit -m "Production ready: security fixes, database indexes, and optimizations"
```

### Step 4: Push to GitHub

```bash
git push origin master
```

**If you encounter authentication issues:**

```bash
# Use personal access token (recommended)
git push https://YOUR_TOKEN@github.com/cnotgate/thoyba-invoice-web.git master
```

---

## 3. VPS Server Setup

### Step 1: Connect to Your VPS

```bash
ssh root@your-vps-ip
# or
ssh username@your-vps-ip
```

### Step 2: Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 3: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (optional)
sudo usermod -aG docker $USER
```

### Step 4: Install Docker Compose

```bash
# Install docker compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker compose
sudo chmod +x /usr/local/bin/docker compose

# Verify installation
docker --version
docker compose --version
```

### Step 5: Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 4. Clone & Configure

### Step 1: Clone Repository

```bash
cd /var/www
sudo git clone https://github.com/cnotgate/thoyba-invoice-web.git
cd thoyba-invoice-web
```

### Step 2: Set Permissions

```bash
sudo chown -R $USER:$USER /var/www/thoyba-invoice-web
chmod +x deploy.sh
```

### Step 3: Configure Environment Variables

The `.env` file has already been created with secure passwords. **Verify it exists:**

```bash
cat .env
```

You should see:

```
JWT_SECRET=O31RJ3J1cmEwWVNELG5yUmF5MmNhe3NkSGl3e1wiWiUqWlB7ZX1KRTk3MVM1KUV3N0IpNlFPLipoO0oncylGJA==
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=THIvTjc3dHl8KF9kKSdPXUZRaF5mQjUoKF1IRyJhUXk=
DB_NAME=invoice_db
```

---

## 5. Nginx Reverse Proxy

### Step 1: Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/invoice-app
```

**Paste this configuration (adjust `your-domain.com`):**

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect all HTTP to HTTPS (after SSL is set up)
    # return 301 https://$server_name$request_uri;

    # Proxy everything to Docker nginx container (port 8600)
    # The nginx container handles routing to frontend and backend internally
    location / {
        proxy_pass http://localhost:8600;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Logging
    access_log /var/log/nginx/invoice-app-access.log;
    error_log /var/log/nginx/invoice-app-error.log;
}
```

**Note:** The nginx container (port 8600) internally handles:
- Frontend serving (SolidJS SPA)
- API routing to backend (`/api` → backend:3001)
- Health checks (`/health` → backend:3001)

You only need to expose and proxy to port **8600**. Ports 3000 (frontend) and 3001 (backend) remain internal to the Docker network.
```

### Step 2: Enable the Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/invoice-app /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

## 6. SSL Certificate (HTTPS)

### Option A: Using Certbot (Let's Encrypt) - **RECOMMENDED**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow the prompts and certbot will automatically configure HTTPS
```

**Certbot will:**

- Generate SSL certificates
- Update your nginx config automatically
- Set up auto-renewal

**Verify auto-renewal:**

```bash
sudo certbot renew --dry-run
```

### Option B: Manual SSL Certificate

If you already have SSL certificates, place them in `/etc/ssl/`:

```bash
sudo mkdir -p /etc/ssl/invoice-app
sudo cp your-certificate.crt /etc/ssl/invoice-app/
sudo cp your-private-key.key /etc/ssl/invoice-app/
```

Then update nginx config:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/ssl/invoice-app/your-certificate.crt;
    ssl_certificate_key /etc/ssl/invoice-app/your-private-key.key;

    # ... rest of config
}
```

---

## 7. Deploy Application

### Step 1: Build & Start with Docker Compose

```bash
cd /var/www/thoyba-invoice-web

# Build and start all containers
sudo docker compose up -d --build
```

**This will:**

- Build frontend (SolidJS app)
- Build backend (Bun server)
- Start PostgreSQL database
- Apply database migrations
- Create database indexes

### Step 2: Check Container Status

```bash
sudo docker compose ps
```

You should see 3 containers running:

- `invoice-web-frontend`
- `invoice-web-backend`
- `invoice-web-postgres`

### Step 3: View Logs (if needed)

```bash
# All containers
sudo docker compose logs -f

# Specific container
sudo docker compose logs -f backend
sudo docker compose logs -f frontend
sudo docker compose logs -f postgres
```

---

## 8. Verification

### ✅ Checklist:

1. **Check Nginx Status:**

   ```bash
   sudo systemctl status nginx
   ```

2. **Check Docker Containers:**

   ```bash
   sudo docker compose ps
   ```

3. **Test HTTP Access:**

   ```bash
   curl http://localhost:8600
   curl http://localhost:3001/health
   ```

4. **Test Public Access:**

   - Open browser: `http://your-domain.com`
   - You should see the invoice input form

5. **Test Login:**

   - Navigate to: `http://your-domain.com/login`
   - Login with: `admin` / `admin123`

6. **Test HTTPS (if configured):**
   - Open: `https://your-domain.com`
   - Verify SSL certificate in browser

---

## 9. Maintenance

### 🔄 Update Application

```bash
cd /var/www/thoyba-invoice-web

# Pull latest changes
git pull origin master

# Rebuild and restart
sudo docker compose down
sudo docker compose up -d --build
```

### 📊 Database Backup

```bash
# Backup database
sudo docker compose exec postgres pg_dump -U postgres invoice_db > backup_$(date +%Y%m%d).sql

# Restore database
sudo docker compose exec -T postgres psql -U postgres invoice_db < backup_20250119.sql
```

### 📝 View Logs

```bash
# Application logs
sudo docker compose logs -f

# Nginx logs
sudo tail -f /var/log/nginx/invoice-app-access.log
sudo tail -f /var/log/nginx/invoice-app-error.log
```

### 🔄 Restart Services

```bash
# Restart docker containers
sudo docker compose restart

# Restart nginx
sudo systemctl restart nginx
```

### 🛑 Stop Application

```bash
sudo docker compose down
```

### 🚀 Start Application

```bash
sudo docker compose up -d
```

---

## 🆘 Troubleshooting

### Issue: Cannot connect to database

**Solution:**

```bash
# Check database is running
sudo docker compose ps postgres

# Check database logs
sudo docker compose logs postgres

# Restart database
sudo docker compose restart postgres
```

### Issue: Port already in use

**Solution:**

```bash
# Find process using port 3001 or 8600
sudo lsof -i :3001
sudo lsof -i :8600

# Kill the process
sudo kill -9 <PID>
```

### Issue: Nginx 502 Bad Gateway

**Solution:**

```bash
# Check if containers are running
sudo docker compose ps

# Check nginx error logs
sudo tail -f /var/log/nginx/invoice-app-error.log

# Restart all services
sudo docker compose restart
sudo systemctl restart nginx
```

### Issue: SSL certificate not working

**Solution:**

```bash
# Check certbot status
sudo certbot certificates

# Renew certificates manually
sudo certbot renew

# Check nginx SSL config
sudo nginx -t
```

---

## 🔒 Security Best Practices

1. **Change default passwords immediately**
2. **Keep system updated:** `sudo apt update && sudo apt upgrade`
3. **Enable firewall:**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```
4. **Set up fail2ban** to prevent brute force attacks
5. **Regular backups** of database
6. **Monitor logs** for suspicious activity
7. **Update SSL certificates** before expiry

---

## 📞 Support

If you encounter issues:

1. Check logs: `sudo docker compose logs`
2. Verify environment variables: `cat .env`
3. Check nginx config: `sudo nginx -t`
4. Review this guide step by step

---

## ✅ Deployment Complete!

Your invoice management system should now be live at:

- **Public URL:** `https://your-domain.com`
- **Admin Login:** `https://your-domain.com/login`

**Default credentials:**

- Admin: `admin` / `admin123`
- User: `user` / `user123`

**🎉 Congratulations! Your application is now in production!**
