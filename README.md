# 🎯 InterviewIQ — AI-Powered Multimodal Interview Platform

InterviewIQ is an enterprise-grade AI technical interview simulation and assessment platform. It conducts dynamic, multi-turn technical interviews, analyzes real-time video and audio signals, executes deterministic multimodal evaluations, and delivers performance dashboards with downloadable PDF scorecards.

---

## 🏗 High-Level Architecture

```text
Frontend (React 18 + Vite + Tailwind CSS + MediaPipe Vision)
       │
       ▼
Backend API (FastAPI + Python 3.11 + Uvicorn)
       │
       ├── Authentication & Session State (JWT + InterviewStateManager)
       │
       ├── Groq Interview Agent (Multi-turn Orchestrator)
       │       │
       │       ▼
       │   Tool Registry (Dynamic Tool Execution)
       │       ├── Question Generation & Contextual Follow-up
       │       ├── Answer Evaluation & Lifecycle State
       │       ├── Computer Vision & Behavioral Analysis
       │       ├── Deterministic Final Scoring
       │       └── Performance Report Compilation
       │
       ├── Deterministic Scoring Pipeline
       │       AnswerEvaluator ──► EvidenceAggregator ──► ScoringEngine ──► FinalEvaluator
       │
       └── Database (PostgreSQL via SQLAlchemy 2.0 & Alembic)
```

---

## 🌟 Core Subsystems

### 1. Centralized Interview State Manager (Phase 8)
- Finite state machine governing session states: `CONFIGURED` → `STARTED` → `IN_PROGRESS` → `COMPLETED` / `CANCELLED`.
- Atomic session history, question sequencing, and timing tracking.

### 2. Tool Architecture & Tool Registry (Phase 9)
- Modular tool registry with strong Pydantic schemas, dependency injection (database session, active user), and error encapsulation.
- Registers all 9 operational tools:
  1. `generate_interview_question`
  2. `generate_follow_up_question`
  3. `evaluate_answer`
  4. `get_interview_state`
  5. `update_interview_state`
  6. `analyze_face`
  7. `analyze_behavior`
  8. `calculate_final_evaluation`
  9. `generate_interview_report`

### 3. Groq Interview Agent (Phase 10)
- Single orchestrator using high-speed Groq LLM inference to manage conversation turns and invoke registered tools.

### 4. Real-Time Multimodal Analysis (Phase 11)
- **Computer Vision**: Tracks facial landmarks, head pose orientation, and eye gaze alignment using MediaPipe.
- **Speech & Behavior**: Analyzes vocal cadence (WPM), response duration, latency, and linguistic structure.
- Persists all observations to the `multimodal_evidence` database table.

### 5. Deterministic Final Scoring (Phase 12)
- Replaces non-deterministic LLM scoring with an explainable, weighted formula:
  - **Answer Quality (Technical & Content Mastery)**: 70%
  - **Behavioral & Communication Cadence**: 15%
  - **Visual Engagement & Presence**: 15%
- Provides per-question breakdowns, pillar confidence indicators, strengths, and areas for improvement.

### 6. Results Dashboard & PDF Reporting (Phase 13)
- Interactive results dashboard featuring score cards, competency breakdowns, and evidence transparency.
- Production ReportLab engine generating multi-page, formatted PDF reports with visual scorecards and downloadable artifacts.

---

## 🚀 Quickstart & Development Setup

### Prerequisites
- Python 3.10 or 3.11
- Node.js 18+ (Node 20 recommended)
- PostgreSQL 14+
- Groq API Key

### Backend Setup
```bash
cd backend
# 1. Configure environment
cp ../.env.example .env
# Edit .env with your DATABASE_URL and AI_API_KEY

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run database migrations
alembic upgrade head

# 4. Start backend server
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
- API Health Check: `http://localhost:8000/api/v1/health`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`

### Frontend Setup
```bash
cd frontend
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 🧪 Testing & Verification

### Run Backend Tests
```bash
cd backend
pytest -v
```

### Production Frontend Build
```bash
cd frontend
npm run build
```

---

## 📁 Project Structure

```text
InterviewIQ/
├── backend/
│   ├── app/
│   │   ├── agents/interview/       # Groq Interview Agent
│   │   ├── ai/                     # AI Providers (Groq, STT, TTS, Vision)
│   │   ├── api/                    # FastAPI Endpoints & Routers
│   │   ├── core/                   # Config, Database, Scoring weights, Security
│   │   ├── evaluation/             # Deterministic Final Evaluation & Aggregation
│   │   ├── models/                 # SQLAlchemy 2.0 Database Models
│   │   ├── schemas/                # Pydantic Schemas & DTOs
│   │   ├── services/               # Core Business Logic Services
│   │   └── tools/                  # Unified Tool Architecture & 9 Operational Tools
│   ├── alembic/                    # Database Migrations
│   ├── models/                     # ML Model Binaries (MediaPipe Face Landmarker)
│   ├── scripts/                    # Database Seeding & Development Scripts
│   ├── tests/                      # Pytest Test Suite
│   └── requirements.txt            # Production Python Dependencies
├── frontend/
│   ├── src/
│   │   ├── components/             # Reusable UI, Interview, Results, & Report Components
│   │   ├── context/                # React Contexts (Auth, Interview, Resume, Theme)
│   │   ├── hooks/                  # Audio, Face Detection, & Utility Hooks
│   │   ├── layouts/                # Main, Auth, & Workspace Layouts
│   │   ├── pages/                  # Top-level Page Views (Dashboard, Interview, Results, Reports)
│   │   ├── routes/                 # App Routing & Route Guards
│   │   ├── services/               # API Client & Backend Interaction Services
│   │   └── utils/                  # Style & Constant Utilities
│   ├── public/                     # Static Assets
│   └── package.json                # Frontend Dependencies & Scripts
├── docs/
│   ├── architecture/               # System Architecture Documentation
│   └── deployment/                 # Deployment & Operations Guide
├── .env.example                    # Consolidated Environment Configuration Template
├── .gitignore                      # Version Control Exclusions
└── README.md                       # Repository Guide & Documentation
```

---

## 📄 License
MIT License.
