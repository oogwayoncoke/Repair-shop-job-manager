# 🐑 Shepherd

> **Multi-tenant repair shop management SaaS.** Built with Django REST Framework, React, and PostgreSQL. JWT-authenticated, role-isolated, and production-ready.

---

## What It Is

Shepherd is a full-stack SaaS platform for managing repair shop operations end-to-end. Each shop is a fully isolated **tenant** — customers, inventory, technicians, work orders, and financial data are all scoped to the owning tenant. No cross-contamination.

The system supports three distinct user roles with separate dashboards and access controls, a public customer-facing intake flow, real-time work session tracking, auto-generated invoices, and a finance dashboard. Built to be used, not demoed.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Django 5.2, Django REST Framework |
| **Auth** | JWT (SimpleJWT) + django-allauth email verification |
| **Database** | PostgreSQL (UUIDs as PKs, JSONB specs, PhoneNumberField) |
| **Frontend** | React 18, Vite, Tailwind CSS v4 |
| **HTTP Client** | Axios with automatic token refresh interceptors |
| **Routing** | React Router v6 |

---

## Architecture

### Multi-Tenancy

Every model that holds shop data inherits from `TenantModel` — a base class that attaches a `tenant` FK and exposes two managers:

- `objects` — unfiltered, for internal use
- `tenant_objects` — auto-scoped to the current tenant via `contextvars`, populated by `TenantMiddleware` on every authenticated request

Tenant isolation is structural, not just filtered queries.

### Role System

| Role | Access |
|---|---|
| `OWNER` | Full dashboard, treasury config, finance overview, staff invites, inventory management |
| `TECH / OSTA` | Senior technician — claims work orders, deploys parts, manages junior techs, generates invoices |
| `TECH / SABI` | Junior technician — sees assigned tasks, punches in/out of diagnostic sessions |

Role and tech level are embedded directly in the JWT payload. No extra DB calls on protected routes.

### Token-Based Onboarding

New staff and customers are invited via signed `ActionToken` UUIDs. Tokens encode the role, tech level, and tenant. When consumed:

- **Staff (OSTA/SABI):** redirected to `/induction/:token` to set username and password
- **Customer:** redirected to `/work-order-setup/:token` to submit their device intake form

Tokens are single-use and self-destruct on consumption.

---

## Key Features

### Work Order Lifecycle

```
pending → diagnosing → parts → working → ready → completed
```

- Auto-transitions on tech assignment (`pending → diagnosing`)
- Auto-transitions on part deployment (`diagnosing/parts → working`)
- Completion requires a paid invoice — enforced at the API level

### Work Sessions (Punch In/Out)

Technicians clock in/out of work orders. The system logs `WorkSession` records with start/end timestamps. Live session time is tracked client-side with a tick counter synced to `start_time`. Completed sessions feed into the invoice labor cost calculation.

### Invoice Engine

Invoices are auto-calculated from:

1. **Labor** — base estimate + (total session time in hours × hourly rate)
2. **Parts** — price captured at deployment time (snapshot, not live catalog price)
3. **Services** — flat-rate line items attached to the order
4. **VAT** — 14% applied to subtotal

All line items are stored; invoice detail page renders a full breakdown with print support.

### Inventory / Vault

- Parts and retail products tracked with `stock_count`, `cost_price`, `retail_price`
- `low_stock_threshold` triggers a visual alert when stock drops below threshold
- Stock is decremented automatically on part deployment, restored on removal via signals

### Finance Dashboard

Owner-only view showing `total_revenue`, `total_expenses`, `net_profit`, and a category breakdown of expenses as a progress bar chart. Powered by a single aggregated API endpoint.

---

## Project Structure

