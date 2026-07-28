# SIMS 4.0 - Student Internship Management System

**SIMS 4.0** is an upgraded, production-ready system to manage university internships. It connects Admins, Teachers, and Students in a single platform, featuring a complete transition to PostgreSQL and full containerization via Docker.

## New Features in 4.0

1. **Database Migration**: Completely moved from SQLite/MongoDB to **PostgreSQL**.
2. **Batch & Academic Status**: Added support to track student cohorts (e.g., `K23`, `K24`) and academic lifecycles (`ACTIVE`, `GRADUATED`).
3. **Student-Initiated Requests**: Students can now browse available teachers and send supervision requests.
4. **Teacher Inbox & Notifications**: Teachers have a dedicated inbox to Approve/Reject requests, supported by an in-app notification system.
5. **Advanced Admin Dashboard**: Integrated `recharts` for dynamic Pie, Bar, and Line charts reflecting real-time system health.
6. **Robust CSV Imports**: Improved data validation catching duplicate emails/codes and ensuring correct formats.
7. **Production Ready**: Fully dockerized with multi-stage builds and an Nginx reverse proxy.

## Tech Stack

- **Frontend**: React 18, Vite, React Router, Recharts, Lucide-React
- **Backend**: Node.js, Express.js, Sequelize ORM
- **Database**: PostgreSQL 15
- **Infrastructure**: Docker, Nginx

## Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- PostgreSQL installed locally OR Docker

### 1. Setup Database
If using local PostgreSQL, create a database named `sims_db`. Update the `backend/.env` file with your credentials.
If using Docker, run `docker compose up -d db` to start the database container.

### 2. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 3. Seed the Database
```bash
cd backend
npm run seed
```
This will create test accounts:
- Admin: `admin@university.edu.vn` (Pass: Admin@123)
- Teachers: `gvhd01@...`, `gvhd02@...`
- Students: `k23001@...`, `k24001@...`

### 4. Run the App
```bash
# Terminal 1 (Backend)
cd backend
npm run dev

# Terminal 2 (Frontend)
cd frontend
npm run dev
```

## Production Deployment

Please see [DEPLOYMENT.md](./DEPLOYMENT.md) for instructions on deploying the full stack using Docker on Antigravity Hosting.

## Documentation

For full API documentation, refer to [API_DOCS.md](./API_DOCS.md).
