# ⚡ Electronics Store POS System
## Complete Point of Sale & Inventory Management Platform

### 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Quick Start](#quick-start)
6. [API Documentation](#api-documentation)
7. [User Interfaces](#user-interfaces)
8. [Database Schema](#database-schema)
9. [Security](#security)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 System Overview

A professional-grade Point of Sale (POS) system designed specifically for electronics retail stores. Features complete inventory management, customer loyalty programs, multi-user access with role-based permissions, daily automated reporting, and third-party supplier integration.

**Key Benefits:**
- ✅ Real-time inventory tracking
- ✅ Automated customer loyalty discounts
- ✅ Role-based access control (Admin, Manager, Cashier)
- ✅ Dual receipt system (customer + merchant)
- ✅ End-of-day automated reports
- ✅ Supplier API integration (Alibaba, AliExpress)
- ✅ Secure JWT authentication
- ✅ Complete audit trail

---

## 🌟 Features by User Role

### 👨‍💼 Admin Dashboard
```
Full System Control
├── User Management
│   ├── Create cashier/manager accounts
│   ├── Assign role-based permissions
│   ├── Deactivate users
│   └── View user activity logs
│
├── Product Management
│   ├── Add products (with AI assistance optional)
│   ├── Edit product details
│   ├── Delete products
│   ├── Manage categories
│   └── Import from Alibaba/AliExpress
│
├── Transaction Management
│   ├── View all transactions
│   ├── Cancel transactions
│   ├── View receipt history
│   └── Customer purchase history
│
├── Reports & Analytics
│   ├── Daily transaction summary
│   ├── Sales by payment method
│   ├── Top selling products
│   ├── Customer lifetime value
│   ├── Top customers
│   └── Low stock alerts
│
└── Supplier Integration
    ├── Add API credentials
    ├── Import products
    └── Sync inventory
```

### 📦 Store Manager Dashboard
```
Inventory & Product Management
├── Product Management
│   ├── Add new products
│   ├── Edit existing products
│   └── View product details
│
├── Inventory Monitoring
│   ├── Real-time stock levels
│   ├── Low stock alerts
│   ├── Inventory logs
│   └── Stock adjustments
│
└── Analytics (View Only)
    ├── Daily sales summary
    ├── Top products
    └── Customer metrics
```

### 💳 Cashier Interface
```
Point of Sale Operations
├── Product Search & Selection
│   ├── Quick product search
│   ├── Barcode scanning
│   └── Product details
│
├── Shopping Cart
│   ├── Add/remove items
│   ├── Modify quantities
│   └── Real-time total calculation
│
├── Customer Management
│   ├── Customer lookup (phone-based)
│   ├── Create new customer
│   ├── View loyalty status
│   └── Apply automatic discounts
│
├── Transaction Processing
│   ├── Multiple payment methods
│   ├── Discount application
│   ├── Receipt printing
│   ├── Email receipt option
│   └── Modify/cancel own transactions
│
└── Loyalty Program
    └── Automatic discount at:
        - 10th purchase OR
        - $1,000 total spent
```

---

## 💻 Tech Stack

### Backend
```
Node.js + Express.js
├── Authentication: JWT + bcryptjs
├── Database: Supabase (PostgreSQL)
├── API: RESTful with error handling
└── Security: Helmet, CORS, Rate limiting
```

### Frontend
```
React.js
├── State Management: React Context API
├── Styling: Custom CSS (Responsive design)
├── API Integration: Axios
└── Component Architecture: Modular & Scalable
```

### Database
```
Supabase (PostgreSQL)
├── Real-time subscriptions
├── Row Level Security (RLS)
├── Automated backups
└── Built-in authentication
```

### Infrastructure
```
Deployment Options:
├── Frontend: Vercel, Netlify
├── Backend: Heroku, Railway, DigitalOcean
├── Database: Supabase cloud
└── CDN: Cloudflare
```

---

## 📁 Project Structure

```
electronics-pos-system/
│
├── backend/
│   ├── server.js                 # Main server file
│   ├── package.json
│   ├── .env                      # Environment variables
│   ├── .env.example
│   │
│   ├── routes/
│   │   ├── auth.js              # Authentication endpoints
│   │   ├── users.js             # User management
│   │   ├── products.js          # Product CRUD
│   │   ├── customers.js         # Customer management
│   │   ├── transactions.js      # POS transactions
│   │   ├── receipts.js          # Receipt management
│   │   ├── reports.js           # Daily reports
│   │   ├── inventory.js         # Inventory tracking
│   │   ├── suppliers.js         # Supplier integration
│   │   └── analytics.js         # Analytics endpoints
│   │
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   ├── authorize.js         # Role-based access
│   │   └── errorHandler.js      # Error handling
│   │
│   └── utils/
│       ├── validators.js        # Input validation
│       ├── email.js             # Email service
│       └── reports.js           # Report generation
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main component
│   │   ├── App.css              # Global styles
│   │   ├── index.js
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   └── Dashboard.jsx
│   │   │
│   │   ├── components/
│   │   │   ├── Cashier/
│   │   │   │   ├── POSInterface.jsx
│   │   │   │   ├── ProductSearch.jsx
│   │   │   │   ├── ShoppingCart.jsx
│   │   │   │   ├── CustomerLookup.jsx
│   │   │   │   └── Receipt.jsx
│   │   │   │
│   │   │   ├── StoreManager/
│   │   │   │   ├── ProductManagement.jsx
│   │   │   │   ├── InventoryView.jsx
│   │   │   │   └── Analytics.jsx
│   │   │   │
│   │   │   └── Admin/
│   │   │       ├── Dashboard.jsx
│   │   │       ├── UserManagement.jsx
│   │   │       ├── ProductManagement.jsx
│   │   │       ├── Reports.jsx
│   │   │       └── SupplierIntegration.jsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useApi.js
│   │   │   └── useCart.js
│   │   │
│   │   └── services/
│   │       ├── api.js           # API client
│   │       └── auth.js          # Auth service
│   │
│   ├── public/
│   ├── package.json
│   └── .env
│
├── database/
│   ├── schema.sql               # Complete DB schema
│   ├── migrations/
│   │   ├── 001_initial.sql
│   │   └── 002_functions.sql
│   │
│   └── seeds/
│       ├── categories.sql
│       ├── products.sql
│       └── users.sql
│
├── docs/
│   ├── API.md                   # API documentation
│   ├── SETUP.md                 # Setup guide
│   ├── DATABASE.md              # Database docs
│   └── DEPLOYMENT.md            # Deployment guide
│
├── .gitignore
├── README.md                    # This file
└── docker-compose.yml           # Docker configuration (optional)
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- npm or yarn
- Supabase account (free)
- Git

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/electronics-pos.git
cd electronics-pos-system
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your Supabase credentials
nano .env
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=your-anon-key
# JWT_SECRET=your-secret-key-min-32-chars
# PORT=5000
```

### 3. Setup Database

```bash
# In Supabase SQL Editor, run the complete schema from:
# database/schema.sql

# Or use CLI:
psql postgresql://user:password@host/database < database/schema.sql
```

### 4. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env
# REACT_APP_API_URL=http://localhost:5000/api
```

### 5. Start Development

```bash
# Terminal 1: Start backend
cd backend
npm run dev
# Output: 🚀 Server running on port 5000

# Terminal 2: Start frontend
cd frontend
npm start
# Output: http://localhost:3000
```

### 6. Login with Demo Credentials

```
Email: admin@store.com
Password: Admin@123
```

---

## 📡 API Documentation

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@store.com",
  "password": "Admin@123"
}

Response:
{
  "user": {
    "id": "uuid",
    "email": "admin@store.com",
    "full_name": "Admin User",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "full_name": "John Doe",
  "role": "cashier"
}
```

### Products

#### Get All Products
```http
GET /api/products
Authorization: Bearer <token>

Response: [
  {
    "id": "uuid",
    "sku": "SKU-001",
    "name": "MacBook Pro 14\"",
    "price": 1999.99,
    "quantity_in_stock": 10,
    "category": "Laptops"
  },
  ...
]
```

#### Create Product
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "sku": "SKU-NEW",
  "name": "New Product",
  "description": "Product description",
  "category_id": "uuid",
  "price": 299.99,
  "cost": 150.00,
  "quantity_in_stock": 50
}
```

### Transactions

#### Create Transaction
```http
POST /api/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer_id": "uuid or null",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 2,
      "unit_price": 999.99
    }
  ],
  "payment_method": "cash"
}

