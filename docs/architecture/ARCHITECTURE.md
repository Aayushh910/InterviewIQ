# InterviewIQ — System Architecture Documentation

## Overview

InterviewIQ is an enterprise-grade AI technical interview simulation and assessment platform. It conducts dynamic, multi-turn technical interviews, analyzes real-time video and audio signals, executes deterministic multimodal evaluations, and delivers performance dashboards with downloadable PDF scorecards.

---

## 1. High-Level System Architecture

```text
Candidate Browser (React 18 + Vite + Tailwind CSS + MediaPipe Vision)
       │
       │ HTTP / REST / WebRTC Audio / Video Frames
       ▼
FastAPI Application (Python 3.11 + Uvicorn)
       │
       ├── Authentication & Session Guard (JWT / Passlib Bcrypt)
       │
       ├── Groq Interview Agent (Multi-turn Orchestrator)
       │       │
       │       ▼
       │   Tool Registry (Dynamic Tool Discovery & Execution)
       │       │
       │       ├── GenerateInterviewQuestionTool (Domain/Difficulty Question Gen)
       │       ├── GenerateFollowUpQuestionTool (Contextual Follow-ups)
       │       ├── EvaluateAnswerTool (Deterministic Answer Scoring)
       │       ├── GetInterviewStateTool / UpdateInterviewStateTool (Session Life Cycle)
       │       ├── AnalyzeFaceTool (Facial Landmark & Gaze Tracking via MediaPipe)
       │       ├── AnalyzeBehaviorTool (Cadence, Timing, & Linguistic Quality)
       │       ├── CalculateFinalEvaluationTool (Multimodal Evidence Synthesis)
       │       └── GenerateInterviewReportTool (ReportLab PDF Generation)
       │
       ├── Evaluation & Evidence Pipeline
       │       ├── AnswerEvaluator (Individual Answer Scoring)
       │       ├── EvidenceAggregator (Evidence Extraction & Reliability Checks)
       │       ├── DeterministicScoringEngine (Mathematical Weighted Synthesis)
       │       └── FinalEvaluator (Canonical Scoring Orchestration)
       │
       └── Persistence Layer (PostgreSQL via SQLAlchemy 2.0 & Alembic)
               ├── Users
               ├── Interviews & InterviewSessions
               ├── Questions & SessionQuestions
               ├── Answers & AnswerEvaluations
               ├── MultimodalEvidence
               └── FinalEvaluations
```

---

## 2. Core Subsystems

### A. Interview State Manager (Phase 8)
- Centralized finite state machine enforcing valid session lifecycle transitions: `CONFIGURED` → `STARTED` → `IN_PROGRESS` → `COMPLETED` / `CANCELLED`.
- Full auditability with event timestamps, active question tracking, and remaining time management.

### B. Tool Architecture & Registry (Phase 9)
- Structured execution harness isolating external AI capabilities behind strong Pydantic schemas.
- Features parameter validation, contextual dependency injection (database session, active user), error trapping, and uniform `ToolResult` output.

### C. Groq Interview Agent (Phase 10)
- Single orchestrator powered by Groq high-speed LLM inference.
- Selects and executes registered tools strictly according to interview rules and candidate responses without hallucinated calculations.

### D. Multimodal Analysis (Phase 11)
- Computes observable visual signals (eye gaze ratio, head pose orientation, presence consistency) via MediaPipe Landmarker.
- Analyzes speech pacing (WPM), response duration, latency, and linguistic structure.
- Persists structured evidence records into the `multimodal_evidence` database table.

### E. Deterministic Scoring Engine (Phase 12)
- Replaces non-deterministic LLM scoring with an explainable mathematical formula:
  - Answer Quality (Technical & Content Mastery): 70%
  - Behavioral & Communication Cadence: 15%
  - Visual Engagement & Presence: 15%
- Generates reproducible score breakdowns, pillar confidence indicators, actionable strengths, and areas for improvement.

### F. Results Dashboard & Reporting (Phase 13)
- Real-time React dashboard with per-question breakdowns, pillar analytics, and reliability alerts.
- Production ReportLab engine generating multi-page, formatted PDF reports with visual scorecards, category bars, and diagnostic breakdowns.
