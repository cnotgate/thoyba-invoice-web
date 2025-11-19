# Admin Credentials

## First Time Setup

When the backend container starts for the first time, it will:

1. Run database migrations
2. Create an admin user with auto-generated secure password
3. Save credentials to `ADMIN_CREDENTIALS.txt`

## How to Access Credentials

### In Docker Container

```bash
# View the credentials file
sudo docker compose exec backend cat ADMIN_CREDENTIALS.txt

# Or copy it to your host machine
sudo docker compose cp backend:/app/ADMIN_CREDENTIALS.txt ./
```

### Local Development

```bash
# View the credentials file
cat backend/ADMIN_CREDENTIALS.txt
```

## Important Security Notes

⚠️ **IMPORTANT:**
1. Save the password in a secure password manager
2. Change the password after first login
3. Delete `ADMIN_CREDENTIALS.txt` after saving the password
4. Never commit this file to version control (already in .gitignore)

## Changing Password

After first login, you can change the admin password through the admin panel or by updating the database directly:

```bash
# Access database
sudo docker compose exec postgres psql -U postgres invoice_db

# Update password (hash the password first using bcrypt)
UPDATE users SET password = 'new_hashed_password' WHERE username = 'admin';
```

## Importing Legacy Data

If you want to import historical invoice data from the legacy system, see:

📄 **[LEGACY-IMPORT-GUIDE.md](LEGACY-IMPORT-GUIDE.md)**

The legacy folder is excluded from version control, so you'll need to manually copy and import data in production.

## Troubleshooting

### Lost Admin Password

If you lose the admin password:

1. Stop the containers: `sudo docker compose down`
2. Delete the database volume: `sudo docker volume rm invoice-web_postgres_data`
3. Restart: `sudo docker compose up -d --build`
4. A new admin user with new credentials will be created
5. Access credentials as described above

**Note:** This will delete all data! Make a backup first if needed.
