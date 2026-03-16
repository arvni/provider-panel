# Bion Provider Panel

A full-stack clinical laboratory management system for healthcare providers. Built with **Laravel 12** + **React 19** + **Inertia.js v2**, it enables providers to place test orders, track sample collection, manage materials, and download reports — all from a single interface.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 12, PHP 8.2+ |
| Frontend | React 19, Vite 6 |
| Bridge | Inertia.js v2 |
| UI | Material UI (MUI) v7 |
| Auth | Laravel Breeze + Sanctum |
| RBAC | Spatie Laravel Permission |
| Database | MySQL 8+ |
| State | SWR + Inertia `useForm` |
| Animations | Framer Motion |
| Charts | Recharts |
| Maps | Leaflet + react-leaflet |
| Notifications | notistack |
| PDF | barryvdh/laravel-dompdf |
| Excel | maatwebsite/excel |
| Barcodes | milon/barcode |
| Queue | Laravel Jobs (database driver) |

---

## Features

### For Healthcare Providers
- **Multi-step order creation** — guided 7-step workflow: Test Selection → Patient Details → Patient–Test Assignment → Clinical Info → Sample Details → Consent → Finalize
- **Patient management** — full demographic records with family relationship tracking (parent, sibling, spouse, twin, etc.)
- **Test catalogue** — browse available diagnostic tests with turnaround times, required forms, and sample type info
- **Sample collection requests** — schedule pickups with real-time status tracking and map view
- **Material ordering** — order lab supplies (tubes, containers) with barcode-based inventory tracking
- **Report downloads** — download test reports and order summaries as PDFs
- **Order by barcode** — scan a sample barcode to link it instantly to an existing order

### For Administrators
- **User & role management** — create users, assign roles, define granular permissions
- **Test configuration** — define tests with sample types, consent forms, instructions, and order forms
- **Document management** — upload and manage consent forms, instructions, and order request form PDFs
- **Collection request oversight** — view and manage all provider pickup requests with status transitions
- **Material generation** — generate barcoded materials and track inventory
- **Excel export** — export material inventory data to spreadsheet

### System-wide
- **Real-time notifications** — in-app notification center with SWR polling
- **Dark mode** — persistent theme preference (localStorage) on both authenticated and guest layouts
- **External system integration** — webhook endpoints for LIS, logistics, and supplier sync
- **Full-text search** — search across patients, orders, tests, users using the `Searchable` trait
- **Drag-and-drop** — reorder sample types in test configuration
- **Sample pooling** — support for pooled sample processing
- **CAPTCHA** — Cloudflare Turnstile on password reset forms

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   React Frontend                     │
│   Pages/   Components/   Layouts/   Services/        │
└──────────────────┬───────────────────────────────────┘
                   │  Inertia.js  (server-driven SPA)
┌──────────────────▼───────────────────────────────────┐
│               Laravel Backend                        │
│   Controllers → Repositories → Models → MySQL        │
│   Policies (RBAC)   Jobs (Queue)   Services          │
└──────────────────────────────────────────────────────┘
```

### Repository Pattern
All data access is abstracted through repositories, bound via `RepositoryProvider`:

```
BaseRepository
├── UserRepository          ├── ConsentRepository
├── PatientRepository       ├── InstructionRepository
├── OrderRepository         ├── ConsentTermRepository
├── TestRepository          ├── OrderFormRepository
├── SampleTypeRepository    ├── RoleRepository
├── CollectRequestRepository├── PermissionRepository
├── OrderMaterialRepository └── MaterialRepository
```

---

## Data Models

```
User ──────< Orders
User ──────< Patients
User ──────< OrderMaterials
User >────< Tests            (pivot: available test list per user)

Patient >──── User
Patient ──────< OrderItems   (via pivot)
Patient >────< RelatedPatients (self-referential, with RelationType)

Order >──── User
Order >──── Patient          (main patient)
Order ──────< OrderItems
Order >──── CollectRequest

OrderItem >──── Order
OrderItem >──── Test
OrderItem >────< Patients    (pivot: is_main flag)
OrderItem >────< Samples     (pivot)

Test ──────< SampleTypeTest  (pivot: description, is_default)
Test >──── Consent
Test >──── Instruction
Test >──── OrderForm

Sample >──── SampleType
Sample >──── Material
Sample >──── Patient

Material >──── SampleType
Material >──── OrderMaterial
```

---

## Status Lifecycles

### Order Status
```
PENDING → REQUESTED → LOGISTIC_REQUESTED → SENT → RECEIVED
        → PROCESSING → SEMI_REPORTED → REPORTED → REPORT_DOWNLOADED
```

### Order Edit Steps
```
test_method → patient_details → patient_test_assignment
            → clinical_details → sample_details → consent_form → finalize
