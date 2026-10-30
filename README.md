# Countdown Timer + Analytics — Shopify App

A production-minded, embedded Shopify application that enables merchants to create, customize, and schedule promotional countdown timers on their storefront product pages while capturing aggregated impression analytics with strict multi-tenant isolation.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Request Flow](#architecture--request-flow)
3. [Technology Stack](#technology-stack)
4. [Prerequisites](#prerequisites)
5. [Local Development Setup](#local-development-setup)
6. [Environment Variables](#environment-variables)
7. [Shopify Partner Dashboard & App Configuration](#shopify-partner-dashboard--app-configuration)
8. [Theme App Extension Integration](#theme-app-extension-integration)
9. [Timer Business Logic & Targeting](#timer-business-logic--targeting)
   - [Fixed Date Timers](#fixed-date-timers)
   - [Evergreen Countdown Timers](#evergreen-countdown-timers)
   - [Targeting Precedence & Tie-Breaking](#targeting-precedence--tie-breaking)
10. [REST API Documentation](#rest-api-documentation)
    - [Admin Endpoints (Shop Scoped)](#admin-endpoints-shop-scoped)
    - [Storefront Endpoints (Public & Rate Limited)](#storefront-endpoints-public--rate-limited)
11. [Data Model & Indexes (MongoDB + Mongoose)](#data-model--indexes-mongodb--mongoose)
12. [Multi-Tenancy & Application Security](#multi-tenancy--application-security)
13. [Testing & Quality Verification](#testing--quality-verification)
14. [Performance Benchmarks](#performance-benchmarks)
15. [Assumptions, Trade-Offs & Future Improvements](#assumptions-trade-offs--future-improvements)

---

## Project Overview

**Countdown Timer + Analytics** allows merchants to drive conversion urgency through configurable promotional timers.

### Key Capabilities:
- **Timer Management**: Create, edit, pause, activate, and delete promotional timers.
- **Fixed & Evergreen Timers**:
  - *Fixed*: Runs across scheduled global calendar windows (e.g. Flash Sales, Black Friday).
  - *Evergreen*: Individualized countdowns initialized on visitor landing with resilient browser session storage.
- **Precision Targeting**: Target all products, selected products by GID, or entire collections.
- **Live Theme App Extension**: Clean Liquid app block and standalone Preact widget (< 8 KB gzipped) with zero layout shift (CLS).
- **Storefront Analytics**: Atomic impression tracking aggregated daily per timer.
- **Multi-Tenant Isolation**: Strict shop-scoped queries ensuring zero cross-tenant data leakage.

---

## Architecture & Request Flow

The application follows a modular monolith design:

```mermaid
flowchart TD
    subgraph Storefront ["Customer Storefront"]
        Browser["Customer Browser"]
        LiquidBlock["Theme App Block (countdown-timer.liquid)"]
        PreactWidget["Preact Storefront Widget (countdown-timer.js)"]
    end

    subgraph ShopifyAdmin ["Merchant Shopify Admin"]
        AdminBrowser["Merchant Browser"]
        PolarisApp["React + Polaris Admin Application"]
    end

    subgraph Backend ["Node.js Express Modular Server"]
        AuthMiddleware["OAuth & Session Verification (shopifyApp)"]
        TenantGuard["Tenant Isolation Middleware (requireAuthenticatedShop)"]
        RateLimiter["IP Rate Limiter (express-rate-limit)"]
        ZodValidator["Zod Request Validation"]
        TimerService["Timer & Targeting Resolution Engine"]
        AnalyticsService["Analytics Aggregation Service"]
    end

    subgraph Database ["MongoDB Database"]
        TimerCol[("Timer Collection")]
        AnalyticsCol[("Analytics Collection")]
        ShopCol[("Shop Metadata Collection")]
    end

    Browser --> LiquidBlock
    LiquidBlock --> PreactWidget
    PreactWidget -- "GET /api/storefront/timer" --> RateLimiter
    PreactWidget -- "POST /api/storefront/impression" --> RateLimiter
    RateLimiter --> ZodValidator --> TimerService --> TimerCol
    ZodValidator --> AnalyticsService --> AnalyticsCol

    AdminBrowser --> PolarisApp
    PolarisApp -- "REST APIs (/api/timers, /api/analytics)" --> AuthMiddleware
    AuthMiddleware --> TenantGuard --> TimerService
    TenantGuard --> AnalyticsService
```

### Directory Structure

```
├── extensions/
│   └── countdown-timer/            # Shopify Theme App Extension
│       ├── blocks/
│       │   └── countdown-timer.liquid  # Liquid block schema and data hooks
│       ├── assets/
│       │   ├── countdown-timer.js      # Bundled Preact widget (7.14 KB gzip)
│       │   └── countdown-timer.css     # Scoped storefront styling
│       ├── locales/
│       │   └── en.default.json
│       └── shopify.extension.toml
├── shared/
│   ├── constants/
│   │   └── timer.constants.js      # Enums, statuses, default appearance
│   └── validation/
│       └── timer.schema.js         # Zod schemas for admin & storefront
├── storefront-widget/              # Preact storefront widget source
│   └── src/
│       ├── index.jsx               # Entrypoint & DOM mounting
│       └── CountdownWidget.jsx     # Countdown engine & local ticking
├── tests/
│   ├── setup.js                    # Isolated DB test harness
│   ├── unit/
│   │   ├── status-calculator.test.js
│   │   ├── validation.test.js
│   │   └── targeting.test.js
│   └── integration/
│       ├── timer-api.test.js       # Admin API & Multi-Tenant tests
│       └── storefront-api.test.js  # Public storefront API tests
├── web/
│   ├── config/
│   │   └── db.js                   # Mongoose connection manager
│   ├── controllers/                # HTTP request handlers
│   ├── middleware/                 # Rate limiting, validation, tenant auth
│   ├── models/                     # Mongoose schemas (Timer, Analytics, Shop)
│   ├── repositories/               # Shop-scoped DB operations
│   ├── routes/                     # Express route definitions
│   ├── services/                   # Business logic & targeting resolution
│   ├── utils/                      # Clock, GID helpers, status calculator
│   ├── frontend/                   # React + Polaris Admin App
│   ├── index.js                    # Express app entrypoint
│   └── shopify.js                  # Official Shopify Express App config
├── shopify.app.toml                # App configuration & permissions
└── package.json
```

---

## Technology Stack

- **Shopify Platform**: Shopify CLI 5.0, Shopify App Bridge React, Polaris React, Theme App Extensions (Liquid).
- **Backend**: Node.js (ES modules), Express, MongoDB + Mongoose, Zod validation, Express Rate Limit, Compression.
- **Admin Frontend**: React 18, Shopify Polaris, React Router 6, React Query, Vite.
- **Storefront Widget**: Preact 10, ESBuild (bundles down to 17.32 KB raw / **7.14 KB gzipped**).
- **Testing & Quality**: Vitest 5, Supertest, MongoDB Memory Server, ESLint.

---

## Prerequisites

- **Node.js**: v18.0.0 or higher (Tested on v24.15.0).
- **npm**: v9.0.0 or higher.
- **MongoDB**: Live MongoDB instance or Docker container (`mongodb://localhost:27017`).
- **Shopify Partner Account** & Development Store.

---

## Local Development Setup

### 1. Clone & Install Dependencies

```bash
git clone <repo-url>
cd machine_test

# Install root development and testing packages
npm install --legacy-peer-deps

# Install backend dependencies
cd web && npm install
cd ..

# Install admin frontend dependencies
cd web/frontend && npm install
cd ../..
```

### 2. Start MongoDB

If using Docker:
```bash
docker run -d --name cda-mongo -p 27017:27017 mongo:7
```

### 3. Configure Environment

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Ensure `.env` contains:
```env
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_APP_URL=https://your-tunnel.trycloudflare.com
SCOPES=read_products
MONGODB_URI=mongodb://localhost:27017/shopify_countdown_timer
PORT=3000
BACKEND_PORT=3000
FRONTEND_PORT=3001
NODE_ENV=development
```

### 4. Build Bundles

```bash
# Builds Preact widget (<8 KB gzipped) and Vite Polaris admin frontend
npm run build
```

### 5. Run the Application

```bash
# Starts local development via Shopify CLI
npm run dev
```

---

## Shopify Partner Dashboard & App Configuration

1. In your **Shopify Partner Dashboard**, navigate to **Apps** > **Create App**.
2. Copy your **Client ID** (API Key) and **Client Secret** into your `.env` file.
3. In App Setup:
   - **App URL**: `https://<your-tunnel-url>`
   - **Allowed redirection URL(s)**:
     - `https://<your-tunnel-url>/api/auth/callback`
4. **Access Scopes**:
   - `read_products` (Least privilege scope required to read product and collection catalogs).

---

## Theme App Extension Integration

1. Deploy or push extensions using Shopify CLI:
   ```bash
   npx shopify app deploy
   ```
2. In your Shopify Store Admin:
   - Go to **Online Store** > **Themes** > **Customize**.
   - Navigate to any **Product page** template.
   - In the Product section, click **Add Block**.
   - Under Apps, select **Countdown Timer**.
   - Position the block above or below the Buy Buttons.
   - Click **Save**.

The Theme App block automatically renders the widget container with the shop domain, current product GID, and collection GIDs:
```liquid
<div
  id="cda-countdown-timer-widget"
  class="cda-countdown-mount"
  data-shop="{{ shop.permanent_domain }}"
  data-product-id="gid://shopify/Product/{{ product.id }}"
  data-collection-ids="{% for c in product.collections %}gid://shopify/Collection/{{ c.id }}{% unless forloop.last %},{% endunless %}{% endfor %}"
></div>
```

---

## Timer Business Logic & Targeting

### Fixed Date Timers
- Configured with `startAt` and `endAt` ISO 8601 timestamps.
- **Scheduled**: Current time < `startAt`. Does not display on storefront.
- **Active**: `startAt` <= Current time < `endAt`. Renders on storefront and counts down locally.
- **Expired**: Current time >= `endAt`. Automatically hides or unmounts without storefront breakage.

### Evergreen Countdown Timers
- Configured with `evergreenDurationSeconds` (e.g. 3600 seconds = 1 hour, bounded between 60s and 30 days).
- **Visitor Storage**: Handled in browser storage using namespaced keys (`cda_eg_${shop}_${timerId}`).
- If a valid future expiry timestamp is stored, it is reused.
- If expired or not present, a new expiration timestamp is initialized (`Date.now() + duration`).
- Does not expose visitor state in shared server caches.

### Targeting Precedence & Tie-Breaking
When multiple active timers qualify for a product page:
1. **Specific Product Match** (`targeting.type === 'products'` containing product GID).
2. **Specific Collection Match** (`targeting.type === 'collections'` containing any product collection GID).
3. **Storewide Match** (`targeting.type === 'all'`).

**Tie-Breaking within the same tier:**
1. Highest `priority` integer (configured by merchant).
2. Most recently updated timestamp (`updatedAt` descending).
3. Stable ID tie-breaker (`_id` descending).

---

## REST API Documentation

### Admin Endpoints (Shop Scoped)
All admin endpoints require an active Shopify session. Tenant identification is derived strictly from `res.locals.shopify.session.shop`.

#### `GET /api/timers`
List timers for authenticated shop with pagination and filtering.
- **Query Parameters**:
  - `status`: Filter by `all`, `active`, `paused`, `scheduled`, `expired`
  - `search`: Case-insensitive title search
  - `page`: Page number (default: 1)
  - `limit`: Records per page (default: 50, max: 100)
- **Response `200 OK`**:
```json
{
  "timers": [
    {
      "id": "672223849182390192837461",
      "name": "Flash Sale",
      "type": "fixed",
      "status": "active",
      "effectiveStatus": "active",
      "impressions": 1420,
      "startAt": "2026-11-01T00:00:00.000Z",
      "endAt": "2026-11-05T00:00:00.000Z",
      "targeting": { "type": "all", "productIds": [], "collectionIds": [] },
      "appearance": {
        "text": "Sale ends in {time}!",
        "backgroundColor": "#111827",
        "textColor": "#ffffff",
        "position": "above_buy_button",
        "urgencyThresholdSeconds": 3600
      },
      "priority": 5
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 1, "totalPages": 1 }
}
```

#### `POST /api/timers`
Create new countdown timer scoped to authenticated shop.
- **Body**: Validated against `timerInputSchema`.
- **Response `201 Created`**: Returns created timer object.

#### `GET /api/timers/:id`
Fetch single timer by ID. Returns `404 Not Found` if timer belongs to another shop.

#### `PUT /api/timers/:id`
Update existing timer by ID. Body strictly validated; shop ownership cannot be reassigned.

#### `PATCH /api/timers/:id/status`
Toggle status (`active`, `paused`, `archived`).
- **Body**: `{ "status": "paused" }`

#### `DELETE /api/timers/:id`
Permanently delete timer and associated daily impression records.

#### `GET /api/analytics`
Retrieve aggregated impression metrics and daily trend (last 30 days).

---

### Storefront Endpoints (Public & Rate Limited)

#### `GET /api/storefront/timer`
Rate limit: **120 requests/min per IP**.
Cache header: `public, max-age=30, stale-while-revalidate=60`.
- **Query Parameters**:
  - `shop`: Required Shopify domain (e.g. `store.myshopify.com`)
  - `productId`: Optional product GID (`gid://shopify/Product/123456`)
  - `collectionIds`: Optional comma-separated collection GIDs
- **Response `200 OK`**:
```json
{
  "timer": {
    "id": "672223849182390192837461",
    "name": "Flash Sale",
    "type": "fixed",
    "startAt": "2026-11-01T00:00:00.000Z",
    "endAt": "2026-11-05T00:00:00.000Z",
    "evergreenDurationSeconds": null,
    "appearance": {
      "text": "Sale ends in {time}!",
      "backgroundColor": "#111827",
      "textColor": "#ffffff",
      "position": "above_buy_button",
      "urgencyThresholdSeconds": 3600
    }
  }
}
```
*If no timer qualifies, returns `{ "timer": null }`.*

#### `POST /api/storefront/impression`
Rate limit: **60 requests/min per IP**.
- **Body**: `{ "shop": "store.myshopify.com", "timerId": "672223849182390192837461" }`
- **Response `200 OK`**: `{ "success": true }`

---

## Data Model & Indexes (MongoDB + Mongoose)

### Timer Collection (`timers`)
```javascript
{
  shop: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['fixed', 'evergreen'], required: true },
  status: { type: String, enum: ['active', 'paused', 'archived'], default: 'active', index: true },
  startAt: { type: Date, default: null },
  endAt: { type: Date, default: null },
  evergreenDurationSeconds: { type: Number, default: null },
  targeting: {
    type: { type: String, enum: ['all', 'products', 'collections'], default: 'all' },
    productIds: [String],
    collectionIds: [String],
  },
  appearance: {
    text: { type: String, default: 'Sale ends in {time}!' },
    backgroundColor: { type: String, default: '#111827' },
    textColor: { type: String, default: '#ffffff' },
    position: { type: String, default: 'above_buy_button' },
    urgencyThresholdSeconds: { type: Number, default: 3600 },
  },
  priority: { type: Number, default: 0 },
  createdAt: Date,
  updatedAt: Date,
}
```
**Indexes**:
- `{ shop: 1, status: 1 }`
- `{ shop: 1, "targeting.type": 1 }`
- `{ shop: 1, "targeting.productIds": 1 }`
- `{ shop: 1, "targeting.collectionIds": 1 }`

### Analytics Collection (`analytics`)
```javascript
{
  shop: { type: String, required: true },
  timerId: { type: Schema.Types.ObjectId, ref: 'Timer', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD UTC
  impressions: { type: Number, default: 0 },
  createdAt: Date,
  updatedAt: Date,
}
```
**Indexes**:
- `{ shop: 1, timerId: 1, date: 1 }` with `{ unique: true }` (ensures atomic increment and prevents duplicate date collision).
- `{ shop: 1, date: 1 }`

---

## Multi-Tenancy & Application Security

1. **Session-Driven Identity**:
   - The authenticated merchant's `shop` domain is derived exclusively from the verified Shopify session token (`res.locals.shopify.session.shop`).
   - Request bodies cannot alter or spoof shop domains.
2. **Cross-Tenant ID Enumeration Prevention**:
   - Every lookup and mutation query requires both `_id` and `shop`:
     ```javascript
     Timer.findOne({ _id: timerId, shop: authenticatedShop });
     ```
   - Attempting to access or mutate a timer belonging to another merchant returns an immediate `404 Not Found`.
3. **Storefront Defense-in-Depth**:
   - Public storefront endpoints never expose sensitive database fields, merchant scopes, or API keys.
   - Strict IP rate limiting prevents impression flooding and API denial of service.
   - Merchant-provided text is validated against executable script tags (`<script>`) to prevent stored cross-site scripting (XSS).
   - Hex colors are strictly validated against `^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$`.

---

## Testing & Quality Verification

Run the automated test suite:
```bash
# Run all unit and integration tests
npm test

# Run tests with code coverage analysis
npm run test:coverage

# Run ESLint validation
npm run lint
```

### Verified Test Results:
- **52 Passing Automated Tests**:
  - `tests/unit/status-calculator.test.js`: Fixed scheduled, active, exact expiration, post-expiration, remaining seconds, evergreen expiry reuse and reset.
  - `tests/unit/validation.test.js`: Hex colors, XSS script injection, date consistency, positive durations, GID formatting.
  - `tests/unit/targeting.test.js`: Product-level precedence, collection-level matching, storewide fallback, priority tie-breaking.
  - `tests/integration/timer-api.test.js`: Strict multi-tenant isolation, cross-shop mutation prevention, CRUD operations, analytics aggregation.
  - `tests/integration/storefront-api.test.js`: Public timer resolution, cache headers, atomic impression tracking, 404/400 validation.
- **Coverage**: > 80% statement and line coverage across business logic, models, controllers, and services.
- **ESLint**: 0 errors, 0 warnings.

---

## Performance Benchmarks

| Metric | Target | Actual Result | Status |
| :--- | :--- | :--- | :--- |
| **Storefront Widget Bundle Size** | < 30.0 KB gzipped | **7.14 KB gzipped** (17.32 KB uncompressed) | Passed (Well within target) |
| **Storefront API Timer Fetch Latency** | < 200 ms | **~15 - 35 ms** (Local MongoDB test environment) | Passed |
| **Storefront Cache Strategy** | Multi-tiered | `public, max-age=30, stale-while-revalidate=60` | Implemented |
| **Layout Shift (CLS)** | Zero shift | CSS reserved minimum container height | Implemented |
| **Storefront Client Polling** | Zero per-second polling | Local 1000ms JavaScript ticker | Implemented |

---

## Assumptions, Trade-Offs & Future Improvements

1. **Collection Membership on Storefront**:
   - The Theme App Extension block directly passes the current product's collections using Liquid (`{% for c in product.collections %}{{ c.id }}{% endfor %}`). This eliminates extraneous Shopify GraphQL queries during storefront page render.
2. **Evergreen Storage Scope**:
   - Uses `localStorage` so visitors returning within the promotional duration keep their remaining time. An option to switch to `sessionStorage` (tab-session only) can easily be toggled in future releases.
3. **Future Improvements**:
   - Webhook-based automatic cache invalidation on product catalog updates.
   - A/B testing variations for timer designs and urgency message phrasing.
