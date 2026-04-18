# RECHOIR - Choir Operations Management System

## 1. Concept & Vision

RECHOIR is a professional-grade CRM-style platform purpose-built for African church choir management. It transforms chaotic choir operations—spreadsheets, WhatsApp groups, and memory-based tracking—into a unified, secure command center. The system embodies the reliability and trust of enterprise software while remaining accessible to church communities with varying technical literacy.

The platform feels like Salesforce meets ChurchStack: data-driven, organized, and deeply purposeful.

## 2. Design Language

### Aesthetic Direction
**Reference:** Professional CRM tools (Salesforce, HubSpot) with warm, approachable African-inspired accents. Clean data presentation with subtle cultural warmth through color.

### Color Palette
- **Primary:** Royal Blue (#1e40af) - Trust, professionalism, spiritual depth
- **Secondary:** Rich Gold (#d97706) - African warmth, excellence, celebration
- **Accent:** Emerald Green (#059669) - Growth, readiness, success states
- **Warning:** Amber (#f59e0b) - Pending, due soon alerts
- **Danger:** Rose Red (#dc2626) - Overdue, critical alerts
- **Background:** Slate Gray (#0f172a) - Admin dashboard dark theme
- **Surface:** Cool Gray (#1e293b) - Cards and elevated surfaces
- **Text Primary:** Near White (#f8fafc)
- **Text Secondary:** Muted Gray (#94a3b8)

### Typography
- **Primary Font:** Inter (clean, professional, excellent readability)
- **Headings:** Inter Bold, tracking tight
- **Body:** Inter Regular, 16px base
- **Monospace:** JetBrains Mono (for codes, IDs)

### Spatial System
- Base unit: 4px
- Component padding: 16px / 24px
- Section spacing: 32px / 48px
- Card border-radius: 8px
- Button border-radius: 6px

### Motion Philosophy
- Subtle, purposeful transitions (200-300ms ease-out)
- No decorative animations—every motion communicates state change
- Loading states: skeleton screens, not spinners
- Success/error feedback: brief toast notifications

### Visual Assets
- **Icons:** Lucide React (consistent stroke width, professional)
- **Avatars:** Initials-based with gradient backgrounds
- **Charts:** Recharts for analytics dashboards
- **Empty states:** Illustrated with clear CTA

## 3. Layout & Structure

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ SUPER ADMIN (RECHOIR)                                           │
│ - Manages all choirs/teams globally                              │
│ - Oversees all team leads and members                            │
│ - Platform-wide analytics                                        │
└─────────────────────────────────────────────────────────────────┘
         │
         │ creates
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ TEAM LEAD (Organization Admin)                                   │
│ - Manages single choir team                                      │
│ - Adds/edits/removes team members                                │
│ - Generates unique access codes                                  │
│ - Full operational control                                       │
└─────────────────────────────────────────────────────────────────┘
         │
         │ grants access via code
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ TEAM MEMBER                                                      │
│ - Accesses via email + team code                                │
│ - Views assigned tasks, schedules, songs                         │
│ - Participates in chats                                          │
│ - Limited to own data and team-wide info                         │
└─────────────────────────────────────────────────────────────────┘
```

### Page Structure

#### Authentication Pages
- `/auth/super-admin/register` - RECHOIR admin signup
- `/auth/super-admin/login` - RECHOIR admin login
- `/auth/team-lead/register` - Team lead signup
- `/auth/team-lead/login` - Team lead login
- `/auth/member/login` - Member access via team code

#### Super Admin Dashboard (`/super-admin`)
- Overview statistics (total choirs, members, activity)
- Choir management table
- Platform health metrics
- Settings

#### Team Lead Dashboard (`/team`)
- Team overview
- Member management
- All operational modules accessible

#### Team Member Dashboard (`/member`)
- Personal dashboard
- Assigned tasks and songs
- Team calendar
- Chat access

## 4. Features & Interactions

### Authentication & Authorization

#### Super Admin (RECHOIR)
- **Signup:** Email, password (min 8 chars, requires uppercase, number, special char)
- **Login:** Email + password
- **Security:** JWT tokens (15min access, 7day refresh), rate limiting, audit log
- **Code Generation:** Auto-generates unique 8-char alphanumeric team code per choir created

#### Team Lead
- **Signup:** Name, email, password, phone, choir name
- **Login:** Email + password
- **Member Addition:**
  - Manual: Add via email, phone, name, specialization (singer/instrumentalist/team-lead)
  - Bulk: Upload Google Sheet (columns: name, email, phone, specialization)
- **Access Code:** Generates unique 6-digit numeric code for team members
- **Access Control:** Enable/disable any member's access with one toggle

#### Team Member
- **Login:** Email + team access code (6-digit)
- **No password required** - code is the credential
- **First Login:** Prompted to set personal password
- **Password Reset:** Via email verification

### Module: Prayer Chains

**Structure:**
- Chain name, description, start date, end date (optional)
- Assigned members (multi-select)
- Chain type: Continuous (24/7) | Scheduled (specific times)

**Interactions:**
- Create chain → Assign members → Set schedule
- View chain calendar (who's on when)
- Mark prayer answered (toggles chain to "completed" with celebration UI)
- Shift coverage: If member can't make their slot, reassign within chain

**States:**
- Active (green pulse indicator)
- Completed (gold badge)
- At Risk (amber - member not confirmed)

### Module: Due Payment Tracker

**Structure:**
- Payment title (e.g., "Uniform - Easter 2025")
- Amount
- Due date
- Assigned members (individual or group)
- Payment status per member

**Interactions:**
- Create payment → Assign members → Set due date
- Members mark "Paid" with optional proof upload
- Auto-reminder: 7 days before, 3 days before, day-of, overdue
- Team lead views collection progress (percentage bar)

**States:**
- Pending (gray)
- Partial (amber - some paid)
- Completed (green - all paid)
- Overdue (red - past due date)

### Module: Rehearsal Schedules

**Structure:**
- Title, date, start time, end time
- Location (text or map link)
- Agenda/items to practice
- Attendance taking enabled

**Interactions:**
- Create rehearsal → Auto-notify all members
- Attendance: Mark present/absent/excused per member
- Late tracking (arrival time logged)
- Post-rehearsal: Attach notes, mark song readiness

**Views:**
- Calendar view (monthly/weekly)
- List view (upcoming rehearsals)
- Attendance report per member

### Module: Attendance

**Tracks:**
- Rehearsal attendance
- Service/Sunday attendance
- Custom events

**Metrics per member:**
- Attendance rate (percentage)
- Excused vs unexcused
- Trend line

**Team Lead view:**
- Attendance heatmap
- At-risk members (below 80% attendance)
- Exportable reports

### Module: Productivity

**Weekly Checklist per Member:**
- Customizable checklist items
- Mark complete/incomplete
- Notes field per item

**Overall Team Performance:**
- Aggregate progress bars
- Top contributors leaderboard
- Weekly digest email to team lead

### Module: Uniform Calendar

**Structure:**
- Event name (e.g., "Easter Service", "Harvest Crusade")
- Date
- Required uniform description
- Visual reference image upload
- Assigned members

**Interactions:**
- Calendar view of all uniform requirements
- Checklist per event: Who has uniform ready?
- "Uniform Ready" toggle per member

**States:**
- Ready (green)
- Pending (amber)
- Not Ready (red)
- Not Applicable (gray)

### Module: Weekly Song List & Readiness

**Sunday Preparation Flow:**

1. **Team Lead creates weekly song list:**
   - Song title, key, YouTube link (optional)
   - Practice notes
   - Target readiness date

2. **Member Readiness Tracking:**
   - Per song: "Not Started" | "Learning" | "Ready" | "Perfect"
   - Self-assessment with optional note
   - Team lead can override status

3. **Readiness Dashboard (Team Lead):**
   - Per song: Progress bar (% of team ready)
   - Song requiring attention (less than 60% ready)
   - Per member: Songs they're behind on

4. **Visual Indicator:**
   - Sunday D-6, D-3, D-1 countdowns
   - Red/amber/green status per song

### Module: Team Chat

**Structure:**
- Team-wide chat
- Group chats (by specialization: "All Singers", "Instrumentalists")
- Direct messages

**Features:**
- Real-time messaging (WebSocket)
- Message types: Text, file attachment, voice note
- Read receipts
- @mentions
- Message reactions

**Security:**
- Only team members can access team chat
- Chat history persists
- Admin can delete messages

### Module: Team Management

**Team Lead actions:**
- Add member (manual or via Google Sheet)
- Edit member details
- Change member specialization
- Enable/disable access (soft lockout)
- Remove member (archive)
- Assign/change team lead role

**Google Sheet Import:**
- Accepts .xlsx, .csv
- Columns: name*, email*, phone, specialization
- Preview before import
- Handles duplicates (update existing vs skip)

### Notifications

**In-App:**
- Bell icon with unread count
- Dropdown list of recent notifications
- Mark read/unread

**Channels:**
- In-app (always)
- Email (optional, configurable)

**Triggers:**
- New rehearsal scheduled
- Payment due reminder
- Prayer chain shift reminder
- Chat mentions
- Attendance marked
- Song assigned
- Access enabled/disabled

## 5. Component Inventory

### Buttons
- **Primary:** Blue (#1e40af) bg, white text, hover darken 10%
- **Secondary:** Transparent, blue border, blue text
- **Danger:** Rose (#dc2626) bg, white text
- **Ghost:** No border, gray text, hover bg-gray-100
- **States:** Default, hover, active (scale 98%), disabled (opacity 50%), loading (spinner)

### Input Fields
- **Default:** Gray border (#374151), rounded-md, 44px height
- **Focus:** Blue ring (2px), border blue
- **Error:** Red border, red ring, error message below
- **Disabled:** Gray bg, cursor not-allowed

### Cards
- **Default:** Gray-800 bg (#1e293b), rounded-lg, subtle shadow
- **Elevated:** Slightly lighter bg, stronger shadow
- **Interactive:** Hover lift (translateY -2px, shadow increase)
- **Border:** Optional 1px border-gray-700

### Tables
- **Header:** Sticky, gray-700 bg, uppercase small text
- **Rows:** Alternating subtle bg, hover highlight
- **Actions:** Icon buttons on hover
- **Pagination:** Bottom right, showing range + total

### Modals
- **Backdrop:** Black 50% opacity, blur(4px)
- **Content:** Centered, max-width based on size prop, rounded-lg
- **Header:** Title + close X button
- **Footer:** Action buttons right-aligned

### Toast Notifications
- **Success:** Green left border, checkmark icon
- **Error:** Red left border, X icon
- **Warning:** Amber left border, alert icon
- **Info:** Blue left border, info icon
- **Position:** Top-right, stacked, auto-dismiss 5s

### Avatar
- **Size:** sm (32px), md (40px), lg (56px), xl (80px)
- **Content:** Initials on gradient background
- **Group:** Overlapping stack with +N indicator

### Badge/Tag
- **Status:** Colored bg matching status, white text, rounded-full
- **Specialization:** Outlined style, icon + text

### Progress Bar
- **Height:** 8px, rounded-full
- **Track:** Gray-700
- **Fill:** Gradient based on percentage (red < 40%, amber < 70%, green ≥ 70%)

### Calendar
- **Grid:** 7-column, clean lines, today highlighted
- **Event:** Colored dot or small bar, tooltip on hover
- **Navigation:** Month/year with prev/next arrows

### Empty States
- **Illustration:** Simple line art (optional)
- **Message:** What this section is about
- **CTA:** Primary button to add/create

## 6. Technical Approach

### Stack
- **Backend:** Node.js + Express.js
- **Database:** PostgreSQL (via Prisma ORM)
- **Auth:** JWT + Refresh tokens
- **Real-time:** Socket.io
- **File Storage:** Local (production: S3-compatible)
- **Validation:** Zod
- **API Style:** RESTful

### Database Schema

```
User (Super Admin)
├── id (uuid)
├── email (unique)
├── passwordHash
├── name
├── role: SUPER_ADMIN
├── createdAt
└── updatedAt

Team (Choir Organization)
├── id (uuid)
├── name
├── code (unique 8-char alphanumeric)
├── superAdminId → User
├── createdAt
└── updatedAt

TeamLead
├── id (uuid)
├── email (unique)
├── passwordHash
├── name
├── phone
├── teamId → Team
├── createdAt
└── updatedAt

Member
├── id (uuid)
├── email (unique)
├── accessCodeHash
├── name
├── phone
├── specialization: SINGER | INSTRUMENTALIST | TEAM_LEAD | OFFICER
├── isActive: boolean
├── teamId → Team
├── createdAt
└── updatedAt

PrayerChain
├── id (uuid)
├── name
├── description
├── type: CONTINUOUS | SCHEDULED
├── startDate
├── endDate (nullable)
├── teamId → Team
├── createdAt
└── updatedAt

PrayerChainAssignment
├── id (uuid)
├── chainId → PrayerChain
├── memberId → Member
├── scheduledTime (nullable)
├── status: ACTIVE | COMPLETED
└── createdAt

DuePayment
├── id (uuid)
├── title
├── amount
├── dueDate
├── teamId → Team
├── createdAt
└── updatedAt

PaymentRecord
├── id (uuid)
├── paymentId → DuePayment
├── memberId → Member
├── isPaid: boolean
├── paidAt (nullable)
├── proofUrl (nullable)
└── createdAt

Rehearsal
├── id (uuid)
├── title
├── date
├── startTime
├── endTime
├── location
├── agenda (text)
├── teamId → Team
├── createdAt
└── updatedAt

Attendance
├── id (uuid)
├── rehearsalId → Rehearsal
├── memberId → Member
├── status: PRESENT | ABSENT | EXCUSED
├── arrivalTime (nullable)
└── createdAt

WeeklyChecklist
├── id (uuid)
├── title
├── weekStartDate
├── teamId → Team
├── createdAt
└── updatedAt

ChecklistItem
├── id (uuid)
├── checklistId → WeeklyChecklist
├── memberId → Member
├── description
├── isCompleted: boolean
├── completedAt (nullable)
└── createdAt

UniformEvent
├── id (uuid)
├── name
├── date
├── description
├── imageUrl (nullable)
├── teamId → Team
├── createdAt
└── updatedAt

UniformReadiness
├── id (uuid)
├── eventId → UniformEvent
├── memberId → Member
├── isReady: boolean
└── createdAt

Song
├── id (uuid)
├── title
├── key
├── youtubeUrl (nullable)
├── practiceNotes (nullable)
├── targetReadinessDate
├── teamId → Team
├── createdAt
└── updatedAt

SongAssignment
├── id (uuid)
├── songId → Song
├── memberId → Member
├── status: NOT_STARTED | LEARNING | READY | PERFECT
├── note (nullable)
└── updatedAt

ChatRoom
├── id (uuid)
├── name
├── type: TEAM | GROUP | DIRECT
├── teamId → Team
├── createdAt
└── updatedAt

ChatMessage
├── id (uuid)
├── roomId → ChatRoom
├── senderId → Member | TeamLead
├── content
├── type: TEXT | FILE | VOICE
├── fileUrl (nullable)
├── createdAt
└── readAt (nullable)

Notification
├── id (uuid)
├── userId (Member | TeamLead)
├── title
├── body
├── isRead: boolean
├── createdAt
└── readAt
```

### API Endpoints

#### Auth
- `POST /api/auth/super-admin/register`
- `POST /api/auth/super-admin/login`
- `POST /api/auth/team-lead/register`
- `POST /api/auth/team-lead/login`
- `POST /api/auth/member/login`
- `POST /api/auth/member/set-password`
- `POST /api/auth/refresh`

#### Teams (Super Admin)
- `GET /api/teams` - List all teams
- `POST /api/teams` - Create team
- `GET /api/teams/:id` - Get team details
- `PATCH /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

#### Members (Team Lead)
- `GET /api/members` - List team members
- `POST /api/members` - Add member
- `POST /api/members/bulk` - Bulk import (Google Sheet)
- `GET /api/members/:id` - Get member
- `PATCH /api/members/:id` - Update member
- `PATCH /api/members/:id/toggle-access` - Enable/disable access

#### Prayer Chains
- `GET /api/prayer-chains` - List chains
- `POST /api/prayer-chains` - Create chain
- `GET /api/prayer-chains/:id` - Get chain with assignments
- `PATCH /api/prayer-chains/:id` - Update chain
- `DELETE /api/prayer-chains/:id` - Delete chain
- `POST /api/prayer-chains/:id/assignments` - Add assignment
- `PATCH /api/prayer-chains/:id/assignments/:assignmentId` - Update assignment
- `POST /api/prayer-chains/:id/complete` - Mark as answered

#### Payments
- `GET /api/payments` - List payments
- `POST /api/payments` - Create payment
- `GET /api/payments/:id` - Get payment with records
- `PATCH /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment
- `PATCH /api/payments/:id/records/:recordId` - Update member payment status

#### Rehearsals
- `GET /api/rehearsals` - List rehearsals
- `POST /api/rehearsals` - Create rehearsal
- `GET /api/rehearsals/:id` - Get rehearsal with attendance
- `PATCH /api/rehearsals/:id` - Update rehearsal
- `DELETE /api/rehearsals/:id` - Delete rehearsal
- `PATCH /api/rehearsals/:id/attendance/:memberId` - Mark attendance

#### Weekly Checklists
- `GET /api/checklists` - List checklists
- `POST /api/checklists` - Create checklist
- `GET /api/checklists/:id` - Get checklist with items
- `PATCH /api/checklists/:id/items/:itemId` - Toggle item completion

#### Uniform Events
- `GET /api/uniform-events` - List events
- `POST /api/uniform-events` - Create event
- `GET /api/uniform-events/:id` - Get event with readiness
- `PATCH /api/uniform-events/:id` - Update event
- `PATCH /api/uniform-events/:id/readiness/:memberId` - Toggle readiness

#### Songs
- `GET /api/songs` - List songs
- `POST /api/songs` - Create song
- `GET /api/songs/:id` - Get song with assignments
- `PATCH /api/songs/:id` - Update song
- `DELETE /api/songs/:id` - Delete song
- `PATCH /api/songs/:id/assignments/:memberId` - Update member readiness

#### Chat
- `GET /api/chat/rooms` - List accessible rooms
- `GET /api/chat/rooms/:id/messages` - Get messages (paginated)
- `POST /api/chat/rooms/:id/messages` - Send message
- WebSocket: `join-room`, `send-message`, `new-message`, `typing`

#### Notifications
- `GET /api/notifications` - List user notifications
- `PATCH /api/notifications/:id/read` - Mark read
- `PATCH /api/notifications/read-all` - Mark all read

### Security Measures

1. **Password Hashing:** bcrypt with cost factor 12
2. **JWT:** RS256 algorithm, short-lived access tokens
3. **Rate Limiting:** 5 attempts per 15 min on auth endpoints
4. **Input Validation:** Zod schemas on all endpoints
5. **SQL Injection:** Prevented via Prisma parameterized queries
6. **CORS:** Strict origin checking
7. **Helmet.js:** Security headers middleware
8. **Audit Log:** All admin actions logged with user + timestamp

### File Upload
- Google Sheet parsing: xlsx library
- File size limit: 10MB
- Allowed types: .xlsx, .csv
- Sanitization: Filename normalized, storage path hashed