```

### Collection Request Status
```
REQUESTED → SCHEDULED → PICKED_UP → ON_THE_WAY → RECEIVED
```

### Material Order Status
```
ORDERED → GENERATED (PROCESSED)
```

---

## Permissions

Permissions follow the `Admin.*` namespace and control sidebar visibility and backend access:

```
Admin                          (parent gate for admin section)
├── Admin.OrderMaterial.Index
├── Admin.CollectRequest.Index
├── Admin.Test.Index
├── Admin.SampleType.Index
├── Admin.OrderForm.Index
├── Admin.Consent.Index
├── Admin.Instruction.Index
├── Admin.ConsentTerm.Index
├── Admin.User.Index / Admin.User.Create
├── Admin.Role.Index
├── Admin.Permission.Index
├── Admin.Patient.Show / .Update / .Delete
```

---

## Installation

### Requirements
- PHP 8.2+, Composer
- Node.js 18+, npm
- MySQL 8+

### Steps

```bash
# 1. Install dependencies
composer install
npm install

# 2. Environment
cp .env.example .env
php artisan key:generate

# 3. Configure .env
#    DB_DATABASE, DB_USERNAME, DB_PASSWORD
#    APP_NAME=Bion Provider Panel
#    APP_URL
#    MAIL_* (for email verification / password reset)
#    QUEUE_CONNECTION=database

# 4. Database
php artisan migrate
php artisan db:seed    # if seeders exist

# 5. Build frontend assets
npm run build          # production
npm run dev            # development with HMR

# 6. Start queue worker (required for collection/material jobs)
php artisan queue:work

# 7. Serve
php artisan serve
```

---

## Key File Locations

### Backend

| Path | Description |
|---|---|
| `routes/web.php` | All web routes |
| `routes/api.php` | Webhook + API routes |
| `app/Models/` | Eloquent models |
| `app/Http/Controllers/` | Controllers (`admin/`, `api/`, `webhook/` subdirs) |
| `app/Repositories/` | Data access layer |
| `app/Services/` | Business logic services |
| `app/Policies/` | Authorization gates (13 policies) |
| `app/Enums/` | Status enums (OrderStatus, OrderStep, etc.) |
| `app/Traits/` | Searchable, Statusable traits |

### Frontend

| Path | Description |
|---|---|
| `resources/js/app.jsx` | React entry, MUI theme, Inertia setup |
| `resources/js/routes.jsx` | Sidebar navigation definition |
| `resources/js/Layouts/AuthenticatedLayout.jsx` | Main app shell (sidebar + header) |
| `resources/js/Layouts/GuestLayout.jsx` | Login/auth layout with dark mode |
| `resources/js/Layouts/TableLayout.jsx` | Reusable paginated table with filters |
| `resources/js/Services/api.js` | `usePageReload` hook for table pages |
| `resources/js/Pages/Order/` | Full 7-step order flow |
| `resources/js/Pages/Patient/` | Patient list, show, edit |
| `resources/js/Pages/CollectRequest/` | Collection request management |
| `resources/js/Components/` | Shared components (Filter, Pagination, etc.) |

---

## Webhook Endpoints

External systems (LIS, logistics, suppliers) can push updates via unauthenticated POST endpoints:

| Endpoint | Purpose |
|---|---|
| `POST /api/order-materials/{id}` | Material order status update |
| `POST /api/request-forms/{id}` | Order form file update |
| `POST /api/consent-forms/{id}` | Consent form file update |
| `POST /api/instructions/{id}` | Instruction file update |
| `POST /api/sample-types/{id}` | Sample type update |
| `POST /api/collect-requests/` | Collection request status update |
| `POST /api/webhooks/orders/import` | Import orders from external LIS |

---

## Queue Jobs

| Job | Triggered When |
|---|---|
| `SendCollectionRequest` | A collection request is submitted |
| `SendOrderMaterial` | A material order is placed |

Set `QUEUE_CONNECTION=database` in `.env` and run `php artisan queue:work`.

---

## Development Notes

- **Laravel Telescope** is available at `/telescope` in local environment for request/query/job debugging.
- Frontend uses `usePageReload` (from `resources/js/Services/api.js`) for all paginated table pages — it manages filter state, sort, and page in the URL query string via Inertia visits.
- The `Searchable` trait supports dot-notation for relationship fields (e.g., `"Patient.fullName"`) to enable cross-model search.
- `SampleTypeTest` model extends Laravel's `Pivot` class but is used in a `hasMany` relationship on `Test`, giving it full model serialization including `id`.
- Orders use `orderId` accessor to format display IDs as `OR.YYYYMMDD.{id}`.
