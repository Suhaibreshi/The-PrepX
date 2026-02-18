# PREPX IQ Nexus

> **Stack:** React 18 + Vite + TypeScript + Tailwind CSS + Supabase (BaaS)

A comprehensive education management system for managing students, teachers, batches, fees, attendance, exams, and communications.

---

## Features

### Core Modules

| Module | Description |
|--------|-------------|
| **Dashboard** | Real-time KPIs, charts, and quick actions |
| **Students** | Full CRUD with batch assignment, parent linking |
| **Teachers** | Management with course assignments |
| **Batches** | Course batches with schedules and student rosters |
| **Parents** | Parent profiles with student relationships |
| **Attendance** | Daily attendance tracking with batch filters |
| **Exams** | Exam scheduling with results management |
| **Fees** | Fee collection with payment tracking |
| **Messages** | Real-time messaging system |
| **Notifications** | Live notification center |
| **Reports** | Analytics and reporting |
| **Settings** | Organization settings, roles, academic years |

### Technical Features

- **Authentication** - Supabase Auth with role-based access
- **Real-time Updates** - Live data sync via Supabase Realtime
- **Responsive Design** - Mobile-first with Tailwind CSS
- **Type Safety** - Full TypeScript coverage
- **Data Tables** - Sortable, filterable with pagination
- **Form Validation** - React Hook Form + Zod

---

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### Database Setup

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Open **SQL Editor**
4. Run migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_complete_backend_schema.sql`
   - `supabase/migrations/003_security_fixes.sql`

---

## Project Structure

```
prepx-iq-nexus/
├── src/
│   ├── components/
│   │   ├── auth/          # Protected route wrapper
│   │   ├── dashboard/     # Stat cards, charts
│   │   ├── layout/       # AppLayout, Sidebar, TopBar
│   │   ├── shared/       # DataTable, EntityDialog, StatusBadge
│   │   └── ui/           # shadcn/ui components
│   ├── hooks/
│   │   ├── useAuth.tsx          # Auth state management
│   │   ├── useCrudHooks.ts      # TanStack Query CRUD hooks
│   │   ├── useDashboardMetrics.ts # Dashboard data hooks
│   │   └── use-mobile.tsx       # Mobile detection
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts        # Supabase client
│   │       └── types.ts          # Database types
│   ├── lib/
│   │   └── utils.ts              # Utility functions
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Students.tsx
│   │   ├── Teachers.tsx
│   │   ├── Batches.tsx
│   │   ├── Parents.tsx
│   │   ├── Attendance.tsx
│   │   ├── Exams.tsx
│   │   ├── Fees.tsx
│   │   ├── Messages.tsx
│   │   ├── Notifications.tsx
│   │   ├── Reports.tsx
│   │   ├── Settings.tsx
│   │   ├── Login.tsx
│   │   └── NotFound.tsx
│   ├── services/                 # Service layer
│   │   ├── api.ts
│   │   ├── StudentService.ts
│   │   ├── TeacherService.ts
│   │   ├── FeeService.ts
│   │   ├── BatchService.ts
│   │   ├── CourseService.ts
│   │   ├── AttendanceService.ts
│   │   ├── ExamService.ts
│   │   └── NotificationService.ts
│   ├── types/
│   │   └── database.ts           # TypeScript interfaces
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   └── migrations/               # Database migrations
│       ├── 001_initial_schema.sql
│       ├── 002_complete_backend_schema.sql
│       └── 003_security_fixes.sql
├── public/
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |
| `npm run test` | Run Vitest tests |

---

## Role-Based Access

| Role | Permissions |
|------|-------------|
| `super_admin` | Full system access |
| `management_admin` | All except system settings |
| `academic_coordinator` | Students, teachers, batches, attendance, exams |
| `teacher` | Own batches, attendance, view students |
| `finance_manager` | Fees, reports |
| `support_staff` | View only |

---

## Security

- **Row Level Security (RLS)** - Database-level access control
- **Server-side Validation** - CHECK constraints on critical fields
- **Audit Logging** - Append-only audit logs
- **HttpOnly Sessions** - Configure in Supabase Dashboard for production

---

## License

MIT
