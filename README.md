# Online Bus Tracking System

Developed by Team 3DNA

This repository contains a full-stack Online Bus Tracking System (frontend + backend + database schema).

Features
- Roles: Admin, Driver, Passenger
- JWT authentication
- REST APIs (Flask)
- Real-time tracking with WebSockets (Socket.IO)
- Map integration using Leaflet (OpenStreetMap)
- MySQL database with schema and seed data
- Advanced features: trip history, speed calculation, night mode, alert system, mobile responsive UI

Folders
- `backend/` - Flask backend, API routes, models
- `frontend/` - HTML/CSS/JS frontend (Leaflet map, Socket.IO client)
- `db/` - MySQL schema and sample data

README includes setup and run instructions for Windows (PowerShell).

---

See `db/schema.sql` and `db/seed.sql` to prepare the database.

## Quick setup (Windows PowerShell)

1. Install Python 3.11+ and MySQL server.
2. Create a virtual environment and install requirements:

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r requirements.txt
```

3. Create the database and seed data (run from MySQL shell or use MySQL Workbench):

```sql
source db/schema.sql;
source db/seed.sql;
```

4. Copy `.env.sample` to `.env` and update credentials.

5. Run the backend:

```powershell
cd backend; python app.py
```

6. Open `frontend/index.html` (or `admin.html`/`driver.html`) in a browser to use the UI.

Notes:
- This scaffold uses Leaflet (OpenStreetMap) for maps to avoid API keys. For production pick a tiles provider with SLA.
- Passwords in `db/seed.sql` are placeholders. Register users via the `/api/auth/register` endpoint or replace with hashed passwords.

Developed by Team 3DNA
