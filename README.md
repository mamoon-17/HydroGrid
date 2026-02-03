# HydroGrid

**Intelligent Water Plant Management System**

🌐 Live Demo: **[https://hydro-grid.vercel.app/](https://hydro-grid.vercel.app/)**

## Overview

HydroGrid is a comprehensive full-stack SaaS platform designed to streamline water treatment plant operations, quality monitoring, and team management. With multi-tenancy support, role-based access control, and detailed analytics, HydroGrid transforms the way water plant operators manage their facilities.

Built using **React.js with Vite** for the frontend and **NestJS** for the backend, the system provides a modern, responsive, and efficient approach to water quality management and operational reporting.

> 💡 **The Story Behind HydroGrid**
>
> HydroGrid was born from a real-world need. While developing a custom-tailored application for a client in the water treatment industry—someone who manages and maintains multiple water plants across different locations—I recognized a significant gap in the market. Many small to medium-sized water plant operators struggle with paper-based reporting, fragmented team communication, and lack of centralized data access.
>
> That custom solution evolved into HydroGrid: a SaaS platform designed so that other businesses in the water treatment and maintenance industry can benefit from the same streamlined operations, without the need for expensive custom development. What started as a one-off project is now a scalable solution empowering operators everywhere.

## Key Features

### Plant Management

- Register and manage multiple water treatment plants (UF/RO types)
- Track plant locations with interactive map visualization using Leaflet
- Assign technicians to specific plants
- Monitor plant capacity and operational parameters
- View all plants with their current status at a glance

### Quality Reporting

- Comprehensive daily quality reports with 20+ parameters
- Track TDS, pH levels, pressure readings, and flow rates
- Log maintenance activities (backwash, membrane cleaning, CIP)
- Attach photos and media to reports for documentation
- Draft saving functionality—never lose work in progress
- Edit reports with full audit trail (edit count tracking)

### Team & Multi-Tenancy

- Full SaaS multi-tenancy architecture
- Create and manage teams with unique slugs
- Role-based access control (Owner, Admin, Member)
- Invite team members via email with secure invite codes
- Manage pending invitations and team membership

### Analytics & Insights

- Visual dashboards with key performance metrics
- Track water quality trends over time with interactive charts
- Filter and analyze reports by plant, date, and parameters
- View submission patterns and compliance metrics
- Paginated data views for handling large datasets

### Security & Authentication

- JWT-based authentication with access & refresh tokens
- Secure password hashing with bcrypt
- Cookie-based token storage with automatic refresh
- Role-based route protection on frontend and backend
- Phone number validation with international support

### Responsive Design

- Mobile-first responsive UI built with Tailwind CSS
- Intuitive sidebar navigation with role-aware menus
- Clean, accessible component library using Radix UI
- Toast notifications for real-time feedback

## Tech Stack

### Frontend

- **React.js 18** with TypeScript
- **Vite** for lightning-fast development and builds
- **Tailwind CSS** for utility-first styling
- **Radix UI** for accessible component primitives
- **TanStack Query** for server state management
- **React Router v6** for routing
- **React Leaflet** for interactive maps
- **Recharts** for data visualization
- **React Hook Form + Zod** for form handling and validation

### Backend

- **NestJS** (Node.js framework) with TypeScript
- **TypeORM** for database abstraction
- **PostgreSQL** (with Supabase support)
- **JWT** for authentication
- **Multer** for file uploads
- **Zod** for runtime validation
- **Cron** for scheduled tasks (token cleanup)

## Project Structure

```
HydroGrid/
├── frontend/                   # React frontend application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   └── ui/            # shadcn/ui component library
│   │   ├── contexts/          # React context providers
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities and API client
│   │   └── pages/             # Application pages
│   │       ├── admin/         # Admin dashboard pages
│   │       └── employee/      # Employee/technician pages
│   └── public/                # Static assets
│
├── backend/                    # NestJS backend application
│   ├── src/
│   │   ├── auth/              # Authentication module
│   │   ├── users/             # User management
│   │   ├── teams/             # Team & invitation management
│   │   ├── plants/            # Plant management
│   │   ├── reports/           # Quality reporting
│   │   ├── report_media/      # Report attachments
│   │   ├── refresh_tokens/    # Token management
│   │   ├── cron-tasks/        # Scheduled jobs
│   │   ├── config/            # Global configuration
│   │   ├── shared/            # Shared services (upload, etc.)
│   │   └── common/            # Decorators, pipes, interfaces
│   └── uploads/               # Uploaded files storage
│
└── README.md
```

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm**, **yarn**, or **bun** package manager
- **PostgreSQL** database (or Supabase account)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd HydroGrid
   ```

2. **Setup Backend**

   ```bash
   cd backend
   npm install

   # Create .env file (see Environment Variables section)

   npm run start:dev
   ```

3. **Setup Frontend**

   ```bash
   cd frontend
   npm install

   # Create .env file (see Environment Variables section)

   npm run dev
   ```

4. **Access the Application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3000`

## Environment Variables

### Frontend (.env)

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:3000
```

### Backend (.env)

Create a `.env` file in the `backend/` directory:

```env
# Database Configuration (Option 1: Connection String)
DATABASE_URL=postgresql://user:password@host:5432/database

# Database Configuration (Option 2: Individual Values)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
DATABASE_NAME=hydrogrid

# Supabase (Alternative)
SUPABASE_CONNECTION=your_supabase_connection_string

# Authentication
JWT_SECRET=your_super_secret_jwt_key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Cron Jobs (optional)
REFRESH_CLEANUP_CRON="0 0 * * *"
```

## Core Modules

| Module             | Description                                       |
| ------------------ | ------------------------------------------------- |
| **Authentication** | Signup, login, token refresh, password management |
| **Users**          | User profiles and management                      |
| **Teams**          | Multi-tenant team creation and membership         |
| **Invitations**    | Email invites with expiring codes                 |
| **Plants**         | Water plant registration and assignment           |
| **Reports**        | Daily quality reports with media attachments      |
| **Analytics**      | Trends, charts, and performance insights          |
| **Cron Tasks**     | Automated cleanup of expired refresh tokens       |

## User Roles

| Role       | Permissions                                                            |
| ---------- | ---------------------------------------------------------------------- |
| **Owner**  | Full access: manage team settings, members, plants, reports, analytics |
| **Admin**  | Manage team members, plants, view all reports and analytics            |
| **Member** | View assigned plants, submit reports, view own work history            |

## Report Parameters

HydroGrid tracks comprehensive water quality metrics:

- **Water Quality**: Raw/Permeate/Product TDS, pH levels
- **Flow Rates**: Product water flow, reject water flow
- **Pressure**: Membrane inlet/outlet, raw water inlet pressure
- **Power**: Voltage/Amperage readings
- **Maintenance**: Multimedia backwash, carbon backwash, membrane cleaning, arsenic media backwash
- **Consumables**: CIP status, chemical refill (liters), cartridge filter replacement, membrane replacement
- **Documentation**: Notes, photos, and media attachments

## Security Features

- JWT access tokens (15-minute expiry) with refresh token rotation
- Secure HTTP-only cookie storage for tokens
- Password hashing with bcrypt (10 rounds)
- Role-based guards on both frontend routes and backend endpoints
- Phone number validation using libphonenumber-js
- Input validation with Zod schemas
- Automatic token cleanup via scheduled cron jobs

## API Endpoints

### Authentication

- `POST /auth/signup` - Register new user
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `POST /auth/change-password` - Update password

### Teams

- `POST /teams` - Create new team
- `GET /teams/my-team` - Get current user's team
- `POST /teams/invite` - Invite member via email
- `POST /teams/join` - Join team with invite code
- `GET /teams/my-invitations` - View pending invitations

### Plants

- `GET /plants` - List all plants (admin/owner)
- `GET /plants/assigned` - List assigned plants (member)
- `POST /plants` - Create new plant
- `PATCH /plants/:id` - Update plant
- `DELETE /plants/:id` - Delete plant

### Reports

- `GET /reports` - List all reports (paginated)
- `POST /reports` - Create new report with media
- `PATCH /reports/:id` - Update report
- `DELETE /reports/:id` - Delete report

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is developed for educational and commercial purposes.

---

<p align="center">
  <strong>HydroGrid</strong> — Empowering water plant operators with intelligent management tools.
</p>