```
shepherd/
├── backend/
│   ├── core/               # Django settings, URLs, WSGI/ASGI
│   ├── authentication/     # User, UserProfile, JWT, email verification
│   │   ├── models.py       # UserProfile (role, tech_level, tenant FK)
│   │   ├── serializers/    # Registration, token, profile serializers
│   │   └── views/          # Auth endpoints, email confirmation
│   └── shops/
│       ├── models/
│       │   ├── base.py     # Tenant, TenantModel, TenantManager
│       │   ├── auth.py     # ActionToken (invite/onboard tokens)
│       │   ├── operations.py # WorkOrder, Inventory, Service, WorkSession, PartUsage
│       │   ├── billing.py  # Invoice, Payment
│       │   ├── items.py    # Item, ElectronicItem, MechanicalItem
│       │   └── people.py   # Customer, Technician, Phone models
│       ├── serializers/    # Finance, operations, staff, invites
│       └── views/          # Finance, operations, staff, user_create
└── frontend/
    └── src/
        ├── pages/          # One file per route/dashboard
        ├── components/     # ProtectedRoute, VerifyEmail, Form
        ├── api.js          # Axios instance with JWT refresh interceptor
        └── constants.js    # Token key names
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL running locally

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
DB=shepherd_db
USER=your_pg_user
PASSWORD=your_pg_password
HOST=localhost
PORT=5432
```

```bash
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:8000/
```

```bash
npm run dev
```

App runs at `http://localhost:5173`.

---

## API Overview

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/authentication/register/owner/` | Register new shop owner + tenant |
| `POST` | `/authentication/token/` | Obtain JWT access + refresh tokens |
| `POST` | `/authentication/token/refresh/` | Refresh access token |
| `POST` | `/authentication/verify-email/` | Confirm email via HMAC key |
| `POST` | `/authentication/activate-tech/` | Activate staff from invite token |
| `POST` | `/authentication/onboard-customer/` | Customer device intake |

### Shops

| Method | Endpoint | Description |
|---|---|---|
| `GET/POST` | `/shops/work-orders/` | List or create work orders |
| `PATCH` | `/shops/work-orders/:id/assign-techs/` | Assign OSTA/SABI technicians |
| `POST` | `/shops/work-orders/:id/generate-invoice/` | Auto-generate invoice |
| `GET/POST` | `/shops/inventory/` | Vault management |
| `POST` | `/shops/part-usage/` | Deploy part to a work order |
| `GET/POST` | `/shops/services/` | Service catalog |
| `GET/POST` | `/shops/work-sessions/` | Session management |
| `POST` | `/shops/work-sessions/:id/start_order/` | Punch in |
| `POST` | `/shops/work-sessions/stop_session/` | Punch out |
| `GET` | `/shops/finance/summary/` | Revenue, expenses, net profit |
| `POST` | `/shops/invites/` | Generate staff/customer invite link |
| `GET` | `/shops/validate/:token_id/` | Validate invite token |
| `GET` | `/shops/track/:ticket_id/` | Public order status (no auth required) |

---

## Design Decisions Worth Noting

**Price capture on deployment** — `price_at_use` is snapshotted from `retail_price` at the moment a part is logged on a work order. Changing the catalog price later doesn't alter historical invoices.

**Signal-driven side effects** — inventory decrements, technician record sync, and stock restoration on part removal are handled via Django signals, keeping the views clean.

**JWT enriched payload** — `staff_id`, `tenant_id`, `role`, and `tech_level` are embedded in the token. The frontend decodes locally for routing and permission checks without extra round trips.

**contextvars for tenant isolation** — `TenantMiddleware` writes the current tenant ID into a `ContextVar`. `TenantManager.get_queryset()` reads it to auto-scope queries. Works cleanly with Django's request lifecycle.

**Token-gated onboarding** — no anonymous form submissions. Every customer intake and staff activation requires a valid, unexpired `ActionToken` that self-destructs on use.

---

## Roadmap

- [ ] WebSocket notifications (order status updates)
- [ ] SMS delivery via Twilio for customer invite links
- [ ] PDF invoice generation with `WeasyPrint`
- [ ] Subscription billing (Stripe integration)
- [ ] Mobile app (Flutter, same API)
- [ ] Multi-branch support per tenant

---

## License

MIT. Build with it, learn from it, ship your own version.

---

<div align="center">
  <sub>Built by <a href="https://github.com/oogwayoncoke">oogwayoncoke</a></sub>
</div>