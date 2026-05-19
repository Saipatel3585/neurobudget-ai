# 🧠 NeuroBudget AI — Full-Stack AI Financial Intelligence System

> Analyze spending patterns and generate AI-powered financial insights using Ollama (local LLM), Next.js, Node.js, and MongoDB.

![Tech Stack](https://img.shields.io/badge/Next.js-14-black) ![MongoDB](https://img.shields.io/badge/MongoDB-8-green) ![Ollama](https://img.shields.io/badge/Ollama-llama3.2-blue) ![Node](https://img.shields.io/badge/Node.js-Express-brightgreen)

---

## 🏗️ Architecture

```
neurobudget-ai/
├── backend/                  # Node.js + Express API
│   ├── models/               # MongoDB models (User, Transaction, Budget, AIInsight)
│   ├── routes/               # REST API routes (auth, transactions, analytics, ai, budgets)
│   ├── services/             # Anomaly detection service
│   ├── middleware/           # JWT auth middleware
│   ├── server.js             # Express app entry point
│   └── seed.js               # Demo data seeder
└── frontend/                 # Next.js 14 app
    └── src/
        ├── pages/            # Dashboard, Transactions, Analytics, Budgets, Assistant, Insights
        ├── components/       # Layout, StatCard
        ├── hooks/            # Zustand auth store
        ├── utils/            # Axios API client
        └── styles/           # Global CSS
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Ollama (for AI features)

### 1. Clone & Setup

```bash
cd neurobudget-ai
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and settings
npm install
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.local.example .env.local
# Edit .env.local: NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm install
npm run dev
```

### 4. Seed Demo Data

```bash
cd backend
node seed.js
```

### 4. Configure Groq AI

```bash
# Get a free API key at https://console.groq.com
# Then in backend/.env:
GROQ_API_KEY=gsk_your_key_here
GROQ_MODEL=llama3-70b-8192
```

---

## 🌐 Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api |
| Ollama | http://localhost:11434 |

**Demo credentials:** `demo@neurobudget.ai` / `demo1234`

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📊 **Dashboard** | Real-time financial overview with charts |
| 💳 **Transactions** | Full CRUD with filtering & pagination |
| 🤖 **AI Chat** | Chat with Ollama-powered financial advisor |
| ✦ **AI Insights** | Auto-generated spending analysis |
| ⚠️ **Anomaly Detection** | Z-score statistical anomaly detection |
| 📈 **Analytics** | 6-month trends, category breakdown |
| 🔮 **Predictions** | Weighted moving average spending forecast |
| 🎯 **Budgets** | Set/track monthly category budgets |
| 🔐 **Auth** | JWT-based authentication |

---

## 🔌 API Endpoints

### Auth
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Current user
- `PUT /api/auth/profile` — Update profile

### Transactions
- `GET /api/transactions` — List (with filters)
- `POST /api/transactions` — Create
- `PUT /api/transactions/:id` — Update
- `DELETE /api/transactions/:id` — Delete
- `POST /api/transactions/bulk` — Bulk import

### Analytics
- `GET /api/analytics/dashboard` — Dashboard summary
- `GET /api/analytics/trends` — 6-month trends
- `GET /api/analytics/categories` — Category breakdown
- `GET /api/analytics/predict` — Spending prediction

### AI
- `POST /api/ai/chat` — Chat with AI advisor
- `POST /api/ai/insights/generate` — Generate AI insights
- `GET /api/ai/insights` — Get saved insights
- `GET /api/ai/status` — Ollama connection status

### Budgets
- `GET /api/budgets` — Get budgets for month
- `POST /api/budgets` — Create/update budget
- `DELETE /api/budgets/:id` — Delete budget

---

## 🧠 AI Stack

- **LLM**: Groq Cloud API running `llama3-70b-8192` (~300 tokens/sec, free tier available)
- **Anomaly Detection**: Z-score statistical analysis (2σ threshold)
- **Predictions**: Weighted moving average (6-month window)
- **Insights**: Structured JSON output from LLM + fallback heuristics

### Groq Setup
1. Go to [console.groq.com](https://console.groq.com) and create a free account
2. Generate an API key
3. Add to `backend/.env`:
```
GROQ_API_KEY=gsk_your_key_here
GROQ_MODEL=llama3-70b-8192
```

Available llama3 models on Groq:
| Model | Speed | Best for |
|-------|-------|----------|
| `llama3-8b-8192` | Fastest | Quick replies, free tier |
| `llama3-70b-8192` | Fast | Smarter analysis (recommended) |
| `llama-3.1-70b-versatile` | Fast | Most capable |

---

## 🗄️ MongoDB Collections

| Collection | Description |
|------------|-------------|
| `users` | User accounts + preferences |
| `transactions` | All financial transactions |
| `budgets` | Monthly category budgets |
| `aiinsights` | AI-generated insights |

---

## 📦 Tech Stack

**Frontend:** Next.js 14, Recharts, Zustand, React Hot Toast, Tailwind CSS  
**Backend:** Node.js, Express, Mongoose, JWT, bcrypt  
**Database:** MongoDB  
**AI:** Groq API (llama3-70b-8192), Statistical anomaly detection  
