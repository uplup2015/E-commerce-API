# Node.js E-commerce API

A RESTful e-commerce backend built with Node.js, Express, TypeScript, and PostgreSQL.

## Tech Stack

- **Runtime:** Node.js + Express.js + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** JWT (access + refresh tokens) + bcrypt
- **Validation:** Joi
- **Infrastructure:** Docker Compose

## Getting Started

### Prerequisites

- Node.js v18+
- Docker Desktop

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/nodejs-ecommerce-api.git
cd nodejs-ecommerce-api

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your values

# 4. Start PostgreSQL
docker-compose up -d

# 5. Run database migration
npx prisma migrate dev

# 6. Start the development server
npm run dev
```

Server runs at `http://localhost:3000`

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Server port (default: 3000) |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiry (default: 15m) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry (default: 7d) |

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register a new user |
| POST | `/api/auth/login` | — | Login and receive tokens |
| POST | `/api/auth/refresh` | — | Refresh access token |

**Register** `POST /api/auth/register`
```json
// Request
{ "name": "John", "email": "john@example.com", "password": "secret123" }

// Response 201
{
  "user": { "id": 1, "name": "John", "email": "john@example.com", "role": "CUSTOMER" },
  "accessToken": "...",
  "refreshToken": "..."
}
```

**Login** `POST /api/auth/login`
```json
// Request
{ "email": "john@example.com", "password": "secret123" }

// Response 200
{
  "user": { "id": 1, "name": "John", "email": "john@example.com", "role": "CUSTOMER" },
  "accessToken": "...",
  "refreshToken": "..."
}
```

**Refresh** `POST /api/auth/refresh`
```json
// Request
{ "refreshToken": "..." }

// Response 200
{ "accessToken": "...", "refreshToken": "..." }
```

---

### Categories

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/categories` | — | List all categories |
| POST | `/api/categories` | Admin | Create category |
| PATCH | `/api/categories/:id` | Admin | Update category |
| DELETE | `/api/categories/:id` | Admin | Delete category |

---

### Products

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | — | List products (search, filter, paginate) |
| GET | `/api/products/:id` | — | Get product by id |
| POST | `/api/products` | Admin | Create product |
| PATCH | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |

**Query params for** `GET /api/products`

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search by title (case-insensitive) |
| `categoryId` | number | Filter by category |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10, max: 100) |

**Response**
```json
{
  "data": [ { "id": 1, "title": "iPhone 15", "price": "999.99", "stock": 50, ... } ],
  "meta": { "total": 50, "page": 1, "limit": 10, "totalPages": 5 }
}
```

---

### Cart

All cart endpoints require authentication.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cart` | User | Get current user's cart |
| POST | `/api/cart/items` | User | Add item to cart |
| PATCH | `/api/cart/items/:productId` | User | Update item quantity |
| DELETE | `/api/cart/items/:productId` | User | Remove item from cart |

**Add item** `POST /api/cart/items`
```json
// Request
{ "productId": 1, "quantity": 2 }
```

**Update quantity** `PATCH /api/cart/items/:productId`
```json
// Request
{ "quantity": 3 }
```

---

### Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/orders` | User | Checkout — create order from cart |
| GET | `/api/orders` | User | Get own orders (Admin sees all) |
| GET | `/api/orders/:id` | User | Get order by id |
| PATCH | `/api/orders/:id/status` | Admin | Update order status |

**Update status** `PATCH /api/orders/:id/status`
```json
// Request
{ "status": "CONFIRMED" }

// Valid statuses: PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
```

---

## Role-Based Access

| Role | Permissions |
|------|-------------|
| `CUSTOMER` | Browse products, manage own cart, place and view own orders |
| `ADMIN` | All customer permissions + manage categories/products, view all orders, update order status |

To promote a user to admin, update directly in the database:
```sql
UPDATE "User" SET role='ADMIN' WHERE email='user@example.com';
```

---

## Database Schema

```
User ──< Order ──< OrderItem >── Product
 │                                  │
 └──< Cart ──< CartItem >───────────┘
                        └── Category
```
