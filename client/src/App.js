import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION & GLOBALS ---

// Initialize Supabase connection
const supabase = createClient(
  'https://jvqachvrbkvrsrseyyoh.supabase.co',
  'sb_publishable_rjBRgV9S-9jP0_07XI1xYg_s0FCJSPs'
);

// Centralized API URL and Theme Colors to make changes easy later
// This automatically detects if you are on localhost or on the live web
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api' 
  : '/api';
const COLORS = {
  primary: '#BE1E2D',   // FSU Red
  secondary: '#FFD700', // Gold
  dark: '#333333',
  light: '#f4f4f4',
  white: '#ffffff',
  text: '#444'
};

// Reusable UI styles to avoid repeating CSS in every component
const styles = {
  container: { padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: '"Segoe UI", sans-serif' },
  card: { border: '1px solid #eee', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
  button: { padding: '12px 24px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' },
  nav: { padding: '15px 5%', backgroundColor: COLORS.dark, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 1000 },
  input: { padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ddd', width: '100%' }
};

// --- COMPONENTS ---

/**
 * PRODUCT DETAIL: Shows a single item's full info based on the URL ID
 */
function ProductDetail({ addToCart }) {
  const { id } = useParams(); // Grabs the ID from /product/:id
  const [product, setProduct] = useState(null);

  useEffect(() => {
    // Fetch only the specific product for this page
    axios.get(`${API_BASE}/products/${id}`).then(res => setProduct(res.data)).catch(console.error);
  }, [id]);

  if (!product) return <div style={styles.container}>Loading FSU Gear...</div>;

  return (
    <div style={styles.container}>
      <Link to="/" style={{ color: COLORS.primary, textDecoration: 'none', fontWeight: 'bold' }}>← Back to All Merch</Link>
      <div style={{ display: 'flex', gap: '50px', marginTop: '30px', flexWrap: 'wrap' }}>
        <img src={product.image_url} alt={product.name} style={{ width: '100%', maxWidth: '400px', borderRadius: '20px' }} />
        <div style={{ flex: 1 }}>
          <span style={{ color: '#888', textTransform: 'uppercase' }}>{product.category}</span>
          <h1>{product.name}</h1>
          <p style={{ fontSize: '1.1rem', color: COLORS.text, lineHeight: '1.6' }}>{product.description}</p>
          <h2 style={{ color: COLORS.primary }}>${product.price}</h2>
          {/* Visual Stock indicator */}
          <p>Status: <strong style={{ color: product.stock > 0 ? 'green' : 'red' }}>
            {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
          </strong></p>
          <button 
            onClick={() => addToCart(product)} 
            disabled={product.stock <= 0} // Disable button if out of stock
            style={{ ...styles.button, backgroundColor: product.stock > 0 ? COLORS.dark : '#ccc', color: 'white', width: '250px' }}>
            {product.stock > 0 ? 'Add to Cart' : 'Sold Out'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * CART: Lists items and handles the Stripe Checkout redirect
 */
function Cart({ cart, clearCart }) {
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = async () => {
    try {
      // 1. Tell our backend to create a Stripe session
      const res = await axios.post(`${API_BASE}/create-checkout-session`, { cartItems: cart });
      // 2. Use the session ID to send the user to Stripe's payment page
      const stripe = window.Stripe('pk_test_51THmjhP4YAzW1hPFvkdQnhSUh7V0lG2smAfG9bTK7VYD0DFXBxSMcxB83hJ6UREUDZgSrhDd4pDvQlV6E2k0tZDT00aOGmNB6v');
      await stripe.redirectToCheckout({ sessionId: res.data.id });
    } catch (err) { alert("Checkout failed"); }
  };

  return (
    <div style={styles.container}>
      <h1>Your Shopping Cart</h1>
      {cart.length === 0 ? (
        <p>Your cart is empty. <Link to="/">Go get yourself some drip!</Link></p>
      ) : (
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px' }}>
          {cart.map((item, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #eee' }}>
              <span>{item.name}</span>
              <strong>${item.price.toFixed(2)}</strong>
            </div>
          ))}
          <div style={{ textAlign: 'right', marginTop: '30px' }}>
            <h3>Total: ${total.toFixed(2)}</h3>
            <button onClick={clearCart} style={{ ...styles.button, backgroundColor: '#eee', marginRight: '10px' }}>Clear</button>
            <button onClick={handleCheckout} style={{ ...styles.button, backgroundColor: COLORS.primary, color: 'white' }}>Proceed to Checkout</button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * ADMIN PANEL COMPONENT
 * Handles: 
 * 1. Product Creation
 * 2. Inventory Management (Stock Updates & Deletion)
 * 3. Customer Order Tracking & Status Updates
 */
function AdminPanel() {
  // --- STATE MANAGEMENT ---
  const [products, setProducts] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [newProduct, setNewProduct] = useState({ 
    name: '', price: '', category: '', image_url: '', description: '', stock: 0 
  });
  const [editStock, setEditStock] = useState({}); // Temporary storage for stock input changes

  // Load data as soon as the component mounts
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    fetchProducts();
    fetchAllOrders();
  };

  // --- API CALLS ---

  const fetchProducts = () => {
    axios.get(`${API_BASE}/products`)
      .then(res => setProducts(res.data))
      .catch(err => console.error("Error fetching products:", err));
  };

  const fetchAllOrders = () => {
    axios.get(`${API_BASE}/admin/orders`)
      .then(res => setAllOrders(res.data))
      .catch(err => console.error("Error fetching orders:", err));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/products`, newProduct);
      alert("Success: Product added to catalog!");
      setNewProduct({ name: '', price: '', category: '', image_url: '', description: '', stock: 0 });
      fetchProducts();
    } catch (err) { alert("Error adding product."); }
  };

  const handleUpdateStock = async (id) => {
    const newVal = editStock[id];
    if (newVal === undefined) return alert("Enter a number first");
    try {
      await axios.put(`${API_BASE}/products/${id}`, { stock: parseInt(newVal) });
      alert("Inventory updated!");
      fetchProducts();
    } catch (err) { alert("Update failed."); }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_BASE}/admin/orders/${orderId}/status`, { status: newStatus });
      fetchAllOrders(); // Refresh list to show new status
    } catch (err) { alert("Failed to update status."); }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to remove this item permanently?")) {
      await axios.delete(`${API_BASE}/products/${id}`);
      fetchProducts();
    }
  };

  // --- RENDER ---
  return (
    <div style={styles.container}>
      <h1 style={{ color: COLORS.primary, borderBottom: `3px solid ${COLORS.primary}`, paddingBottom: '10px' }}>
        Management Dashboard
      </h1>

      {/* SECTION 1: ADD NEW PRODUCT */}
      <section style={{ marginBottom: '50px' }}>
        <div style={{ ...styles.card, backgroundColor: '#fff' }}>
          <h2 style={{ marginTop: 0 }}>Add New Product</h2>
          <form onSubmit={handleAddProduct} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <input style={styles.input} placeholder="Product Name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required />
            <input style={styles.input} placeholder="Price ($)" type="number" step="0.01" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} required />
            <input style={styles.input} placeholder="Current Stock" type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})} required />
            <input style={styles.input} placeholder="Category (e.g. Hoodies)" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} />
            <input style={{ ...styles.input, gridColumn: '1 / span 2' }} placeholder="Image URL" value={newProduct.image_url} onChange={e => setNewProduct({...newProduct, image_url: e.target.value})} />
            <textarea style={{ ...styles.input, gridColumn: '1 / span 2', minHeight: '80px' }} placeholder="Product Description" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
            <button type="submit" style={{ ...styles.button, backgroundColor: COLORS.dark, color: 'white', gridColumn: '1 / span 2' }}>
              Save Product to Catalog
            </button>
          </form>
        </div>
      </section>

      {/* SECTION 2: INVENTORY TABLE */}
      <section style={{ marginBottom: '50px' }}>
        <h3>Current Inventory</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <thead>
            <tr style={{ backgroundColor: COLORS.dark, color: 'white', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Product</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '12px' }}>{p.name}</td>
                <td>${p.price}</td>
                <td>
                  <input 
                    type="number" 
                    defaultValue={p.stock} 
                    style={{ width: '60px', padding: '5px' }} 
                    onChange={e => setEditStock({...editStock, [p.id]: e.target.value})} 
                  />
                </td>
                <td>
                  <button onClick={() => handleUpdateStock(p.id)} style={{ color: 'green', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Update</button>
                  <button onClick={() => handleDeleteProduct(p.id)} style={{ color: COLORS.primary, background: 'none', border: 'none', cursor: 'pointer', marginLeft: '15px' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* SECTION 3: ORDER MANAGEMENT */}
      <section>
        <h3>Customer Orders</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {allOrders.length === 0 ? <p>No orders placed yet.</p> : allOrders.map(order => (
            <div key={order.id} style={{ ...styles.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fdfdfd' }}>
              <div>
                <p><strong>Order ID:</strong> #{order.id}</p>
                <p><strong>Items:</strong> {order.items.map(i => i.name).join(', ')}</p>
                <p><strong>Total:</strong> ${order.total_amount.toFixed(2)}</p>
                <p style={{ fontSize: '0.8rem', color: '#666' }}>Placed: {new Date(order.created_at).toLocaleString()}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p>Status: <strong style={{ color: order.status === 'Shipped' ? 'green' : '#e67e22' }}>{order.status || 'Pending'}</strong></p>
                <select 
                  defaultValue={order.status || 'Pending'} 
                  onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
/**
 * HOME: The storefront. Handles product fetching and the search bar.
 */
function Home({ addToCart }) {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Get products and ensure we handle empty arrays gracefully
    axios.get(`${API_BASE}/products`).then(res => setProducts(Array.isArray(res.data) ? res.data : [])).catch(() => setProducts([]));
  }, []);

  // Filter products by name or category based on user typing
  const filtered = products.filter(p => (p.name + p.category).toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={styles.container}>
      <header style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ fontSize: '3rem', color: COLORS.primary }}>FSU Bobcat Shop</h1>
        <input 
          type="text" 
          placeholder="Search gear..." 
          style={{ ...styles.input, width: '60%', borderRadius: '30px', padding: '15px 25px', marginTop: '20px' }} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
        {filtered.map(product => (
          <div key={product.id} style={styles.card}>
            <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px' }} />
            <h3>{product.name}</h3>
            <p style={{ color: COLORS.primary, fontWeight: 'bold' }}>${product.price}</p>
            <button onClick={() => addToCart(product)} style={{ ...styles.button, width: '100%', backgroundColor: COLORS.dark, color: 'white' }}>Add To Cart</button>
            <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', color: COLORS.primary, display: 'block', textAlign: 'center', marginTop: '10px' }}>View Details →</Link>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- MAIN APP (The Switchboard) ---

function App() {
  // Sync cart with LocalStorage so users don't lose items on refresh
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("fsu_cart")) || []);
  const user = JSON.parse(localStorage.getItem("fsu_user"));

  useEffect(() => { localStorage.setItem("fsu_cart", JSON.stringify(cart)); }, [cart]);

  // Main logic for adding to cart (includes stock check)
  const addToCart = (product) => {
    if (product.stock <= 0) return alert("Out of stock!");
    setCart([...cart, product]);
    alert("Added to cart!");
  };

  const handleSignOut = () => {
    localStorage.removeItem("fsu_user");
    window.location.href = "/login";
  };

  return (
    <Router>
      <nav style={styles.nav}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: '900' }}>FSU BOBCAT SHOP</Link>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link to="/orders" style={{ color: 'white', textDecoration: 'none' }}>My Orders</Link>
          {/* Only show Admin link if it's Jack's email */}
          {user?.email === 'jack.maust2005@gmail.com' && <Link to="/admin" style={{ color: COLORS.secondary, textDecoration: 'none' }}>Admin</Link>}
          <Link to="/cart" style={{ color: COLORS.secondary, textDecoration: 'none' }}>🛒 Cart ({cart.length})</Link>
          {user ? (
            <button onClick={handleSignOut} style={{ ...styles.button, padding: '5px 10px', backgroundColor: COLORS.primary, color: 'white' }}>Sign Out</button>
          ) : <Link to="/login" style={{ color: 'white' }}>Login</Link>}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home addToCart={addToCart} />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/login" element={<Login />} />
        <Route path="/orders" element={<OrderHistory />} />
        <Route path="/product/:id" element={<ProductDetail addToCart={addToCart}/>} />
        <Route path="/cart" element={<Cart cart={cart} clearCart={() => setCart([])} />} />
        <Route path="/success" element={<SuccessPage cart={cart} clearCart={() => setCart([])} />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
      </Routes>

      <footer style={{ padding: '40px', backgroundColor: COLORS.dark, color: 'white', textAlign: 'center' }}>
        <Link to="/about" style={{ color: 'white', margin: '0 15px' }}>About</Link>
        <Link to="/privacy" style={{ color: 'white', margin: '0 15px' }}>Privacy</Link>
        <p>© 2026 FSU Bobcat Shop</p>
      </footer>
    </Router>
  );
}

/**
 * SUCCESS PAGE: Triggered after payment. Saves order to DB and deducts stock.
 */
function SuccessPage({ cart, clearCart }) {
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("fsu_user"));
    if (cart.length > 0 && user) {
      // 1. Tell backend to reduce stock for purchased items
      axios.post(`${API_BASE}/products/deduct-stock`, { cartItems: cart });
      // 2. Save order details to Supabase for the user's history
      const total = cart.reduce((sum, item) => sum + item.price, 0);
      supabase.from('orders').insert([{ user_id: user.id, total_amount: total, items: cart }]).then(() => clearCart());
    }
  }, []);

  return (
    <div style={{ ...styles.container, textAlign: 'center' }}>
      <h1 style={{ color: 'green' }}>Success! 🎉</h1>
      <Link to="/">Back to Shop</Link>
    </div>
  );
}

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const user = JSON.parse(localStorage.getItem("fsu_user"));

  useEffect(() => {
    // Pull the logged-in user's orders from Supabase
    if (user) supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(res => setOrders(res.data || []));
  }, []);

  if (!user) return <div style={styles.container}>Log in to see orders.</div>;

  return (
    <div style={styles.container}>
      <h2>Your Order History</h2>
      {orders.map(order => (
        <div key={order.id} style={{ ...styles.card, marginBottom: '20px' }}>
          <p><strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
          <p><strong>Total:</strong> ${order.total_amount.toFixed(2)}</p>
          <p><strong>Items:</strong> {order.items.map(i => i.name).join(', ')}</p>
        </div>
      ))}
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState('');
  const handleLogin = () => {
    if (!email.includes('@')) return alert("Enter valid email");
    // Mock login: generates a fake user ID and saves to localstorage
    localStorage.setItem("fsu_user", JSON.stringify({ id: Math.floor(Math.random() * 1000000), email }));
    window.location.href = "/";
  };
  return (
    <div style={{ ...styles.container, textAlign: 'center' }}>
      <input style={styles.input} type="email" placeholder="FSU Email" value={email} onChange={e => setEmail(e.target.value)} />
      <button onClick={handleLogin} style={{ ...styles.button, backgroundColor: COLORS.primary, color: 'white' }}>Enter Shop</button>
    </div>
  );
}

function About() { return <div style={styles.container}><h1>About FSU Bobcat Shop</h1><p>Student gear by students.</p></div>; }
function Privacy() { return <div style={styles.container}><h1>Privacy Policy</h1><p>Secure payments via Stripe.</p></div>; }

export default App;