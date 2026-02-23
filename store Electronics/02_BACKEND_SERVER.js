// ============================================
// BACKEND SERVER - Express.js with Supabase
// Main Server Configuration & Setup
// ============================================

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

// ============================================
// INITIALIZE EXPRESS & SUPABASE
// ============================================

const app = express();
const PORT = process.env.PORT || 5000;

// Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// JWT Authentication Middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token verification failed' });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// User Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash: hashedPassword,
          full_name,
          role: role || 'cashier',
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const token = jwt.sign(
      { id: data.id, email: data.email, role: data.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ user: data, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// USER MANAGEMENT ROUTES (Admin Only)
// ============================================

// Get all users
app.get('/api/users', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, is_active, created_at');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user (Admin)
app.post('/api/users', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;

    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash: hashedPassword,
          full_name,
          role,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await supabase.from('audit_logs').insert([
      {
        user_id: req.user.id,
        action: 'CREATE_USER',
        entity_type: 'users',
        entity_id: data.id,
        new_values: { email, full_name, role },
      },
    ]);

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user role/privileges (Admin)
app.put('/api/users/:id', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role, is_active } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({ role, is_active, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('audit_logs').insert([
      {
        user_id: req.user.id,
        action: 'UPDATE_USER',
        entity_type: 'users',
        entity_id: id,
        new_values: { role, is_active },
      },
    ]);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PRODUCT MANAGEMENT ROUTES
// ============================================

// Get all products
app.get('/api/products', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('is_active', true);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get product by ID
app.get('/api/products/:id', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create product (Admin/Store Manager)
app.post('/api/products', authMiddleware, authorize('admin', 'store_manager'), async (req, res) => {
  try {
    const {
      sku,
      name,
      description,
      category_id,
      price,
      cost,
      quantity_in_stock,
      reorder_level,
      supplier_name,
      barcode,
    } = req.body;

    if (!sku || !name || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          sku,
          name,
          description,
          category_id,
          price: parseFloat(price),
          cost: cost ? parseFloat(cost) : null,
          quantity_in_stock: quantity_in_stock || 0,
          reorder_level: reorder_level || 10,
          supplier_name,
          barcode,
          created_by: req.user.id,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    await supabase.from('audit_logs').insert([
      {
        user_id: req.user.id,
        action: 'CREATE_PRODUCT',
        entity_type: 'products',
        entity_id: data.id,
        new_values: { sku, name, price },
      },
    ]);

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product (Admin/Store Manager)
app.put('/api/products/:id', authMiddleware, authorize('admin', 'store_manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, cost, quantity_in_stock, reorder_level } = req.body;

    const { data, error } = await supabase
      .from('products')
      .update({
        name,
        description,
        price: price ? parseFloat(price) : undefined,
        cost: cost ? parseFloat(cost) : undefined,
        quantity_in_stock,
        reorder_level,
        updated_at: new Date(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('audit_logs').insert([
      {
        user_id: req.user.id,
        action: 'UPDATE_PRODUCT',
        entity_type: 'products',
        entity_id: id,
        new_values: { name, price, quantity_in_stock },
      },
    ]);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product (Admin only)
app.delete('/api/products/:id', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    await supabase.from('audit_logs').insert([
      {
        user_id: req.user.id,
        action: 'DELETE_PRODUCT',
        entity_type: 'products',
        entity_id: id,
      },
    ]);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// CUSTOMER MANAGEMENT ROUTES
// ============================================

// Get all customers
app.get('/api/customers', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('total_purchases', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Find customer by phone
app.get('/api/customers/search/:phone', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', req.params.phone)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    res.json(data || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create customer
app.post('/api/customers', authMiddleware, async (req, res) => {
  try {
    const { phone, full_name, email, address, city, country } = req.body;

    if (!phone || !full_name) {
      return res.status(400).json({ error: 'Phone and name required' });
    }

    const { data, error } = await supabase
      .from('customers')
      .insert([
        {
          phone,
          full_name,
          email,
          address,
          city,
          country,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// TRANSACTION ROUTES
// ============================================

// Create transaction (with receipt)
app.post('/api/transactions', authMiddleware, authorize('admin', 'cashier'), async (req, res) => {
  try {
    const {
      customer_id,
      items,
      payment_method,
      notes,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Transaction must have items' });
    }

    // Verify stock availability
    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('quantity_in_stock')
        .eq('id', item.product_id)
        .single();

      if (!product || product.quantity_in_stock < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for product ${item.product_id}` 
        });
      }
    }

    // Calculate totals
    let subtotal = 0;
    let tax = 0;
    let discount = 0;

    for (const item of items) {
      const lineTotal = item.quantity * item.unit_price;
      subtotal += lineTotal;
    }

    // Check customer eligibility for discount
    let customerData = null;
    if (customer_id) {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customer_id)
        .single();
      customerData = data;

      if (data && data.is_eligible_for_discount) {
        discount = subtotal * (data.discount_percentage / 100);
      }
    }

    tax = (subtotal - discount) * 0.1; // 10% tax
    const totalAmount = subtotal - discount + tax;

    // Create transaction
    const transactionNumber = `TXN-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`;

    const { data: transaction, error: txnError } = await supabase
      .from('transactions')
      .insert([
        {
          transaction_number: transactionNumber,
          customer_id,
          cashier_id: req.user.id,
          subtotal,
          discount_amount: discount,
          tax,
          total_amount: totalAmount,
          payment_method,
          status: 'completed',
          notes,
        },
      ])
      .select()
      .single();

    if (txnError) throw txnError;

    // Insert transaction items
    for (const item of items) {
      await supabase
        .from('transaction_items')
        .insert([
          {
            transaction_id: transaction.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            line_total: item.quantity * item.unit_price,
          },
        ]);
    }

    // Generate receipt
    const receiptNumber = `RCP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`;

    const customerReceiptData = {
      receipt_number: receiptNumber,
      transaction_date: new Date(),
      customer_name: customerData?.full_name || 'Guest',
      items: items,
      subtotal,
      discount,
      tax,
      total: totalAmount,
      payment_method,
    };

    const merchantReceiptData = {
      receipt_number: receiptNumber,
      transaction_id: transaction.id,
      cashier_id: req.user.id,
      ...customerReceiptData,
    };

    await supabase
      .from('receipts')
      .insert([
        {
          transaction_id: transaction.id,
          receipt_number: receiptNumber,
          customer_receipt_data: customerReceiptData,
          merchant_receipt_data: merchantReceiptData,
        },
      ]);

    res.status(201).json({
      transaction,
      receipt: {
        receipt_number: receiptNumber,
        customer_data: customerReceiptData,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transaction by ID
app.get('/api/transactions/:id', authMiddleware, async (req, res) => {
  try {
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*, transaction_items(*, products(name, sku))')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    const { data: receipt } = await supabase
      .from('receipts')
      .select('*')
      .eq('transaction_id', req.params.id)
      .single();

    res.json({ transaction, receipt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel transaction (Cashier & Admin)
app.put('/api/transactions/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (transaction.cashier_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Return stock
    const { data: items } = await supabase
      .from('transaction_items')
      .select('*')
      .eq('transaction_id', id);

    for (const item of items) {
      await supabase
        .from('products')
        .update({
          quantity_in_stock: supabase.rpc('increment_stock', {
            product_id: item.product_id,
            amount: item.quantity,
          }),
        });
    }

    const { data, error } = await supabase
      .from('transactions')
      .update({ status: 'cancelled', updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('audit_logs').insert([
      {
        user_id: req.user.id,
        action: 'CANCEL_TRANSACTION',
        entity_type: 'transactions',
        entity_id: id,
      },
    ]);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// DAILY REPORT ROUTES
// ============================================

// Generate daily report (Admin)
app.post('/api/reports/daily', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { report_date } = req.body;
    const date = report_date ? new Date(report_date) : new Date();
    const dateStr = date.toISOString().split('T')[0];

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*, transaction_items(quantity, line_total, products(name))')
      .eq('status', 'completed')
      .gte('created_at', `${dateStr}T00:00:00`)
      .lt('created_at', `${dateStr}T23:59:59`);

    if (error) throw error;

    // Calculate metrics
    const totalSales = transactions.reduce((sum, t) => sum + parseFloat(t.total_amount), 0);
    const totalTransactions = transactions.length;
    const totalDiscount = transactions.reduce((sum, t) => sum + (t.discount_amount || 0), 0);
    const totalTax = transactions.reduce((sum, t) => sum + (t.tax || 0), 0);

    const paymentMethods = {
      cash: transactions.filter(t => t.payment_method === 'cash').reduce((sum, t) => sum + parseFloat(t.total_amount), 0),
      card: transactions.filter(t => t.payment_method === 'card').reduce((sum, t) => sum + parseFloat(t.total_amount), 0),
      check: transactions.filter(t => t.payment_method === 'check').reduce((sum, t) => sum + parseFloat(t.total_amount), 0),
    };

    // Top products
    const productMap = {};
    transactions.forEach(t => {
      t.transaction_items.forEach(item => {
        if (!productMap[item.products.name]) {
          productMap[item.products.name] = 0;
        }
        productMap[item.products.name] += item.quantity;
      });
    });

    const topProducts = Object.entries(productMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => ({ name, quantity: qty }));

    const reportSummary = {
      total_sales: totalSales,
      total_transactions: totalTransactions,
      average_transaction: totalTransactions > 0 ? totalSales / totalTransactions : 0,
      payment_breakdown: paymentMethods,
    };

    const { data: report, error: reportError } = await supabase
      .from('daily_reports')
      .upsert([
        {
          report_date: dateStr,
          total_sales: totalSales,
          total_transactions: totalTransactions,
          total_discount_given: totalDiscount,
          total_tax: totalTax,
          cash_sales: paymentMethods.cash,
          card_sales: paymentMethods.card,
          check_sales: paymentMethods.check,
          top_products: topProducts,
          report_summary: reportSummary,
          generated_by: req.user.id,
        },
      ], { onConflict: 'report_date' })
      .select()
      .single();

    if (reportError) throw reportError;

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get daily report
app.get('/api/reports/daily/:date', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('report_date', req.params.date)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    res.json(data || { message: 'No report for this date' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// SUPPLIER INTEGRATION ROUTES
// ============================================

// Add supplier integration (Admin)
app.post('/api/suppliers', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { supplier_name, api_key, api_secret, endpoint_url } = req.body;

    if (!supplier_name || !api_key || !endpoint_url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('supplier_integrations')
      .insert([
        {
          supplier_name,
          api_key,
          api_secret,
          endpoint_url,
          created_by: req.user.id,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import products from supplier (Admin)
app.post('/api/suppliers/import-products', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { supplier_id, product_ids } = req.body;

    // This would integrate with actual supplier APIs (Alibaba, AliExpress)
    // For demonstration, we're creating a placeholder

    const { data: supplierIntegration } = await supabase
      .from('supplier_integrations')
      .select('*')
      .eq('id', supplier_id)
      .single();

    // Placeholder: In production, call supplier API here
    const importedProducts = [];
    for (const productId of product_ids) {
      const { data, error } = await supabase
        .from('imported_products')
        .insert([
          {
            external_product_id: productId,
            supplier_id,
            import_status: 'completed',
            imported_by: req.user.id,
            imported_at: new Date(),
          },
        ])
        .select()
        .single();

      if (!error) importedProducts.push(data);
    }

    res.json({ message: 'Products imported', imported: importedProducts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// INVENTORY ROUTES
// ============================================

// Get inventory logs
app.get('/api/inventory/logs', authMiddleware, authorize('admin', 'store_manager'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('inventory_logs')
      .select('*, products(name, sku)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Adjust inventory (Admin/Store Manager)
app.post('/api/inventory/adjust', authMiddleware, authorize('admin', 'store_manager'), async (req, res) => {
  try {
    const { product_id, quantity_change, notes, action } = req.body;

    const { data: product } = await supabase
      .from('products')
      .select('quantity_in_stock')
      .eq('id', product_id)
      .single();

    const newQuantity = product.quantity_in_stock + quantity_change;

    await supabase
      .from('products')
      .update({ quantity_in_stock: newQuantity })
      .eq('id', product_id);

    const { data, error } = await supabase
      .from('inventory_logs')
      .insert([
        {
          product_id,
          action: action || 'adjustment',
          quantity_change,
          previous_quantity: product.quantity_in_stock,
          new_quantity: newQuantity,
          notes,
          created_by: req.user.id,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ANALYTICS ROUTES
// ============================================

// Get dashboard summary
app.get('/api/analytics/summary', authMiddleware, authorize('admin', 'store_manager'), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: todaysSales } = await supabase
      .from('daily_sales_summary')
      .select('*')
      .eq('sale_date', today)
      .single();

    const { data: topProducts } = await supabase
      .from('top_products_by_sales')
      .select('*')
      .limit(5);

    const { data: customerValue } = await supabase
      .from('customer_lifetime_value')
      .select('*')
      .limit(10);

    const { data: products } = await supabase
      .from('products')
      .select('quantity_in_stock, reorder_level')
      .lt('quantity_in_stock', 'reorder_level');

    res.json({
      today_sales: todaysSales,
      top_products: topProducts,
      top_customers: customerValue,
      low_stock_items: products?.length || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 POS System API ready`);
});

module.exports = app;
