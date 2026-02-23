// ============================================
// FRONTEND - React POS System
// Complete Application with All Three Interfaces
// ============================================

import React, { useState, useEffect } from 'react';
import './App.css';

// ============================================
// API SERVICE
// ============================================

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiService = {
  setToken: (token) => {
    localStorage.setItem('token', token);
  },

  getToken: () => localStorage.getItem('token'),

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  },

  // Auth endpoints
  login: (email, password) =>
    apiService.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data) =>
    apiService.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // User management
  getUsers: () => apiService.request('/users'),
  createUser: (data) =>
    apiService.request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) =>
    apiService.request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Products
  getProducts: () => apiService.request('/products'),
  getProduct: (id) => apiService.request(`/products/${id}`),
  createProduct: (data) =>
    apiService.request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) =>
    apiService.request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) =>
    apiService.request(`/products/${id}`, { method: 'DELETE' }),

  // Customers
  getCustomers: () => apiService.request('/customers'),
  searchCustomer: (phone) => apiService.request(`/customers/search/${phone}`),
  createCustomer: (data) =>
    apiService.request('/customers', { method: 'POST', body: JSON.stringify(data) }),

  // Transactions
  createTransaction: (data) =>
    apiService.request('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  getTransaction: (id) => apiService.request(`/transactions/${id}`),
  cancelTransaction: (id) =>
    apiService.request(`/transactions/${id}/cancel`, { method: 'PUT' }),

  // Reports
  generateDailyReport: (data) =>
    apiService.request('/reports/daily', { method: 'POST', body: JSON.stringify(data) }),
  getDailyReport: (date) => apiService.request(`/reports/daily/${date}`),

  // Inventory
  getInventoryLogs: () => apiService.request('/inventory/logs'),
  adjustInventory: (data) =>
    apiService.request('/inventory/adjust', { method: 'POST', body: JSON.stringify(data) }),

  // Analytics
  getAnalyticsSummary: () => apiService.request('/analytics/summary'),

  // Suppliers
  createSupplier: (data) =>
    apiService.request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  importProducts: (data) =>
    apiService.request('/suppliers/import-products', { method: 'POST', body: JSON.stringify(data) }),
};

// ============================================
// AUTHENTICATION CONTEXT
// ============================================