Response: {
  "transaction": { ... },
  "receipt": {
    "receipt_number": "RCP-20240101-00001",
    "customer_data": { ... }
  }
}
```

#### Cancel Transaction
```http
PUT /api/transactions/{id}/cancel
Authorization: Bearer <token>

// Automatically returns stock to inventory
```

### Customers

#### Search Customer
```http
GET /api/customers/search/1234567890
Authorization: Bearer <token>

Response: {
  "id": "uuid",
  "phone": "1234567890",
  "full_name": "John Doe",
  "total_purchases": 2500.00,
  "purchase_count": 12,
  "is_eligible_for_discount": true,
  "discount_percentage": 5
}
```

### Reports

#### Generate Daily Report
```http
POST /api/reports/daily
Authorization: Bearer <token>
Content-Type: application/json

{
  "report_date": "2024-01-15"
}

Response: {
  "report_date": "2024-01-15",
  "total_sales": 15000.50,
  "total_transactions": 45,
  "total_discount_given": 450.00,
  "top_products": [...],
  "payment_breakdown": {
    "cash": 8000.00,
    "card": 6500.00,
    "check": 500.50
  }
}
```

---

## 🖥️ User Interfaces

### 1. Cashier Interface
**Purpose**: Fast, efficient POS operations

**Key Elements:**
- Left side: Product grid with instant search
- Right side: 
  - Top: Customer lookup/creation
  - Bottom: Shopping cart with real-time totals
- One-click checkout with automatic discount application
- Receipt printing/email

**Workflow:**
1. Search for customer by phone
2. Scan/search products
3. Add items to cart
4. Review automatic discounts
5. Complete payment
6. Print receipt

### 2. Store Manager Dashboard
**Purpose**: Inventory and product oversight

**Key Elements:**
- Product list with stock levels
- Add/Edit product form
- Inventory adjustment interface
- Daily analytics summary
- Low stock alerts

**Permissions:**
- ✅ Add products
- ✅ Edit products  
- ✅ View inventory
- ❌ Delete products
- ❌ Create users

### 3. Admin Dashboard
**Purpose**: Complete system control

**Tabs:**
1. **Dashboard**: Daily metrics, top products, low stock items
2. **Users**: Create/manage user accounts and permissions
3. **Reports**: Generate and view daily reports
4. **Products**: Full product CRUD with supplier import
5. **Analytics**: Advanced metrics and trends

---

## 🗄️ Database Schema

### Core Tables

```sql
-- Users & Roles
users
  id, email, password_hash, full_name, role, is_active

