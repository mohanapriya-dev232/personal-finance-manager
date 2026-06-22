# Personal Finance Management System

A full-stack web application to manage income, expenses, savings, and monthly financial reports.

## Features

- User registration and login
- Add, edit, and delete transactions
- Track income, expenses, and savings
- Categorize expenses such as Food, Shopping, Bills, and Travel
- Search and filter transactions
- Dashboard with charts
- Monthly financial reports
- Download reports as PDF

## Tech Stack

### Frontend

- React
- HTML
- CSS
- Vite
- Recharts

### Backend

- Python
- Flask
- Flask SQLAlchemy
- JWT Authentication

### Database

- Oracle Database

## Project Structure

```text
personal-finance-manager/
  backend/
    app/
      __init__.py
      auth.py
      config.py
      extensions.py
      models.py
      reports.py
      transactions.py
    requirements.txt
    .env.example

  frontend/
    src/
      App.jsx
      api.js
      main.jsx
      styles.css
    index.html
    package.json
    .env.example
```

## Installation

Install the following tools:

- Python 3.11 or later
- Node.js 20 or later
- Oracle Database Free or Oracle XE
- VS Code or any code editor

## Oracle Database Setup

Create an Oracle user for the project:

```sql
CREATE USER finance_user IDENTIFIED BY finance_pass;
GRANT CONNECT, RESOURCE TO finance_user;
ALTER USER finance_user QUOTA UNLIMITED ON USERS;
```

Use this database URL in the backend `.env` file:

```text
DATABASE_URL=oracle+oracledb://finance_user:finance_pass@localhost:1521/?service_name=FREEPDB1
```

If you are using Oracle XE, use:

```text
DATABASE_URL=oracle+oracledb://finance_user:finance_pass@localhost:1521/?service_name=XEPDB1
```

## Backend Setup

Go to the backend folder:

```powershell
cd backend
```

Create and activate a virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install Python packages:

```powershell
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r requirements.txt
```

Create the environment file:

```powershell
copy .env.example .env
```

Create database tables:

```powershell
python -m flask --app app:create_app init-db
```

Run the backend server:

```powershell
python -m flask --app app:create_app run --debug --port 5000
```

Backend URL:

```text
http://127.0.0.1:5000/api
```

Health check:

```text
http://127.0.0.1:5000/api/health
```

## Frontend Setup

Open a new terminal and go to the frontend folder:

```powershell
cd frontend
```

Install Node packages:

```powershell
npm.cmd install
```

Create the environment file:

```powershell
copy .env.example .env
```

Run the frontend:

```powershell
npm.cmd run dev
```

Frontend URL:

```text
http://localhost:5173
```

## How To Run The Project

Start the backend first:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m flask --app app:create_app run --debug --port 5000
```

Start the frontend in another terminal:

```powershell
cd frontend
npm.cmd run dev
```

Then open:

```text
http://localhost:5173
```

## API Endpoints

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/transactions
POST   /api/transactions
PUT    /api/transactions/:id
DELETE /api/transactions/:id
GET    /api/reports/monthly
GET    /api/reports/pdf
GET    /api/health
```

## Notes

- Do not upload `.env`, `.venv`, `node_modules`, or local database files to GitHub.
- Use `.env.example` as a sample configuration file.
- Change secret keys before deploying the project.
