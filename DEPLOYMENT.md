# SIMS 4.0 Deployment Guide for Antigravity Hosting

This guide provides instructions to deploy SIMS 4.0 (Student Internship Management System) on Antigravity Hosting using Docker.

## Prerequisites

- Antigravity Server with root access or Docker installed
- Domain name pointing to the server IP (optional but recommended)
- `docker` and `docker compose` installed on the server

## 1. Environment Configuration

Create a `.env.production` file on the server (you can copy from the template):

```bash
cp .env.production .env
```

Edit the `.env` file to include secure passwords and your domain:

```env
# Database
DB_NAME=sims_db
DB_USER=postgres
DB_PASSWORD=YOUR_SECURE_PASSWORD

# JWT
JWT_SECRET=YOUR_SUPER_SECURE_RANDOM_STRING
JWT_EXPIRES_IN=7d

# CORS (Replace with your actual domain)
ALLOWED_ORIGINS=http://your-domain.com,https://your-domain.com
```

## 2. Deployment

1. Transfer the project files to your Antigravity server (via Git, SFTP, or SCP).
2. Navigate to the project root directory where `docker-compose.yml` is located.
3. Build and start the containers in detached mode:

```bash
docker compose build
docker compose up -d
```

## 3. Database Initialization

Since this is a fresh production database, you need to sync the models and populate the initial Admin account. We use the included seeder for this:

```bash
docker compose exec backend npm run seed
```

*Note: This seed script currently uses `force: true` to recreate tables. If you are upgrading an existing production database, do not run this! Instead, ensure `alter: true` is set in the backend `server.js` to automatically update the schema.*

## 4. Verification

1. **Check Container Status:**
   ```bash
   docker compose ps
   ```
   You should see `sims_postgres`, `sims_backend`, `sims_frontend`, and `sims_nginx` all running.

2. **Check Health Endpoint:**
   Visit `http://your-server-ip/api/health`
   Expected response: `{"status": "OK", "database": "connected", "version": "4.0.0", ...}`

3. **Access the System:**
   Visit `http://your-server-ip/`
   Login with the default admin account:
   - Email: `admin@university.edu.vn`
   - Password: `Admin@123`

## 5. Maintenance

**View Backend Logs:**
```bash
docker compose logs -f backend
```

**Restart Nginx after config changes:**
```bash
docker compose restart nginx
```

**Backing up the PostgreSQL Database:**
```bash
docker compose exec db pg_dump -U postgres sims_db > backup_sims_db.sql
```
