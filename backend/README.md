# RECHOIR Backend - Choir Operations Management System

A secure, professional-grade backend API for managing church choir operations.

## Features

- **Multi-role Authentication**: Super Admin, Team Lead, and Member roles
- **Prayer Chain Management**: Track prayer chains with member assignments
- **Payment Tracking**: Due payments with automated reminders
- **Rehearsal Scheduling**: Full attendance management
- **Weekly Checklists**: Productivity tracking per member
- **Uniform Calendar**: Event-based uniform readiness tracking
- **Song Management**: Weekly song preparation with readiness tracking
- **Real-time Chat**: Socket.io-powered team communication
- **Google Sheet Import**: Bulk member upload support

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **Real-time**: Socket.io
- **Validation**: Zod
- **File Upload**: Multer + xlsx for spreadsheet parsing

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Setup

1. **Clone and install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your PostgreSQL credentials and secrets
   ```

3. **Set up database**
   ```bash
   # Create PostgreSQL database
   psql -U postgres -c "CREATE DATABASE rechoir;"
   
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL connection string | Yes |
| JWT_SECRET | Secret for access tokens | Yes |
| JWT_REFRESH_SECRET | Secret for refresh tokens | Yes |
| PORT | Server port (default: 3000) | No |
| NODE_ENV | development/production | No |
| CORS_ORIGIN | Allowed frontend origin | Yes |

## API Endpoints

### Authentication
- `POST /api/auth/super-admin/register` - Register RECHOIR admin
- `POST /api/auth/super-admin/login` - Login as admin
- `POST /api/auth/team-lead/register` - Register team lead (admin)
- `POST /api/auth/team-lead/login` - Login as team lead
- `POST /api/auth/member/login` - Member login with access code
- `POST /api/auth/member/login-password` - Member login with password
- `POST /api/auth/refresh` - Refresh access token

### Teams (Super Admin)
- `GET /api/teams` - List all teams
- `POST /api/teams` - Create team
- `GET /api/teams/:id` - Get team details
- `PATCH /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

### Members (Team Lead)
- `GET /api/members` - List team members
- `POST /api/members` - Add member
- `POST /api/members/bulk` - Bulk import from Excel/CSV
- `GET /api/members/:id` - Get member
- `PATCH /api/members/:id` - Update member
- `PATCH /api/members/:id/toggle-access` - Enable/disable access
- `DELETE /api/members/:id` - Remove member

### Prayer Chains
- `GET /api/prayer-chains` - List chains
- `POST /api/prayer-chains` - Create chain
- `GET /api/prayer-chains/:id` - Get chain
- `PATCH /api/prayer-chains/:id` - Update chain
- `DELETE /api/prayer-chains/:id` - Delete chain
- `POST /api/prayer-chains/:id/assignments` - Add member
- `PATCH /api/prayer-chains/:id/assignments/:assignmentId` - Update assignment
- `POST /api/prayer-chains/:id/complete` - Mark as answered

### Payments
- `GET /api/payments` - List payments
- `POST /api/payments` - Create payment
- `GET /api/payments/:id` - Get payment details
- `PATCH /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment
- `PATCH /api/payments/:id/records/:recordId` - Update member status

### Rehearsals
- `GET /api/rehearsals` - List rehearsals
- `POST /api/rehearsals` - Create rehearsal
- `GET /api/rehearsals/:id` - Get rehearsal
- `PATCH /api/rehearsals/:id` - Update rehearsal
- `DELETE /api/rehearsals/:id` - Delete rehearsal
- `PATCH /api/rehearsals/:id/attendance/:memberId` - Mark attendance

### Checklists
- `GET /api/checklists` - List checklists
- `POST /api/checklists` - Create checklist
- `GET /api/checklists/:id` - Get checklist
- `PATCH /api/checklists/:id` - Update checklist
- `DELETE /api/checklists/:id` - Delete checklist
- `POST /api/checklists/:id/items` - Add item
- `PATCH /api/checklists/:id/items/:itemId` - Toggle item

### Uniform Events
- `GET /api/uniform-events` - List events
- `POST /api/uniform-events` - Create event
- `GET /api/uniform-events/:id` - Get event
- `PATCH /api/uniform-events/:id` - Update event
- `DELETE /api/uniform-events/:id` - Delete event
- `PATCH /api/uniform-events/:id/readiness/:readinessId` - Toggle readiness

### Songs
- `GET /api/songs` - List songs
- `POST /api/songs` - Create song
- `GET /api/songs/:id` - Get song
- `PATCH /api/songs/:id` - Update song
- `DELETE /api/songs/:id` - Delete song
- `POST /api/songs/:id/assign` - Assign member
- `PATCH /api/songs/:id/assignments/:assignmentId` - Update readiness
- `GET /api/songs/weekly-readiness` - Get weekly readiness report

### Chat
- `GET /api/chat/rooms` - List chat rooms
- `POST /api/chat/rooms` - Create room
- `GET /api/chat/rooms/:id/messages` - Get messages
- `POST /api/chat/rooms/:id/messages` - Send message
- `DELETE /api/chat/rooms/:id/messages/:messageId` - Delete message

### Notifications
- `GET /api/notifications` - List notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/read-all` - Mark all read
- `PATCH /api/notifications/:id/read` - Mark as read

## WebSocket Events

### Server -> Client
- `new-message` - New chat message
- `message-deleted` - Message was deleted
- `user-typing` - User is typing
- `user-stop-typing` - User stopped typing

### Client -> Server
- `join-room` - Join a chat room
- `leave-room` - Leave a chat room
- `typing` - Indicate typing
- `stop-typing` - Stop typing indicator

## Security

- Passwords hashed with bcrypt (cost factor 12)
- JWT access tokens (15 min expiry)
- JWT refresh tokens (7 day expiry)
- Rate limiting on auth endpoints (5 attempts/15 min)
- Input validation with Zod on all endpoints
- SQL injection prevented via Prisma
- Helmet.js security headers
- CORS with strict origin checking

## License

MIT
