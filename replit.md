# RTP Live - Slot Game Information Platform

## Overview

RTP Live is a web application that displays Return To Player (RTP) information for slot games. The platform organizes games by providers and shows real-time RTP values with visual progress indicators. It includes both a public-facing homepage for viewing game information and an admin panel for managing providers, games, and site settings.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Animations**: Framer Motion for UI transitions
- **Form Handling**: React Hook Form with Zod validation

The frontend follows a standard React SPA pattern with pages in `client/src/pages/` and reusable UI components in `client/src/components/ui/`. Path aliases are configured (`@/` for client source, `@shared/` for shared code).

### Backend Architecture
- **Framework**: Express 5 on Node.js
- **Language**: TypeScript with ESM modules
- **Build Tool**: Custom build script using esbuild for server, Vite for client

The server implements a REST API with routes defined in `server/routes.ts`. The storage layer (`server/storage.ts`) abstracts database operations using the repository pattern.

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `db:push` command for schema sync

Database schema includes:
- `users` - Admin authentication
- `providers` - Game providers (e.g., Pragmatic, PG Soft)
- `games` - Individual slot games with RTP values and pinnedOrder for admin pinning
- `siteSettings` - Customizable site appearance including:
  - Colors (primary, title, border, button, play button, aura, background, secondary, accent)
  - Images (logo, banner, background image)
  - Effects (aura intensity 0-100%)
  - RTP change interval
  - Admin credentials (username only, password change removed)
  - Banner buttons configuration

## Recent Changes

### Admin Panel Light Theme Redesign (Feb 2026)
- Redesigned admin panel from dark theme to bright/light theme
- White backgrounds with gray text for better readability
- Login page also updated to match light theme
- Sidebar on left with menu items: Pengaturan Situs, Warna & Efek, URL & Banner, Provider & Games
- Active sidebar tab uses blue-600 with white text
- All cards, forms, inputs use clean white/gray styling
- Added back to site and logout buttons at bottom of sidebar

### SEO Settings (Feb 2026)
- Added SEO settings tab in admin panel sidebar with Search icon
- Meta Title, Meta Description, Meta Keywords form fields
- Google Search Console verification code input
- SEO meta tags applied dynamically on homepage via useEffect
- GSC verification meta tag injected into document head
- Database fields: seoMetaTitle, seoMetaDescription, seoMetaKeywords, gscVerification in siteSettings

### RTP Filter (Feb 2026)
- Added RTP category filter buttons on homepage: Semua, RTP Tinggi, RTP Medium, RTP Rendah
- Filters by game.category field ("high", "mid", "low")
- Filter resets pagination to page 1 when changed
- Styled with dynamic primary color from site settings

### RTP Rotation & Game Pinning (Feb 2026)
- 5 hot games per provider (category "high", RTP 90-99)
- 20 total games with RTP > 70 per provider (5 hot + 15 mid, RTP 71-89)
- Remaining games get low RTP (30-70)
- Hot games + distribution reshuffles every 4 minutes
- RTP values update every 1 minute, patterns every 10 minutes
- Homepage shows games in random order (not sorted by RTP)
- Admin can pin games to top of each provider (pinnedOrder field)
- Pinned games always appear first, ordered by pin number
- Client fetches server RTP values (no client-side randomization)

### API Structure
RESTful endpoints prefixed with `/api/`:
- `GET/PUT /api/settings` - Site configuration
- `GET/POST /api/providers` - Provider management
- `GET/PUT/DELETE /api/providers/:id` - Individual provider operations
- `GET/POST /api/games` - Game management
- `GET/PUT/DELETE /api/games/:id` - Individual game operations
- `GET /api/games/provider/:providerId` - Games filtered by provider

### Development vs Production
- **Development**: Vite dev server with HMR, proxied through Express
- **Production**: Static file serving from `dist/public`, bundled server in `dist/index.cjs`

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **pg**: Node.js PostgreSQL client
- **connect-pg-simple**: PostgreSQL session store (available but sessions not currently implemented)

### UI Component Library
- **shadcn/ui**: Pre-built accessible components based on Radix UI primitives
- **Radix UI**: Low-level UI primitives for dialogs, dropdowns, tabs, etc.

### Build & Development Tools
- **Vite**: Frontend build tool and dev server
- **esbuild**: Server bundling for production
- **Drizzle Kit**: Database migration tooling

### Replit-Specific Integrations
- **@replit/vite-plugin-runtime-error-modal**: Error overlay in development
- **@replit/vite-plugin-cartographer**: Development tooling (dev only)
- **@replit/vite-plugin-dev-banner**: Development banner (dev only)