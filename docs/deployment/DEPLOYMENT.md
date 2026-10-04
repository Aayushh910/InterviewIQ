# InterviewIQ — Deployment & Operations Guide

## Overview

InterviewIQ comprises a FastAPI backend service and a Vite/React SPA frontend service, backed by PostgreSQL.

---

## 1. Prerequisites

- **Python**: 3.10 or 3.11
- **Node.js**: 18+ (Node 20 recommended)
- **PostgreSQL**: 14+ (Local or Cloud e.g., Neon, Supabase, RDS)
- **Groq API Key**: For low-latency LLM and Whisper STT inference

---

## 2. Backend Setup & Run

### A. Environment Configuration
```bash
cd backend
cp ../.env.example .env
# Edit .env with your PostgreSQL DATABASE_URL, GROQ_API_KEY, and SECRET_KEY
```

### B. Dependency Installation
```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### C. Database Migrations
```bash
alembic upgrade head
```

### D. Verify Seed Data (Optional)
```bash
python scripts/seed_canonical_user.py
```

### E. Run Server
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```
- Health Check: `GET http://localhost:8000/api/v1/health`
- OpenAPI Docs: `http://localhost:8000/docs`

---

## 3. Frontend Setup & Run

### A. Environment Configuration
```bash
cd frontend
# Ensure VITE_API_URL points to the backend API
echo "VITE_API_URL=http://localhost:8000/api/v1" > .env
```

### B. Dependency Installation & Dev Server
```bash
npm install
npm run dev
```
Access the application at `http://localhost:5173`.

### C. Production Build
```bash
npm run build
```
Static production output will be generated in `frontend/dist/`.

---

## 4. Automated Testing

### Backend Tests
```bash
cd backend
pytest -v
```

### Frontend Build Verification
```bash
cd frontend
npm run build
```
