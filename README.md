# FlowBoard — Project Management Reimagined

A modern ClickUp clone built with Next.js 16, TypeScript, and PostgreSQL. FlowBoard brings clarity to your workflow — organize projects, collaborate in real-time, and ship faster, all in one beautiful workspace.

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS v4, `tailwind-merge`, `clsx`, `class-variance-authority`, `tailwindcss-animate` |
| **UI Components** | Radix UI primitives, Lucide React icons |
| **Animation** | Framer Motion |
| **Database** | PostgreSQL via `@prisma/adapter-pg` |
| **ORM** | Prisma v7 (with custom generator output) |
| **Authentication** | NextAuth v5 (Credentials, Google, GitHub) |
| **State Management** | Zustand, TanStack React Query v5 |
| **File Uploads** | UploadThing |
| **Email** | Resend |
| **Real-time** | Socket.io (server + client) |
| **Forms & Validation** | Zod |
| **Drag & Drop** | `@dnd-kit` (core, sortable, utilities) |
| **Charts** | Recharts |
| **Date Handling** | date-fns |
| **Password Hashing** | bcryptjs |

## Features

- **Workspaces** — Create and manage multiple workspaces with custom slugs and icons
- **Projects** — Organize work into projects with color-coding, icons, and favorite marking
- **Task Management** — Full CRUD with title, description, status, priority, subtasks, and ordering
- **Kanban Board** — Drag-and-drop kanban with columns for each task status
- **Multiple Views** — List view, board view, table view, calendar view, timeline/Gantt view
- **Task Assignments** — Assign tasks to team members
- **Labels & Filtering** — Color-coded labels with filtering capabilities
- **Comments** — Threaded comments on tasks with user mentions
- **Attachments** — File uploads via UploadThing
- **Time Tracking** — Log time entries on tasks with duration and notes
- **Task Dependencies** — Define dependencies between tasks (blocking/blocked-by)
- **Recurring Tasks** — Support for recurring task schedules
- **Activity Log** — Detailed audit trail of all actions
- **Notifications** — In-app notifications for assignments, comments, mentions, status changes, and due-date reminders
- **Real-time Updates** — Socket.io for live collaboration
- **Authentication** — Email/password, Google OAuth, GitHub OAuth
- **Role-based Access** — Owner, admin, member, guest roles at both user and workspace level
- **Invitations** — Email-based workspace invitations with token expiry
- **Admin Dashboard** — Analytics and user management for platform admins
- **Command Palette** — Quick keyboard-driven navigation (Cmd+K)
- **Dark Mode** — System-aware dark/light theme via `next-themes`
- **Responsive Design** — Mobile-friendly layout with collapsible sidebar
- **Pricing Page** — Marketing website with feature showcase, testimonials, and pricing tiers
- **Keyboard Shortcuts** — Power-user keyboard navigation
- **Email Notifications** — Resend integration for transactional emails

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **PostgreSQL** 14+ (local or cloud — [Railway](https://railway.app), [Supabase](https://supabase.com), or [Neon](https://neon.tech))
- **npm** (or pnpm / yarn)
- **Git**

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/flowboard.git
cd flowboard

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and secrets

# Run database migrations
npx prisma migrate dev

# Seed the database with sample data
npx prisma db seed

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).  
Log in as `admin@clickupclone.com` / `password123` or `user@clickupclone.com` / `password123`.

## Environment Setup

Copy `.env.example` to `.env` and fill in the required values:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | NextAuth encryption secret |
| `AUTH_URL` | Yes | Application base URL |
| `AUTH_GITHUB_ID` | No | GitHub OAuth client ID |
| `AUTH_GITHUB_SECRET` | No | GitHub OAuth client secret |
| `AUTH_GOOGLE_ID` | No | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | No | Google OAuth client secret |
| `UPLOADTHING_SECRET` | No | UploadThing secret key |
| `UPLOADTHING_APP_ID` | No | UploadThing app ID |
| `RESEND_API_KEY` | No | Resend API key for email |
| `NEXT_PUBLIC_PUSHER_KEY` | No | Pusher public key (real-time) |
| `PUSHER_SECRET` | No | Pusher secret |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | No | Pusher cluster |

## Database Migration

```bash
# Create & apply migrations
npx prisma migrate dev --name init

# Apply pending migrations (production)
npx prisma migrate deploy
```

## Seeding

```bash
npx prisma db seed
```

The seed script creates:
- 2 users (`admin@clickupclone.com`, `user@clickupclone.com`)
- 1 workspace (Acme Corp)
- 2 projects (Website Redesign, Mobile App v2)
- 12 tasks across projects with assignments
- 6 labels (bug, feature, enhancement, design, documentation, urgent)
- 6 comments
- 6 activity log entries
- 5 notifications

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
clickup-clone/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Database seeder
│   └── migrations/            # Migration files
├── public/                    # Static assets
├── src/
│   ├── actions/               # Server actions
│   │   ├── notification.ts
│   │   ├── project.ts
│   │   ├── task.ts
│   │   └── workspace.ts
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Auth routes
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── (dashboard)/       # Dashboard routes
│   │   │   ├── dashboard/
│   │   │   ├── settings/
│   │   │   └── workspace/
│   │   │       └── [workspaceId]/
│   │   │           ├── admin/
│   │   │           ├── projects/[projectId]/
│   │   │           └── settings/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/
│   │   │   ├── trpc/
│   │   │   └── uploadthing/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── admin/
│   │   │   ├── analytics-dashboard.tsx
│   │   │   └── user-management.tsx
│   │   ├── auth/
│   │   │   └── auth-guard.tsx
│   │   ├── kanban/
│   │   │   ├── kanban-board.tsx
│   │   │   ├── kanban-card.tsx
│   │   │   └── kanban-column.tsx
│   │   ├── layout/
│   │   │   ├── command-palette.tsx
│   │   │   ├── dashboard-layout.tsx
│   │   │   ├── navbar.tsx
│   │   │   ├── providers.tsx
│   │   │   └── sidebar.tsx
│   │   ├── notifications/
│   │   │   └── notification-center.tsx
│   │   ├── tasks/
│   │   │   ├── task-calendar-view.tsx
│   │   │   ├── task-create-dialog.tsx
│   │   │   ├── task-list-view.tsx
│   │   │   ├── task-modal.tsx
│   │   │   ├── task-table-view.tsx
│   │   │   └── task-timeline-view.tsx
│   │   └── ui/                # Radix + custom UI primitives
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── command.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── popover.tsx
│   │       ├── progress.tsx
│   │       ├── scroll-area.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── skeleton.tsx
│   │       ├── switch.tsx
│   │       ├── tabs.tsx
│   │       ├── toast.tsx
│   │       └── tooltip.tsx
│   ├── generated/prisma/      # Prisma client (auto-generated)
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-keyboard.ts
│   │   ├── use-notifications.ts
│   │   ├── use-projects.ts
│   │   ├── use-tasks.ts
│   │   └── use-workspace.ts
│   ├── lib/
│   │   ├── auth-actions.ts
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── db.ts
│   │   ├── email.ts
│   │   ├── notifications.ts
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── upload.ts
│   │   ├── utils.ts
│   │   └── validations.ts     # Zod schemas
│   ├── store/                 # Zustand state stores
│   │   ├── use-notification-store.ts
│   │   ├── use-task-store.ts
│   │   ├── use-ui-store.ts
│   │   └── use-workspace-store.ts
│   └── types/
│       ├── index.ts
│       └── next-auth.d.ts
├── .env.example
├── .gitignore
├── AGENTS.md
├── CLAUDE.md
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── prisma.config.ts           # Prisma v7 config
└── tsconfig.json
```

## Deployment

### Frontend (Vercel)

```bash
npm run build
npx vercel --prod
```

Set all environment variables in Vercel project settings. Migrations must be run on the database before the build completes.

### Database (Railway / Supabase / Neon)

Create a PostgreSQL instance on your provider of choice, copy the connection string to `DATABASE_URL`, and run:

```bash
npx prisma migrate deploy
npx prisma db seed
```

See [DEPLOY.md](./DEPLOY.md) for a full deployment guide.

## Screenshots

<!-- TODO: Add screenshots of the application -->
| Landing Page | Dashboard | Kanban Board |
|-------------|-----------|--------------|
| _placeholder_ | _placeholder_ | _placeholder_ |

| Task Detail | Dark Mode | Mobile View |
|-------------|-----------|-------------|
| _placeholder_ | _placeholder_ | _placeholder_ |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes using conventional commits (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

Please ensure your code passes linting (`npm run lint`) and follows the existing code style (no semicolons, single quotes, strict TypeScript, functional patterns).

## License

MIT — see [LICENSE](./LICENSE) for details.