-- Products & Categories
categories
  id, name, description
products
  id, sku, name, price, cost, quantity_in_stock, category_id

-- Customers & Loyalty
customers
  id, phone, full_name, email, total_purchases, purchase_count
  is_eligible_for_discount, discount_percentage

-- Transactions & Receipts
transactions
  id, transaction_number, customer_id, cashier_id, total_amount
  discount_amount, tax, payment_method, status
transaction_items
  id, transaction_id, product_id, quantity, unit_price
receipts
  id, transaction_id, receipt_number, customer_receipt_data

-- Inventory & Reports
inventory_logs
  id, product_id, action, quantity_change, created_by
daily_reports
  id, report_date, total_sales, total_transactions, top_products

-- Audit
audit_logs
  id, user_id, action, entity_type, entity_id, old_values, new_values
```

### Key Relationships
```
users 1──→ ∞ transactions
users 1──→ ∞ audit_logs
categories 1──→ ∞ products
products 1──→ ∞ transaction_items
customers 1──→ ∞ transactions
transactions 1──→ ∞ transaction_items
transactions 1──→ 1 receipts
```

---

## 🔒 Security

### Authentication & Authorization
- ✅ JWT tokens with 24h expiration
- ✅ Password hashing with bcryptjs (salt rounds: 10)
- ✅ Role-based access control (RBAC)
- ✅ Row Level Security (RLS) in Supabase

### Data Protection
- ✅ HTTPS/TLS encryption in production
- ✅ CORS properly configured
- ✅ Input validation on all endpoints
- ✅ SQL injection prevention (parameterized queries)
- ✅ Rate limiting on API endpoints
- ✅ Audit logging for sensitive operations

### Best Practices
```
✓ Never commit .env files
✓ Use strong JWT secrets (min 32 chars)
✓ Rotate secrets regularly
✓ Monitor suspicious login attempts
✓ Regular security audits
✓ Keep dependencies updated
✓ Use HTTPS in production
✓ Implement IP whitelisting (optional)
```

---

## 🐛 Troubleshooting

### Backend Issues

#### Port already in use
```bash
# Kill process on port 5000
lsof -i :5000
kill -9 <PID>

