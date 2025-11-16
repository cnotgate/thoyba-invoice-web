# Invoice CV. Amlaza Baraka Web App

Aplikasi web untuk mengelola invoice CV. Amlaza Baraka dengan frontend terpisah untuk input dan admin.

## Struktur Project

```
invoice-web/
├── frontend/              # Frontend untuk input invoice
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── admin-frontend/        # Frontend admin dashboard
│   ├── login.html
│   ├── login.css
│   ├── login.js
│   ├── admin.html
│   ├── admin.css
│   └── admin.js
├── backend/               # Backend API (JSON Server)
│   ├── db.json            # Database JSON
│   └── package.json
└── README.md              # Dokumentasi ini
```

## Features

### Frontend Input (frontend/)

- Form input invoice dengan validasi
- Pencarian supplier dengan datalist
- Dark mode toggle dengan system preference detection
- Form validation
- Backend integration untuk data persistence

### Admin Dashboard (admin-frontend/)

- **Login Required**: Username: `admin`/`user`, Password: `admin123`/`user123`
- List semua invoice dari database
- **Checkbox untuk status pembayaran**: Centang untuk menandai lunas/belum
- **Sorting**: Berdasarkan tanggal (naik/turun), nama supplier (A-Z/Z-A), status
- **Search**: Cari berdasarkan supplier, nomor faktur, cabang, atau deskripsi
- **Filter**: Semua, sudah dibayar, belum dibayar
- **Statistics**: Total invoice, jumlah lunas/belum, total nilai
- Real-time updates ke backend

## Technologies Used

- HTML5
- CSS3 with CSS Variables for theming
- JavaScript (ES6)
- JSON Server for simple backend

## How to Run

### 1. Jalankan Backend

```bash
cd backend
npm install
npm start
```

Backend akan berjalan di `http://localhost:3001`

### 2. Frontend Input Invoice

Buka file `frontend/index.html` di browser web (Chrome, Firefox, dll.)

Atau gunakan live server extension di VS Code untuk pengalaman yang lebih baik.

### 3. Admin Dashboard

Buka file `admin-frontend/login.html` di browser web, lalu login dengan:

- Username: `admin` atau `user`
- Password: `admin123` atau `user123`

## Backend

Uses JSON Server for simple data storage. Data is saved to `backend/db.json`. To view/edit data, visit `http://localhost:3001/invoices` in your browser.

## API Endpoints

- `GET /invoices` - Mendapatkan semua invoice
- `POST /invoices` - Menambah invoice baru
- `PATCH /invoices/:id` - Update status pembayaran invoice

## Notes

- Form submission saves data to the backend.
- Dark mode preference is saved in localStorage.
- Admin authentication is stored in localStorage (client-side only).
- For production, replace JSON Server with a real database and implement proper server-side authentication.

## Production Deployment

### Prerequisites

- Ubuntu VPS with root access
- Docker and Docker Compose installed
- Nginx installed on the server
- Domain name (optional, but recommended for SSL)

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
sudo apt install nginx -y

# Enable and start services
sudo systemctl enable docker
sudo systemctl start docker
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 2. Deploy Application

```bash
# Clone or upload your project to the server
cd /opt
sudo mkdir invoice-web
sudo chown $USER:$USER invoice-web
cd invoice-web

# Copy all project files to this directory
# (upload via SCP, SFTP, or git clone)

# Create environment file
cat > .env << EOF
JWT_SECRET=your-super-secure-jwt-secret-change-this-in-production
EOF

# Make scripts executable
chmod +x start-admin.bat start.bat
```

### 3. Configure Nginx Reverse Proxy

```bash
# Backup default nginx config
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# Create new nginx config
sudo tee /etc/nginx/sites-available/invoice-web << EOF
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Proxy to docker containers
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/invoice-web /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 4. SSL Configuration (Let's Encrypt)

```bash
# Install certbot
sudo apt install snapd -y
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Certbot will automatically update nginx config for SSL
```

### 5. Start Application

```bash
cd /opt/invoice-web

# Start all services
docker-compose up -d

# Check if services are running
docker-compose ps

# View logs
docker-compose logs -f
```

### 6. Access Application

- **Frontend**: `http://your-domain.com/`
- **Admin Dashboard**: `http://your-domain.com/admin/`
- **API**: `http://your-domain.com/api/`

### 7. Initial Setup

1. Access the admin dashboard: `http://your-domain.com/admin/login.html`
2. Create the first admin user by calling the setup endpoint:

```bash
curl -X POST http://localhost/api/setup-admin \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your-secure-password"}'
```

### 8. Monitoring and Maintenance

```bash
# Check container health
docker-compose ps

# View logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs admin_frontend
docker-compose logs nginx

# Update application
docker-compose pull
docker-compose up -d

# Backup database
cp backend/db.json backend/db.json.backup.$(date +%Y%m%d_%H%M%S)

# Restart services
docker-compose restart
```

### 9. Troubleshooting

**Common Issues:**

1. **Port 80 already in use**: Stop nginx temporarily during testing

   ```bash
   sudo systemctl stop nginx
   docker-compose up -d
   # Test with direct port access
   ```

2. **Permission issues**: Ensure proper file permissions

   ```bash
   sudo chown -R $USER:$USER /opt/invoice-web
   ```

3. **Database not persisting**: Check volume mounts in docker-compose.yml

4. **SSL issues**: Verify certbot installation and domain DNS

**Logs to check:**

- Docker logs: `docker-compose logs`
- Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Application logs: Check container logs

### 10. Security Considerations

- Change default JWT secret in `.env` file
- Use strong passwords for admin accounts
- Keep Docker and system updated
- Configure firewall (ufw)
- Consider using HTTPS only
- Regular backups of `db.json`

### 11. Scaling Considerations

For high traffic, consider:

- Moving to a real database (PostgreSQL/MySQL)
- Implementing Redis for caching
- Load balancing with multiple backend instances
- CDN for static assets
- Database replication for high availability
   
   
