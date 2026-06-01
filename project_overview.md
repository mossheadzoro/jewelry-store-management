# 💎 Jewelry Store Management ERP — Project Overview

This document provides a brief outline of the codebase structure and summarizes the current health, dependencies, and feature coverage of the Jewelry ERP system.

---

## 📂 Project Structure

The project is structured as a full-stack monorepo style Next.js web application utilizing **Prisma ORM** and **PostgreSQL**.

```
jewelry-store-management/
├── client/
│   ├── components/                 # React UI Components
│   │   ├── Billing/                # Billing forms & invoice payment panels
│   │   ├── Inventory/              # Stock Ledger grid, details modals & summary UI
│   │   ├── Karigar/                # Artisan profiling, metal issuing & loss adjust forms
│   │   └── Sales/                  # Sales Panel tabs (Invoices, Reports, Analytics, Backups)
│   ├── libs/                       # Backend Business Logic Layers (Singleton helpers)
│   │   ├── prisma.ts               # Database client connection singleton
│   │   ├── inventoryLedger.ts      # Ledger transaction generator (WAC/FIFO, locks, negative stock check)
│   │   ├── inventoryCosting.ts     # Weighted Average Cost (WAC) & FIFO consumption queues
│   │   ├── huidValidation.ts       # HUID enforcement and compliance validation
│   │   └── yearEndClosing.ts       # Year-End Fiscal Closing snapshot generator
│   ├── prisma/
│   │   ├── schema.prisma           # Prisma database schemas (Models, Relations, Enums)
│   │   └── seed.js                 # Seed file injecting initial branches, users, and company rates
│   ├── src/
│   │   ├── app/                    # Next.js App Router API Routes & Frontend Pages
│   │   │   ├── api/                # REST endpoints (/api/billing, /api/inventory, /api/karigar)
│   │   │   ├── billing/            # Billing creation views
│   │   │   ├── dashboard/          # Role-based panels (Admin, Manager, Salesman)
│   │   │   ├── inventory/          # Stock tables, category & subcategory management
│   │   │   ├── karigar/            # Karigar profiles & job sheet dashboards
│   │   │   ├── sales/              # Consolidated Sales Management Panel
│   │   │   └── page.tsx            # App root portal
│   │   ├── hook/                   # Custom state hooks (e.g. useSalesFilters.ts)
│   │   └── lib/                    # Client/Server side helpers (authOptions.ts, formatters)
│   ├── types/                      # Shared Typescript schema models (sales.ts, order.ts)
│   ├── next.config.js              # Production configuration settings & build bypass rules
│   └── tsconfig.json               # TypeScript compiler config
└── project_overview.md             # This file
```

---

## ⚡ Current Project Condition & Health

### 1. Build and Compilation Status
- **TypeScript**: **Passed** (`npx tsc --noEmit` returns `0` warnings and errors). All custom mappings and types are fully typesafe.
- **Production Bundle**: **Passed** (`npm run build` compiles and packages the entire App Router code successfully, outputting optimized static pages and demand-driven endpoints).
- **ESLint & TS Checks During Build**: Lint checks are bypassed during production compilation to allow deployments without blocks from legacy components.

### 2. Database & Schema
- **Database Engine**: PostgreSQL.
- **ORM**: Prisma.
- **Condition**: Pushed successfully (`prisma db push`). Models for transactional tables, ledger records, daily metal histories, user metrics, and backup logs (`BackupLog`) are active in the database.

### 3. Key Completed Modules

#### A. Invoices & Billing Panel (`/billing`)
* Full invoice calculations supporting metal purity rates, stone/making charges, and old gold exchange values.
* Dynamic payment method tracking (Cash, Card, UPI, Cheque, NEFT, Metal exchange).

#### B. Sales Management Panel (`/sales`)
* **Invoices Tab**: Advanced paginated queries containing date-presets, salespeople filters, and payment method categories. Renders row-click details sidebar.
* **Reports Tab**: Performance aggregation by product category, daily closing lists (Roznama tables), and transaction counts.
* **GST & Sheet Exports**: Multi-sheet formatted Excel reports and pdf GST summaries (supporting registered B2B and unregistered B2C compliance views) generated server-side.
* **Analytics Tab**: Recharts integration showing daily revenue curves, metal breakdowns, salespeople leaderboards, peak showroom transaction hours, and HUID compliance ratios.
* **Backup Tab**: Schema table selector capturing JSON or Excel database snapshots, logged securely under `BackupLog`.

#### C. Stock Ledger & Compliance (`/inventory/ledger`)
* Live running balances for both standard net weight and pure **Fine Weight**.
* Traceable item paths showing auto-incrementing sequence identifiers (`sequenceNo`).
* Monotonic audit lock mechanism (`isLocked`) protecting records against tampering.
* Hallmarking compliance tracker listing unhallmarked items.
* Automatic Year-End Closing snapshots generated at the end of the Indian financial year.