# Or change PORT in .env
PORT=5001
```

#### Database connection error
```
Error: connect ECONNREFUSED
- Check SUPABASE_URL in .env
- Verify Supabase project is active
- Check internet connection
- Verify API key hasn't expired
```

#### JWT verification failed
```
- Token may be expired (24h limit)
- Re-login to get new token
- Check JWT_SECRET matches in backend
```

### Frontend Issues

#### API calls failing
```
CORS Error:
- Backend CORS configuration correct?
- Check REACT_APP_API_URL in .env
- Verify backend is running

404 Not Found:
- Backend server running?
- Check endpoint URL
- API response format matches?
```

#### Login not working
```
Invalid credentials:
- Double-check username/password
- Create test user in database
- Check password hash in DB

Token not persisting:
- Check localStorage enabled
- Clear browser storage
- Try incognito mode
```

### Database Issues

#### Table doesn't exist
```
- Run schema.sql in Supabase SQL editor
- Verify all migrations applied
- Check table name spelling
```

#### Row Level Security errors
```
- User must be authenticated
- Check RLS policies in Supabase
- Verify user_id in JWT matches
```

---

## 📊 Customer Loyalty Logic

### Eligibility Criteria
```javascript
if (customer.purchase_count >= 10 OR customer.total_purchases >= 1000) {
  customer.is_eligible_for_discount = true
  customer.discount_percentage = 5
}
```

### Discount Application
```javascript
const subtotal = items.reduce((sum, item) => 
  sum + (item.quantity * item.unit_price), 0
)

const discount = customer?.is_eligible_for_discount
  ? subtotal * (customer.discount_percentage / 100)
  : 0

