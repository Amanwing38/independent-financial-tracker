# Independent Financial Tracker

A standalone, secure, and independent financial management application designed specifically for overseas employment agencies and financial desks to manage cash registers, bank registers, collection verification, and internal transfers.

> **CRITICAL ARCHITECTURAL ISOLATION:**
> This application is completely standalone and operates in its own dedicated directory. It **does NOT** import, connect to, or depend on AEMS, RMS, CV Maker, or any other existing project.

---

## 1. Technologies Used (100% Free & Open Source)

- **Framework**: Next.js 15 (App Router with TypeScript)
- **Styling**: Tailwind CSS
- **Database (Development)**: SQLite (`prisma/dev.db`) via Prisma ORM (zero setup, self-contained)
- **Database (Production Path)**: Standalone PostgreSQL (100% schema compatible via Prisma)
- **Authentication**: Secure Session JWT via HTTP-only Cookies (`jose` + `bcryptjs`)
- **Icons**: Lucide React
- **Testing**: Automated end-to-end acceptance test suite via `tsx`

---

## 2. Default Demo Accounts (DEMO DATA)

All demonstration records are explicitly labeled **[DEMO DATA]**.

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Agency Owner** | `owner@tracker.local` | `OwnerPassword123!` | Full financial view, physical collection verification, period closing, staff management, audit trail inspection, report exports |
| **Cashier / Staff** | `staff1@tracker.local` | `StaffPassword123!` | Record applicant payments (cash/bank), print receipts, view register ledgers |
| **Accounts Staff** | `staff2@tracker.local` | `StaffPassword123!` | Record applicant bank deposits, view permitted transaction records |

---

## 3. Financial Rules & Architecture

1. **Independent Account Registers**:
   - **Cash Register**: `Opening Cash + Cash Payments - Internal Cash Deposited to Bank`
   - **Bank Register**: `Opening Bank + Direct Bank Payments + Internal Cash Deposits Credited`
   - **Strict Separation**: Cash and Bank balances are completely segregated and never combined into one balance.

2. **Collection Verification & Period Closing**:
   - The Owner verifies collections against a physical cash count or confirmed bank statement.
   - **Balance Preservation Rule**: Verification clears the **Pending Collection Counter** for that closed period. It **DOES NOT** reset actual cash-on-hand or bank balances to zero. Cumulative balances remain intact.
   - Verification is never treated as new income.

3. **Internal Cash-to-Bank Transfers**:
   - Moving physical cash from the office into the agency bank account decreases the Cash Register and increases the Bank Register by the exact same amount.
   - A verified deposit slip number is required.
   - Transfers **never count as new applicant revenue or income**; they are income-neutral asset reallocations.

4. **Server-Side Security & Immutability**:
   - Staff cannot access owner-only functions (Verification, Staff Management, Audit Trail) via direct URL or API calls (`403 Forbidden`).
   - Confirmed transactions cannot be deleted or rewritten directly (`403 Forbidden`).
   - Every financial event is written to an immutable audit trail (`AuditLog`).

---

## 4. How to Run Locally (Free & Self-Contained)

```bash
# 1. Navigate to the project directory
cd "C:\Users\WINDOWS1\.gemini\antigravity\scratch\independent-financial-tracker"

# 2. Install dependencies (if not already installed)
npm install

# 3. Synchronize database and seed demo data
npm run prisma:push
npm run seed

# 4. Run the production build or development server
npm run dev
# or
npm run build && npm start
```

Open **`http://localhost:3000`** in your browser.

---

## 5. Automated Acceptance Test Suite

To run the automated acceptance test suite verifying all 12 core requirements:

```bash
npm run test:acceptance
```

All 12 test specifications:
1. Staff records a cash payment (`TXN-CSH-...`)
2. Staff records a bank payment (`TXN-BNK-...` with slip reference)
3. Unique server ID and server timestamp generation
4. Cash and bank registers update independently
5. Owner verifies collections without resetting actual balances
6. Internal transfers decrease cash & increase bank without inflating income
7. Staff cannot access owner-only endpoints (403 Forbidden)
8. Confirmed transactions cannot be deleted or overwritten
9. Discrepancies are flagged, audited, and resolved
10. Reports mathematically reconcile with transactions
11. Refreshing page retains all database records
12. Application operates completely independently without AEMS

---

## 6. Documented Backup & Restore Procedure

### SQLite (Development)
The database file is located at `prisma/dev.db`.
- **Backup**:
  ```powershell
  Copy-Item prisma\dev.db prisma\backup_$(Get-Date -f yyyyMMdd_HHmmss).db
  ```
- **Restore**:
  ```powershell
  Copy-Item prisma\backup_YYYYMMDD_HHmmss.db prisma\dev.db
  ```

### Production PostgreSQL Migration Path
To transition to a dedicated standalone PostgreSQL database:
1. In `prisma/schema.prisma`, update the datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. In `.env`, update `DATABASE_URL`:
   ```env
   DATABASE_URL="postgresql://db_user:db_password@localhost:5432/financial_tracker?schema=public"
   ```
3. Push the schema to PostgreSQL:
   ```bash
   npx prisma db push
   ```
4. Perform automated production backups:
   ```bash
   pg_dump -U db_user -d financial_tracker > backup.sql
   ```
