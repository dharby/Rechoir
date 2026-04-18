# RECHOIR - Choir Operations Management System

A professional-grade, secure backend and CRM-style dashboard for managing African church choir operations.

![RECHOIR](https://img.shields.io/badge/RECHOIR-Choir%20Management-1e40af?style=for-the-badge&labelColor=0f172a)

## Overview

RECHOIR transforms chaotic choir management—spreadsheets, WhatsApp groups, and memory-based tracking—into a unified, secure command center. Built specifically for African church choirs with features that matter:

- **Prayer Chains** - Track continuous and scheduled prayer request chains
- **Due Payment Tracker** - Monitor uniform fees, event dues with automated reminders
- **Rehearsal Scheduling** - Full attendance management with excuses tracking
- **Productivity Checklists** - Weekly goals and task tracking per member
- **Uniform Calendar** - Event-based uniform readiness tracking
- **Song Readiness** - Weekly song preparation with team-wide readiness tracking
- **Team Chat** - Real-timeSocket.io-powered communication
- **Member Management** - Bulk import via Google Sheets, access codes

## Architecture

### System Design

```
┌─────────────────────────────────────────────────────────┐
│ SUPER ADMIN (RECHOIR Platform)                          │
│ - Manages all choirs globally                            │
│ - Platform-wide analytics                                │
└─────────────────────────────────────────────────────────┘
         │
         │ creates
         ▼
┌─────────────────────────────────────────────────────────┐
│ TEAM LEAD (Choir Admin)                                  │
│ - Manages single choir team                              │
│ - Adds/removes team members                              │
│ - Generates unique access codes                           │
│ - Full operational control                               │
└─────────────────────────────────────────────────────────┘
         │
         │ grants access via code
         ▼
┌─────────────────────────────────────────────────────────┐
│ TEAM MEMBER                                              │
│ - Accesses via email + team code                        │
│ - Views assigned tasks, schedules, songs                 │
│ - Participates in team chat                              │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **Real-time**: Socket.io
- **Validation**: Zod
- **File Parsing**: xlsx for Google Sheet imports

### Frontend
- **Framework**: React 18 with Vite
- **Routing**: React Router v6
- **State**: Zustand
- **Data Fetching**: TanStack Query
- **Icons**: Lucide React
- **Real-time**: Socket.io Client
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Create database
psql -U postgres -c "CREATE DATABASE rechoir;"

# Initialize Prisma
npm run db:generate
npm run db:push

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend runs on `http://localhost:5173` and connects to the backend at `http://localhost:3000`.

## Security Features

| Feature | Implementation |
|---------|---------------|
| Password Hashing | bcrypt with cost factor 12 |
| JWT Access Tokens | 15-minute expiry, RS256 |
| JWT Refresh Tokens | 7-day expiry |
| Rate Limiting | 5 attempts/15 min on auth endpoints |
| Input Validation | Zod schemas on all endpoints |
| SQL Injection | Prevented via Prisma ORM |
| Security Headers | Helmet.js middleware |
| CORS | Strict origin checking |

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/super-admin/register` | Register RECHOIR admin |
| POST | `/api/auth/super-admin/login` | Admin login |
| POST | `/api/auth/team-lead/register` | Register team lead (via admin) |
| POST | `/api/auth/team-lead/login` | Team lead login |
| POST | `/api/auth/member/login` | Member login with access code |
| POST | `/api/auth/member/login-password` | Member login with password |
| POST | `/api/auth/refresh` | Refresh access token |

### Core Modules

| Module | Endpoints |
|--------|-----------|
| **Teams** | `GET/POST /api/teams`, `GET/PATCH/DELETE /api/teams/:id` |
| **Members** | `GET/POST /api/members`, `POST /api/members/bulk`, `PATCH /api/members/:id/toggle-access` |
| **Prayer Chains** | Full CRUD + assignments at `/api/prayer-chains` |
| **Payments** | Full CRUD + records at `/api/payments` |
| **Rehearsals** | Full CRUD + attendance at `/api/rehearsals` |
| **Checklists** | Full CRUD + items at `/api/checklists` |
| **Uniforms** | Full CRUD + readiness at `/api/uniform-events` |
| **Songs** | Full CRUD + assignments at `/api/songs` |
| **Chat** | Rooms and messages at `/api/chat` |

### WebSocket Events

**Server → Client:**
- `new-message` - New chat message
- `message-deleted` - Message deleted
- `user-typing` - User is typing
- `user-stop-typing` - Stop typing indicator

**Client → Server:**
- `join-room` - Join a chat room
- `leave-room` - Leave a chat room
- `typing` - Indicate typing
- `stop-typing` - Stop typing

## Project Structure

```
RECHOIR/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js        # Prisma client
│   │   │   └── index.js           # App configuration
│   │   ├── controllers/           # Route handlers
│   │   │   ├── authController.js
│   │   │   ├── memberController.js
│   │   │   ├── prayerChainController.js
│   │   │   ├── paymentController.js
│   │   │   ├── rehearsalController.js
│   │   │   ├── checklistController.js
│   │   │   ├── uniformController.js
│   │   │   ├── songController.js
│   │   │   ├── chatController.js
│   │   │   ├── teamController.js
│   │   │   └── notificationController.js
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT authentication
│   │   │   └── errorHandler.js    # Global error handling
│   │   ├── routes/                # API routes
│   │   ├── utils/
│   │   │   ├── jwt.js             # Token generation
│   │   │   └── validation.js      # Zod schemas
│   │   └── index.js               # Express app entry
│   ├── package.json
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/               # Reusable UI components
│   │   │   │   ├── Avatar.jsx
│   │   │   │   ├── Badge.jsx
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   └── ProgressBar.jsx
│   │   │   └── layout/
│   │   │       ├── MainLayout.jsx
│   │   │       └── Sidebar.jsx
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── MemberCodeLogin.jsx
│   │   │   │   ├── SuperAdminRegister.jsx
│   │   │   │   └── TeamLeadRegister.jsx
│   │   │   ├── dashboard/
│   │   │   │   └── Dashboard.jsx
│   │   │   ├── members/
│   │   │   │   └── Members.jsx
│   │   │   ├── prayer-chains/
│   │   │   │   └── PrayerChains.jsx
│   │   │   ├── payments/
│   │   │   │   └── Payments.jsx
│   │   │   ├── rehearsals/
│   │   │   │   └── Rehearsals.jsx
│   │   │   ├── checklists/
│   │   │   │   └── Checklists.jsx
│   │   │   ├── uniforms/
│   │   │   │   └── Uniforms.jsx
│   │   │   ├── songs/
│   │   │   │   └── Songs.jsx
│   │   │   └── chat/
│   │   │       └── Chat.jsx
│   │   ├── services/
│   │   │   └── api.js             # Axios instance
│   │   ├── stores/
│   │   │   └── authStore.js       # Zustand auth store
│   │   ├── utils/
│   │   │   └── theme.js           # Design tokens
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── README.md
│
├── SPEC.md                         # Full specification document
└── README.md                       # This file
```

## Environment Variables

### Backend (.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/rechoir"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-token-secret"
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000
```

## License

MIT
