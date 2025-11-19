# Quick Deployment Summary

## 🎯 You're Ready to Deploy!

### What We've Done:

✅ **Fixed frontend Dockerfile** - Node 18 → Node 20 (resolved 3 high-severity vulnerabilities)  
✅ **Created secure `.env` file** - Strong cryptographic passwords  
✅ **Added database indexes** - Optimized query performance  
✅ **HTTPS/SSL** - Will be configured on your nginx server

---

## 📝 Quick Steps to Deploy

### 1. Push to GitHub (5 minutes)

```bash
cd c:\Users\afati\Cloud-Drive\server\invoice-web
git add .
git commit -m "Production ready: security fixes and optimizations"
git push origin master
```

### 2. On Your VPS Server (30-45 minutes)

**Install Docker & Nginx:**

```bash
# Connect to VPS
ssh root@your-server-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker compose
sudo chmod +x /usr/local/bin/docker compose

# Install Nginx
sudo apt install nginx -y
```

**Clone & Deploy:**

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/cnotgate/thoyba-invoice-web.git
cd thoyba-invoice-web

# Deploy
sudo docker compose up -d --build
```

### 3. Configure Nginx (10 minutes)

Create `/etc/nginx/sites-available/invoice-app`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Proxy all requests to Docker nginx container
    # The container handles frontend + API routing internally
    location / {
        proxy_pass http://localhost:8600;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Note:** Port 8600 is the nginx container that routes traffic to frontend (port 3000) and backend (port 3001) internally.

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/invoice-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Setup SSL (5 minutes)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d your-domain.com

# Certbot will configure HTTPS automatically!
```

---

## ✅ Done!

Your app is now live at:

- **Public:** `https://your-domain.com`
- **Admin:** `https://your-domain.com/login`

**Default Login:**

- Admin: `admin` / `admin123`
- User: `user` / `user123`

---

## 📚 Full Documentation

For detailed step-by-step instructions, see:
**[DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)**

---

## 🆘 Quick Troubleshooting

**Check if app is running:**

```bash
sudo docker compose ps
```

**View logs:**

```bash
sudo docker compose logs -f
```

**Restart everything:**

```bash
sudo docker compose restart
sudo systemctl restart nginx
```

---

## 🔧 Useful Commands

```bash
# Update app
git pull origin master
sudo docker compose down
sudo docker compose up -d --build

# Backup database
sudo docker compose exec postgres pg_dump -U postgres invoice_db > backup.sql

# View nginx logs
sudo tail -f /var/log/nginx/invoice-app-access.log
```

---

**🎉 Total Time: ~1 hour** (including SSL setup)

Good luck with your deployment! 🚀
