# Personal Finance Management System

A full-stack project to track income, expenses, savings, reports, charts, search/filter, and PDF downloads.

## 1. What You Need To Install

Install these tools before running the project:

1. Python 3.11 or newer
   - Download: https://www.python.org/downloads/
   - During installation on Windows, tick `Add python.exe to PATH`.
   - After installing, check:

```powershell
python --version
```

2. Node.js 20 or newer
   - Download: https://nodejs.org/
   - After installing, check:

```powershell
node --version
npm.cmd --version
```

Use `npm.cmd` on Windows PowerShell if `npm` is blocked by execution policy.

3. Oracle Database Free or Oracle XE
   - Oracle Database Free: https://www.oracle.com/database/free/
   - Oracle XE is also acceptable.
   - You can manage the database using Oracle SQL Developer, SQL Plus, or SQLcl.

4. Code editor
   - VS Code is recommended.

## 2. Project Folder

The project has two main parts:

```text
personal-finance-manager/
  backend/    Python Flask API
  frontend/   React user interface
```

Open a terminal in the project folder:

```powershell
cd personal-finance-manager
```

If you are using the generated folder from this workspace, the path is:

```powershell
cd C:\Users\ganes\Documents\Codex\2026-06-18\1-personal-finance-management-system-idea\outputs\personal-finance-manager
```

## 3. Oracle Database Setup

First create a database user/schema for this project.

Open Oracle SQL Developer, SQL Plus, or SQLcl and connect as an admin user such as `SYSTEM`.

Then run:

```sql
CREATE USER finance_user IDENTIFIED BY finance_pass;
GRANT CONNECT, RESOURCE TO finance_user;
ALTER USER finance_user QUOTA UNLIMITED ON USERS;
```

Most local Oracle installations use one of these service names:

```text
FREEPDB1
XEPDB1
```

Use `FREEPDB1` for Oracle Database Free. Use `XEPDB1` for older Oracle XE installations.

The connection URL used by the backend is:

```text
oracle+oracledb://finance_user:finance_pass@localhost:1521/?service_name=FREEPDB1
```

If your Oracle uses XE, change it to:

```text
oracle+oracledb://finance_user:finance_pass@localhost:1521/?service_name=XEPDB1
```

## 4. Backend Setup

Open a terminal in the project folder, then go to the backend:

```powershell
cd backend
```

Create a Python virtual environment:

```powershell
python -m venv .venv
```

Activate it:

```powershell
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, run this once:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Then activate again:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install backend packages:

```powershell
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

Create the environment file:

```powershell
copy .env.example .env
```

Open `backend/.env` and confirm this line is correct:

```text
DATABASE_URL=oracle+oracledb://finance_user:finance_pass@localhost:1521/?service_name=FREEPDB1
```

Use `XEPDB1` instead of `FREEPDB1` if your Oracle installation uses XE.

Initialize database tables:

```powershell
python -m flask --app app:create_app init-db
```

Start the backend server:

```powershell
python -m flask --app app:create_app run --debug --port 5000
```

Keep this terminal open. The backend should run at:

```text
http://localhost:5000/api
```

You can test it in a browser:

```text
http://localhost:5000/api/health
```

Expected response:

```json
{"status":"ok"}
```

## 5. Frontend Setup

Open a second terminal. Do not close the backend terminal.

From the project folder, go to the frontend:

```powershell
cd frontend
```

Install frontend packages:

```powershell
npm.cmd install
```

Create the frontend environment file:

```powershell
copy .env.example .env
```

Open `frontend/.env` and confirm:

```text
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the React app:

```powershell
npm.cmd run dev
```

The frontend should run at:

```text
http://localhost:5173
```

Open that URL in your browser.

## 6. How To Use The App

1. Open `http://localhost:5173`.
2. Click register and create a user account.
3. Add transactions using the form.
4. Select transaction type:
   - `income`
   - `expense`
   - `saving`
5. Choose categories such as Food, Shopping, Bills, Travel, Salary, or Savings.
6. View dashboard totals and charts.
7. Search and filter transactions.
8. Click `PDF` to download the monthly expense report.

## 7. Common Problems And Fixes

### `python` is not recognized

Python is not added to PATH. Reinstall Python and tick `Add python.exe to PATH`, or restart your terminal after installation.

### `npm.ps1 cannot be loaded`

Use `npm.cmd` instead of `npm`:

```powershell
npm.cmd install
npm.cmd run dev
```

### Oracle connection fails

Check these things:

- Oracle service is running.
- Port is `1521`.
- Service name is correct: `FREEPDB1` or `XEPDB1`.
- Username is `finance_user`.
- Password is `finance_pass`.

You can also test login in SQL Developer using:

```text
Username: finance_user
Password: finance_pass
Host: localhost
Port: 1521
Service name: FREEPDB1
```

### Microsoft Visual C++ 14.0 is required while installing `oracledb`

This usually means pip is trying to build the Oracle driver from source instead of downloading a ready-made wheel.

First upgrade pip tools:

```powershell
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r requirements.txt
```

If it still fails, install Python 3.11 or 3.12 and create the virtual environment again. Python 3.13 can sometimes hit package wheel issues depending on the package version available.

Alternative fix: install Microsoft C++ Build Tools from:

```text
https://visualstudio.microsoft.com/visual-cpp-build-tools/
```

### `flask` is not recognized

Make sure the virtual environment is activated:

```powershell
.\.venv\Scripts\Activate.ps1
```

Then install requirements again:

```powershell
pip install -r requirements.txt
```

Use `python -m flask` instead of plain `flask`:

```powershell
python -m flask --app app:create_app init-db
python -m flask --app app:create_app run --debug --port 5000
```

### Tables are not created

Run this from inside the `backend` folder:

```powershell
python -m flask --app app:create_app init-db
```

## 8. Main Features

- User registration and login
- JWT authentication
- Add, edit, and delete transactions
- Income, expense, and saving transaction types
- Expense categories
- Monthly reports
- Dashboard charts
- Search and filter transactions
- Download report as PDF

## 9. Useful API Routes

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/transactions
POST   /api/transactions
PUT    /api/transactions/:id
DELETE /api/transactions/:id
GET    /api/reports/monthly?month=2026-06
GET    /api/reports/pdf?month=2026-06
GET    /api/health
```

## 10. Quick Command Summary

Backend terminal:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
copy .env.example .env
python -m flask --app app:create_app init-db
python -m flask --app app:create_app run --debug --port 5000
```

Frontend terminal:

```powershell
cd frontend
npm.cmd install
copy .env.example .env
npm.cmd run dev
```

Then open:

```text
http://localhost:5173
```

## 11. Notes

- The backend uses Oracle through SQLAlchemy's `oracle+oracledb` driver.
- The app can also run with SQLite for quick testing if `DATABASE_URL` is left empty in `backend/.env`.
- Change `JWT_SECRET_KEY` and `SECRET_KEY` before deploying publicly.