const AuthContext = React.createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = apiService.getToken();
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await apiService.login(email, password);
      apiService.setToken(response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      return response.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// ============================================
// LOGIN PAGE
// ============================================

function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>⚡ Electronics Store</h1>
          <h2>POS System</h2>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-footer">
          <p>📧 admin@store.com / 🔑 Admin@123</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CASHIER INTERFACE
// ============================================

function CashierInterface() {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await apiService.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const searchCustomer = async () => {
    if (!phone) return;
    try {
      const data = await apiService.searchCustomer(phone);
      if (data) {
        setCustomer(data);
      } else {
        // Create new customer
        const newCustomer = await apiService.createCustomer({
          phone,
          full_name: 'Guest',
        });
        setCustomer(newCustomer);
      }
    } catch (error) {
      console.error('Error searching customer:', error);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.product_id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          product_id: product.id,
          product_name: product.name,
          unit_price: product.price,
          quantity: 1,
        },
      ]);
    }
  };

  const removeFromCart = (product_id) => {
    setCart(cart.filter((item) => item.product_id !== product_id));
  };

  const updateQuantity = (product_id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(product_id);
    } else {
      setCart(
        cart.map((item) =>
          item.product_id === product_id ? { ...item, quantity } : item
        )
      );
    }
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
    const discount = customer?.is_eligible_for_discount
      ? subtotal * (customer.discount_percentage / 100)
      : 0;
    const tax = (subtotal - discount) * 0.1;
    const total = subtotal - discount + tax;

    return { subtotal, discount, tax, total };
  };

  const completeTransaction = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    setLoading(true);
    try {
      const totals = calculateTotals();
      const transaction = await apiService.createTransaction({
        customer_id: customer?.id,
        items: cart,
        payment_method: 'cash', // Could be dynamic
        notes: '',
      });

      // Reset
      setCart([]);
      setCustomer(null);
      setPhone('');
      alert(`Transaction completed!\nReceipt #: ${transaction.receipt.receipt_number}`);
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totals = calculateTotals();

  return (
    <div className="cashier-interface">
      <header className="cashier-header">
        <div className="header-left">
          <h1>💳 Cashier POS</h1>
          <p>Welcome, {user.full_name}</p>
        </div>
        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </header>

      <div className="cashier-content">
        {/* Left: Products & Search */}
        <div className="cashier-products">
          <div className="search-section">
            <h3>Search Products</h3>
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="products-grid">
            {filteredProducts.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-info">
                  <h4>{product.name}</h4>
                  <p className="sku">SKU: {product.sku}</p>
                  <p className="stock">Stock: {product.quantity_in_stock}</p>
                </div>
                <div className="product-footer">
                  <span className="price">${product.price.toFixed(2)}</span>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.quantity_in_stock === 0}
                    className="add-btn"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Customer & Cart */}
        <div className="cashier-sidebar">
          {/* Customer Section */}
          <div className="customer-section">
            <h3>Customer Details</h3>
            <div className="customer-input">
              <input
                type="tel"
                placeholder="Enter phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <button onClick={searchCustomer}>Search</button>
            </div>

            {customer && (
              <div className="customer-card">
                <p><strong>{customer.full_name}</strong></p>
                <p>📱 {customer.phone}</p>
                {customer.is_eligible_for_discount && (
                  <p className="discount-badge">
                    🎁 {customer.discount_percentage}% Loyalty Discount
                  </p>
                )}
                <p className="customer-stats">
                  Purchases: {customer.purchase_count} | Total: ${customer.total_purchases.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Cart Section */}
          <div className="cart-section">
            <h3>Shopping Cart</h3>
            {cart.length === 0 ? (
              <p className="empty-cart">Cart is empty</p>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div key={item.product_id} className="cart-item">
                      <div className="item-info">
                        <p>{item.product_name}</p>
                        <p className="item-price">
                          ${item.unit_price.toFixed(2)} x {item.quantity}
                        </p>
                      </div>
                      <div className="item-controls">
                        <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)}>
                          −
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.product_id, parseInt(e.target.value) || 1)
                          }
                          className="qty-input"
                        />
                        <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product_id)}
                          className="remove-btn"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-totals">
                  <div className="total-row">
                    <span>Subtotal:</span>
                    <span>${totals.subtotal.toFixed(2)}</span>
                  </div>
                  {totals.discount > 0 && (
                    <div className="total-row discount">
                      <span>Discount:</span>
                      <span>-${totals.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="total-row">
                    <span>Tax (10%):</span>
                    <span>${totals.tax.toFixed(2)}</span>
                  </div>
                  <div className="total-row final">
                    <span>TOTAL:</span>
                    <span>${totals.total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={completeTransaction}
                  disabled={loading}
                  className="checkout-btn"
                >
                  {loading ? 'Processing...' : '✓ Complete Transaction'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// STORE MANAGER INTERFACE
// ============================================

function StoreManagerInterface() {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    price: '',
    cost: '',
    quantity_in_stock: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await apiService.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        await apiService.updateProduct(editingId, formData);
      } else {
        await apiService.createProduct(formData);
      }
      
      loadProducts();
      setShowForm(false);
      setEditingId(null);
      setFormData({
        sku: '',
        name: '',
        description: '',
        price: '',
        cost: '',
        quantity_in_stock: '',
      });
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      price: product.price,
      cost: product.cost || '',
      quantity_in_stock: product.quantity_in_stock,
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      sku: '',
      name: '',
      description: '',
      price: '',
      cost: '',
      quantity_in_stock: '',
    });
  };

  return (
    <div className="store-manager-interface">
      <header className="manager-header">
        <div className="header-left">
          <h1>📦 Store Manager Dashboard</h1>
          <p>Welcome, {user.full_name}</p>
        </div>
        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </header>

      <div className="manager-content">
        <div className="manager-toolbar">
          <h2>Inventory Management</h2>
          <button
            className="add-product-btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '✕ Cancel' : '➕ Add New Product'}
          </button>
        </div>

        {showForm && (
          <div className="product-form-container">
            <form onSubmit={handleSubmit} className="product-form">
              <h3>{editingId ? 'Edit Product' : 'New Product'}</h3>

              <div className="form-grid">
                <div className="form-group">
                  <label>SKU *</label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    required
                    disabled={!!editingId}
                  />
                </div>

                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Price (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Cost (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="cost"
                    value={formData.cost}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input
                    type="number"
                    name="quantity_in_stock"
                    value={formData.quantity_in_stock}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Product'}
                </button>
                <button type="button" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Price</th>
                <th>Cost</th>
                <th>Stock</th>
                <th>Margin</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const margin = product.cost
                  ? (((product.price - product.cost) / product.price) * 100).toFixed(1)
                  : '-';
                return (
                  <tr key={product.id} className={product.quantity_in_stock < 10 ? 'low-stock' : ''}>
                    <td>{product.sku}</td>
                    <td>{product.name}</td>
                    <td>${product.price.toFixed(2)}</td>
                    <td>${product.cost ? product.cost.toFixed(2) : '-'}</td>
                    <td>
                      <span className={product.quantity_in_stock < 10 ? 'warning' : ''}>
                        {product.quantity_in_stock}
                      </span>
                    </td>
                    <td>{margin}%</td>
                    <td>
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(product)}
                      >
                        ✎ Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ADMIN INTERFACE
// ============================================

function AdminInterface() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'cashier',
  });

  useEffect(() => {
    loadAnalytics();
    loadUsers();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await apiService.getAnalyticsSummary();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await apiService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await apiService.createUser(newUser);
      loadUsers();
      setShowUserForm(false);
      setNewUser({
        email: '',
        password: '',
        full_name: '',
        role: 'cashier',
      });
      alert('User created successfully');
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const generateDailyReport = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await apiService.generateDailyReport({ report_date: today });
      alert('Daily report generated successfully');
      loadAnalytics();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="admin-interface">
      <header className="admin-header">
        <div className="header-left">
          <h1>👨‍💼 Admin Dashboard</h1>
          <p>System Administrator - {user.full_name}</p>
        </div>
        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </header>

      <nav className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📈 Reports
        </button>
        <button
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          📦 Products
        </button>
      </nav>

      <div className="admin-content">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-section">
            <h2>Daily Summary</h2>
            {analytics ? (
              <div className="analytics-grid">
                <div className="analytics-card">
                  <h4>Today's Sales</h4>
                  <p className="value">
                    ${analytics.today_sales?.total_sales?.toFixed(2) || '0.00'}
                  </p>
                  <small>{analytics.today_sales?.total_transactions || 0} transactions</small>
                </div>

                <div className="analytics-card">
                  <h4>Top Product</h4>
                  {analytics.top_products && analytics.top_products.length > 0 ? (
                    <>
                      <p className="value">{analytics.top_products[0].name}</p>
                      <small>{analytics.top_products[0].units_sold} units sold</small>
                    </>
                  ) : (
                    <p>No sales yet</p>
                  )}
                </div>

                <div className="analytics-card">
                  <h4>Low Stock Items</h4>
                  <p className="value">{analytics.low_stock_items}</p>
                  <small>products below reorder level</small>
                </div>

                <div className="analytics-card">
                  <h4>Top Customer</h4>
                  {analytics.top_customers && analytics.top_customers.length > 0 ? (
                    <>
                      <p className="value">{analytics.top_customers[0].full_name}</p>
                      <small>Lifetime: ${analytics.top_customers[0].total_purchases?.toFixed(2)}</small>
                    </>
                  ) : (
                    <p>No customers yet</p>
                  )}
                </div>
              </div>
            ) : (
              <p>Loading analytics...</p>
            )}

            <button onClick={generateDailyReport} className="generate-report-btn">
              📋 Generate Today's Report
            </button>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="users-section">
            <div className="section-header">
              <h2>Manage Users & Permissions</h2>
              <button
                className="add-btn"
                onClick={() => setShowUserForm(!showUserForm)}
              >
                {showUserForm ? '✕ Cancel' : '➕ Add User'}
              </button>
            </div>

            {showUserForm && (
              <form onSubmit={handleCreateUser} className="user-form">
                <div className="form-grid">
                  <input
                    type="email"
                    placeholder="Email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                    required
                  />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newUser.full_name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, full_name: e.target.value })
                    }
                    required
                  />
                  <select
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({ ...newUser, role: e.target.value })
                    }
                  >
                    <option value="cashier">Cashier</option>
                    <option value="store_manager">Store Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button type="submit">Create User</button>
              </form>
            )}

            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.full_name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`role-badge role-${u.role}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{u.is_active ? '✓ Active' : '✗ Inactive'}</td>
                    <td>
                      <button className="action-btn">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="reports-section">
            <h2>Daily Reports</h2>
            <p>Generate and view daily transaction reports</p>
            <button onClick={generateDailyReport} className="report-btn">
              Generate Report
            </button>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="products-section">
            <h2>Product Management</h2>
            <p>Full product management capabilities (add, edit, delete)</p>
            {/* Would include full product management interface */}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// MAIN APP
// ============================================

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  if (user.role === 'cashier') {
    return <CashierInterface />;
  }

  if (user.role === 'store_manager') {
    return <StoreManagerInterface />;
  }

  if (user.role === 'admin') {
    return <AdminInterface />;
  }

  return <div>Unknown role</div>;
}

function AppWrapper() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

export default AppWrapper;
