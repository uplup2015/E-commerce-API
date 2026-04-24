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
| PATCH | `/api/categories/:id` | Admin | Update category name |
| DELETE | `/api/categories/:id` | Admin | Delete category (fails if it has products) |

**GET** `/api/categories`
```json
// Response 200
[
  { "id": 1, "name": "Electronics" },
  { "id": 2, "name": "Furniture" }
]
```

**POST** `/api/categories`
```json
// Request
{ "name": "Electronics" }

// Response 201
{ "id": 1, "name": "Electronics" }
```

**PATCH** `/api/categories/:id`
```json
// Request
{ "name": "Electronics & Gadgets" }

// Response 200
{ "id": 1, "name": "Electronics & Gadgets" }
```

**DELETE** `/api/categories/:id`
```
// Response 204 No Content
```

---

### Products

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | — | List products with search, filter, pagination |
| GET | `/api/products/:id` | — | Get single product |
| POST | `/api/products` | Admin | Create product |
| PATCH | `/api/products/:id` | Admin | Partial update product |
| DELETE | `/api/products/:id` | Admin | Delete product |

**GET** `/api/products`

| Query Param | Type | Default | Description |
|-------------|------|---------|-------------|
| `search` | string | — | Search by title (case-insensitive) |
| `categoryId` | number | — | Filter by category |
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page (max: 100) |

```json
// Response 200
{
  "data": [
    {
      "id": 1,
      "title": "iPhone 15",
      "price": "999.99",
      "stock": 50,
      "images": ["https://example.com/iphone.jpg"],
      "categoryId": 1,
      "category": { "id": 1, "name": "Electronics" }
    }
  ],
  "meta": { "total": 50, "page": 1, "limit": 10, "totalPages": 5 }
}
```

**GET** `/api/products/:id`
```json
// Response 200
{
  "id": 1,
  "title": "iPhone 15",
  "price": "999.99",
  "stock": 50,
  "images": ["https://example.com/iphone.jpg"],
  "categoryId": 1,
  "category": { "id": 1, "name": "Electronics" }
}
```

**POST** `/api/products`
```json
// Request
{
  "title": "iPhone 15",
  "price": 999.99,
  "stock": 50,
  "images": ["https://example.com/iphone.jpg"],
  "categoryId": 1
}

// Response 201
{
  "id": 1,
  "title": "iPhone 15",
  "price": "999.99",
  "stock": 50,
  "images": ["https://example.com/iphone.jpg"],
  "categoryId": 1,
  "category": { "id": 1, "name": "Electronics" }
}
```

**PATCH** `/api/products/:id`
```json
// Request (all fields optional, at least one required)
{ "price": 899.99, "stock": 45 }

// Response 200 — full updated product
```

**DELETE** `/api/products/:id`
```
// Response 204 No Content
```

---

### Cart

All cart endpoints require authentication.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cart` | User | Get current user's cart |
| POST | `/api/cart/items` | User | Add item (accumulates if already in cart) |
| PATCH | `/api/cart/items/:productId` | User | Set exact quantity for an item |
| DELETE | `/api/cart/items/:productId` | User | Remove item from cart |

**GET** `/api/cart`
```json
// Response 200
{
  "id": 1,
  "userId": 3,
  "items": [
    {
      "cartId": 1,
      "productId": 1,
      "quantity": 2,
      "product": {
        "id": 1,
        "title": "iPhone 15",
        "price": "999.99",
        "stock": 50,
        "images": ["https://example.com/iphone.jpg"]
      }
    }
  ]
}
```

**POST** `/api/cart/items`
```json
// Request
{ "productId": 1, "quantity": 2 }

// Response 201 — full updated cart
```

**PATCH** `/api/cart/items/:productId`
```json
// Request
{ "quantity": 3 }

// Response 200 — full updated cart
```

**DELETE** `/api/cart/items/:productId`
```json
// Response 200 — full updated cart (item removed)
```

---

### Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/orders` | User | Checkout — creates order from current cart |
| GET | `/api/orders` | User | Get own orders (Admin sees all orders) |
| GET | `/api/orders/:id` | User | Get order by id |
| PATCH | `/api/orders/:id/status` | Admin | Update order status |

**POST** `/api/orders`
```json
// No request body — uses current cart

// Response 201
{
  "id": 1,
  "userId": 3,
  "total": "1999.98",
  "status": "PENDING",
  "createdAt": "2026-04-24T11:16:58.185Z",
  "updatedAt": "2026-04-24T11:16:58.185Z",
  "items": [
    {
      "id": 1,
      "orderId": 1,
      "productId": 1,
      "quantity": 2,
      "price": "999.99",
      "product": { "id": 1, "title": "iPhone 15" }
    }
  ]
}
```

**GET** `/api/orders`
```json
// Response 200 — array of orders (same shape as above)
```

**GET** `/api/orders/:id`
```json
// Response 200 — single order (same shape as above)
```

**PATCH** `/api/orders/:id/status`
```json
// Request
{ "status": "CONFIRMED" }

// Valid values: PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED

// Response 200 — full updated order
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