const tax = (subtotal - discount) * 0.10  // 10% tax
const total = subtotal - discount + tax
```

---

## 🔄 Daily Report Generation

**Triggers:** Automatically at end of day (configurable time)

**Includes:**
```javascript
{
  report_date: "2024-01-15",
  total_sales: 15000.50,
  total_transactions: 45,
  total_discount_given: 450.00,
  total_tax: 1405.05,
  payment_breakdown: {
    cash: 8000.00,
    card: 6500.00,
    check: 500.50
  },
  top_products: [
    { name: "Product 1", units_sold: 10, revenue: 9999.90 },
    ...
  ],
  metrics: {
    avg_transaction_value: 333.34,
    customer_count: 35,
    returning_customers: 12
  }
}
```

---

## 📈 Analytics Dashboard

### Real-Time Metrics
- Total sales (today/this week/this month)
- Transaction count
- Average transaction value
- Top selling products
- Top customers
- Payment method breakdown

### Historical Data
- Sales trends (charts)
- Customer growth
- Inventory turnover
- Profit margins
- Seasonal trends

---

## 🌐 Supplier Integration

### Supported Platforms
- Alibaba (B2B wholesale)
- AliExpress (Dropshipping)

### Integration Steps
```
1. Admin → Settings → Supplier Integration
2. Enter API credentials
3. Select products to import
4. System fetches details
5. Review and adjust pricing
6. Publish to inventory
```

### API Connection
```javascript
// Example: Import from Alibaba
const products = await alibabaAPI.searchProducts(query)
// Map to local schema
const mappedProducts = products.map(p => ({
  external_product_id: p.id,
  name: p.name,
  price: p.price,
  supplier_sku: p.sku,
  ...
}))
```

---

## 📝 Receipt Formats

### Customer Receipt (POS)
```
╔════════════════════════════╗
║   ELECTRONICS STORE        ║
║   Receipt #RCP-20240101-1  ║
╠════════════════════════════╣
║ Date: 2024-01-15 3:45 PM   ║
║ Customer: John Doe         ║
├────────────────────────────┤
║ Product          Qty Price ║
║ MacBook Pro       1  1999  ║
║ USB-C Cable       2   30   ║
├────────────────────────────┤
║ Subtotal:         2029.00  ║
║ Discount (5%):    -101.45  ║
║ Tax (10%):         192.75  ║
║ TOTAL:            2120.30  ║
├────────────────────────────┤
║ Payment: CASH              ║
║ Change: 79.70              ║
╚════════════════════════════╝
```

### Merchant Receipt (Database)
```json
{
  "receipt_number": "RCP-20240101-1",
  "transaction_id": "uuid",
  "timestamp": "2024-01-15T15:45:00Z",
  "cashier": "Jane Smith",
  "items": [...],
  "totals": {...},
  "customer_phone": "1234567890",
  "loyalty_discount_applied": 5
}
```

---

## 🚀 Deployment Checklist

Before going to production:

### Backend
- [ ] Change JWT_SECRET to strong value
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS
- [ ] Configure rate limiting
- [ ] Setup error logging (Sentry, LogRocket)
- [ ] Enable database backups
- [ ] Setup monitoring alerts
- [ ] Test all API endpoints
- [ ] Review security headers

### Frontend
- [ ] Build optimized version: `npm run build`
- [ ] Set correct API URL (production backend)
- [ ] Enable analytics (Google Analytics, Mixpanel)
- [ ] Test all user workflows
- [ ] Verify receipt printing
- [ ] Test on mobile devices
- [ ] Setup CDN for static files
- [ ] Configure domain/SSL

### Database
- [ ] Verify all tables created
- [ ] Test RLS policies
- [ ] Setup automatic backups
- [ ] Create admin user
- [ ] Test data integrity
- [ ] Monitor query performance

---

## 📞 Support & Contributing

### Report Issues
- GitHub Issues: [Submit here]
- Email: support@electronics-pos.com

### Contributing
- Fork the repository
- Create feature branch
- Submit pull request
- Ensure tests pass

### License
MIT License - See LICENSE file

---

## 🙏 Acknowledgments

Built with:
- Supabase for backend infrastructure
- React for modern UI
- Express.js for robust API
- PostgreSQL for reliable data storage

---

**Version:** 1.0.0  
**Last Updated:** January 2024  
**Status:** Production Ready ✅

---

For detailed setup instructions, see [SETUP.md](docs/SETUP.md)  
For API reference, see [API.md](docs/API.md)  
For database documentation, see [DATABASE.md](docs/DATABASE.md)
