#  CrossApp Agent

**Compare Across Apps. Choose the Best.**

An end-to-end **agentic commerce platform** powered by AI. Understand user shopping intent, search and compare products from multiple merchants, recommend the best match, and process orders with Razorpay payment integration—all in one intelligent workflow.

---

## 📌 Table of Contents

1. [Solution](#solution)
2. [Why It's Agentic](#why-its-agentic)
3. [Key Features](#key-features)
4. [System Architecture](#system-architecture)
5. [Technology Stack](#technology-stack)
6. [Project Structure](#project-structure)
7. [Installation](#installation)
8. [Environment Variables](#environment-variables)
9. [API Documentation](#api-documentation)
10. [Team & License](#team--license)

---

## Solution

**CrossApp Agent** eliminates friction by automating the entire shopping journey:

1. **User expresses intent in natural language** ("I need a laptop under ₹50,000")
2. **AI agent interprets requirements** (budget, preferences, constraints)
3. **System searches multiple merchants** simultaneously
4. **Products are compared** against user criteria
5. **Best match is recommended** with reasoning
6. **Order is created and checkout initiated** seamlessly
7. **Razorpay handles payment** with full verification
8. **Payment status is tracked** in real-time
9. **User dashboard** shows order history and analytics

### Flow Comparison

**Traditional E-commerce:**
```
Search → Compare → Display → Redirect → External Checkout
```

**CrossApp Agent:**
```
Understand Intent → Search → Compare → Recommend → Order → Pay → Track
```

---

## Why It's Agentic

This is **not** a traditional product comparison website. It's an **agentic commerce experience** because:

### 1. Intent Understanding
- Groq LLM processes natural-language queries
- Extracts budget, preferences, constraints, and ranking criteria
- Handles ambiguous or complex requirements intelligently

### 2. Multi-Step Tool Orchestration
- Agent decides which tool to call (search products, search merchants, compare, rank)
- Uses intermediate results to inform next steps
- Adapts strategy based on findings

### 3. Autonomous Decision-Making
- Agent ranks candidates independently
- Applies user preferences deterministically (cheapest, highest-rated, fastest delivery, best value)
- Provides reasoning for its recommendation

### 4. End-to-End Automation
- User input → Automated workflow → Order placement → Payment processing
- Minimal friction between intent and transaction
- No manual redirects or context switching

### 5. Fallback & Error Handling
- If agent fails, recommendation engine provides deterministic fallback
- All intermediate steps are logged for transparency
- User can override recommendation and choose alternative

---

## Key Features

### User Features
- **Secure Authentication**: Signup, login, logout with JWT tokens
- **AI-Powered Comparison**: Groq LLM + LangChain for intelligent search and analysis
- **Natural-Language Queries**: Support for flexible query syntax ("laptop under ₹50k", "best-rated phones")
- **Multi-Merchant Search**: Search products from 2+ connected merchant catalogs simultaneously
- **Smart Ranking**: AI agent ranks candidates by user preference
- **Product Comparison**: Side-by-side comparison with filtering and sorting
- **Intelligent Recommendation**: AI-generated recommendation with reasoning
- **Comparison History**: Track all past product comparisons
- **Order Management**: Create orders, track status, view history
- **Razorpay Integration**: Secure test-mode payment with signature verification
- **Payment Tracking**: Real-time payment status (PAYMENT_PENDING, PAID, PAYMENT_FAILED)
- **User Dashboard**: 
  - Total comparisons, orders, spending
  - Payment success rate
  - 7-day daily spending chart
  - Recent order list

### Admin Features
- **Admin Authentication**: Dedicated admin login with role-based access
- **Dashboard Analytics**:
  - Total users, orders, paid/failed/pending payments
  - Total revenue
  - 7-day revenue bar chart with real data
  - Recent activity feed
- **User Management**:
  - Paginated user list with search
  - View user details and order statistics
  - Enable/disable user accounts
- **Audit Logs**:
  - Comprehensive activity tracking
  - Filter by action type
  - Pagination support
- **Revenue Analytics**: 7-day revenue overview

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React 19)                     │
│  Pages: Landing, Login, Dashboard, Compare, Orders,         │
│         Profile, Admin Dashboard, Admin Users, Audit Logs   │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTPS API Calls
                  ↓
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (FastAPI + Python)                 │
│                                                              │
│  • Routers: auth, agent, orders, dashboard, admin          │
│  • AI Agent Layer: LangChain + Groq LLM                    │
│    - Tools: search_products, search_merchant_products,     │
│             compare_products, rank_products               │
│  • Services: auth, recommendation, product_service,       │
│              audit, llm                                    │
│  • External APIs: Groq LLM, Razorpay                       │
└─────────────────┬───────────────────────────────────────────┘
                  │ Database Queries
                  ↓
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE (PostgreSQL)                    │
│                                                              │
│  Tables: users, orders, products, comparison_sessions,     │
│          audit_logs, merchants                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.2.8 | UI framework |
| Vite | 8.2.2 | Build tool |
| React Router | 6.30.6 | Client-side routing |
| Recharts | 2.15.4 | Charts & graphs |
| Lucide React | 1.37.0 | Icons |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| FastAPI | 0.141.1 | Web framework |
| Python | 3.10+ | Language |
| SQLAlchemy | 2.0.52 | ORM |
| PostgreSQL | 13+ | Database |
| Groq | 0.37.1 | LLM API client |
| LangChain | 0.3.30 | AI orchestration |
| Razorpay | 2.0.1 | Payment SDK |
| PyJWT | 2.10.1 | JWT tokens |
| Uvicorn | 0.52.4 | ASGI server |

### External Services
- **Groq API**: LLM for natural language understanding
- **Razorpay API**: Payment processing (test mode)

---

## Project Structure

```
Cross-App-Comparison-Agent/
├── frontend/                          # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Compare.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── AdminLogin.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminUsers.jsx
│   │   │   └── AdminAuditLogs.jsx
│   │   ├── components/
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   └── utils/
│   ├── package.json
│   └── vite.config.js
│
├── backend/                           # FastAPI backend
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── agent.py
│   │   │   ├── orders.py
│   │   │   ├── dashboard.py
│   │   │   └── admin.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── order.py
│   │   │   ├── product.py
│   │   │   ├── audit_log.py
│   │   │   └── comparison_session.py
│   │   ├── schemas/
│   │   ├── services/
│   │   │   ├── auth.py
│   │   │   ├── recommendation.py
│   │   │   ├── product_service.py
│   │   │   └── audit.py
│   │   ├── agents/
│   │   │   ├── agent.py
│   │   │   └── prompts.py
│   │   ├── tools/
│   │   │   ├── product_search.py
│   │   │   ├── merchant_search.py
│   │   │   ├── comparison.py
│   │   │   └── ranking.py
│   │   ├── database.py
│   │   └── main.py
│   ├── data/
│   │   ├── merchant_1_products.json
│   │   └── merchant_2_products.json
│   ├── .env
│   ├── requirements.txt
│   └── migrate.py
│
└── README.md
```

---

## Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 13+
- Git

### Backend Setup

1. **Clone repository**
   ```bash
   git clone https://github.com/yourusername/Cross-App-Comparison-Agent.git
   cd Cross-App-Comparison-Agent/backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv env
   .\env\Scripts\Activate  # Windows
   source env/bin/activate # Mac/Linux
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create PostgreSQL database**
   ```bash
   psql -U postgres
   CREATE DATABASE cross_app_comparison_agent;
   \q
   ```

5. **Create .env file**
   ```
   DATABASE_URL=postgresql+psycopg://postgres:password@localhost:5432/cross_app_comparison_agent
   GROQ_API_KEY=your_groq_api_key_here
   RAZORPAY_KEY_ID=rzp_test_your_test_key
   RAZORPAY_KEY_SECRET=your_test_secret_here
   SECRET_KEY=your_jwt_secret_key_min_32_chars
   ```

6. **Run migrations**
   ```bash
   python migrate.py
   ```

### Frontend Setup

1. **Navigate to frontend**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file**
   ```
   VITE_API_URL=http://localhost:8000
   ```

---

## Environment Variables

### Backend (.env)

| Variable | Type | Required | Description |
|---|---|---|---|
| `DATABASE_URL` | str | Yes | PostgreSQL connection URL |
| `GROQ_API_KEY` | str | Yes | Groq API key for LLM |
| `RAZORPAY_KEY_ID` | str | Yes | Razorpay test public key |
| `RAZORPAY_KEY_SECRET` | str | Yes | Razorpay test secret key |

### Frontend (.env)

| Variable | Type | Required | Description |
|---|---|---|---|
| `VITE_API_URL` | str | Yes | Backend API URL |

---

## API Documentation

### Base URL
```
http://localhost:8000/api
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | User signup |
| POST | `/auth/login` | User login |
| GET | `/auth/me` | Get current user |
| POST | `/auth/admin/login` | Admin login |
| GET | `/admin/me` | Get admin info |

### Agent & Order Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/recommendations` | Get AI recommendation |
| GET | `/comparison-history` | User's comparisons |
| POST | `/orders` | Create order |
| GET | `/orders` | Get user's orders |
| POST | `/orders/{id}/checkout` | Mark checkout started |
| POST | `/orders/{id}/verify-payment` | Verify payment |
| POST | `/orders/{id}/mark-failed` | Mark payment failed |

### Dashboard Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | User dashboard data |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/stats` | Dashboard statistics |
| GET | `/admin/audit-logs` | Audit logs (paginated) |
| GET | `/admin/users` | User list (paginated) |
| PATCH | `/admin/users/{id}/status` | Enable/disable user |
| GET | `/admin/analytics/revenue` | Revenue by date |

---

## Team

**Project**: CrossApp Agent  
**Track**: AI Growth & Agentic Commerce  
**Motto**: "Compare Across Apps. Choose the Best."  
**Technologies**: FastAPI, React, PostgreSQL, Groq LLM, Razorpay, LangChain
