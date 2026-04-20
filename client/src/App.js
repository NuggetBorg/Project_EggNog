import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jvqachvrbkvrsrseyyoh.supabase.co', 
  'sb_publishable_rjBRgV9S-9jP0_07XI1xYg_s0FCJSPs'
);

// --- COMPONENT 1: PRODUCT DETAIL PAGE ---
function ProductDetail({ addToCart }) {
  const { id } = useParams(); // Gets the ID from the URL
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const fetchSingleProduct = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/products/${id}`);
        setProduct(res.data);
      } catch (err) {
        console.error("Error fetching single product:", err);
      }
    };
    fetchSingleProduct();
  }, [id]);

  if (!product) return <div style={{ padding: '40px' }}>Loading FSU Gear...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <Link to="/" style={{ color: '#BE1E2D', fontWeight: 'bold' }}>← Back to All Merch</Link>
      <div style={{ display: 'flex', gap: '40px', marginTop: '20px' }}>
        <img src={product.image_url} alt={product.name} style={{ width: '300px', borderRadius: '15px' }} />
        <div>
          <h1>{product.name}</h1>
          <p style={{ textTransform: 'uppercase', color: '#666' }}>{product.category}</p>
          <p style={{ fontSize: '18px', lineHeight: '1.6' }}>{product.description}</p>
          <h2 style={{ color: '#BE1E2D' }}>${product.price}</h2>
          <p><strong>Availability:</strong> {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}</p>
            <button 
            onClick={() => addToCart(product)} 
            style={{ padding: '15px 30px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
           Add to Cart
           </button>
        </div>
      </div>
    </div>
  );
  
}


function Cart({ cart, clearCart }) {
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = async () => {
    try {

      const res = await axios.post('http://localhost:5000/api/create-checkout-session', {
        cartItems: cart
      });

      const { id } = res.data;

      const stripe = window.Stripe('pk_test_51THmjhP4YAzW1hPFvkdQnhSUh7V0lG2smAfG9bTK7VYD0DFXBxSMcxB83hJ6UREUDZgSrhDd4pDvQlV6E2k0tZDT00aOGmNB6v');
      await stripe.redirectToCheckout({ sessionId: id });

    } catch (err) {
      console.error("Checkout Error: ", err);
      alert("Checkout failed");
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Your Shopping Cart</h1>
      {cart.length === 0 ? (
        <p>Your cart is empty dumbahh. <Link to="/">Go get yourself some drip bud!</Link></p>
      ) : (
        <>
          <div style={{ borderTop: '1px solid #ddd' }}>
            {cart.map((item, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #eee' }}>
                <span>{item.name}</span>
                <strong>${item.price.toFixed(2)}</strong>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'right', marginTop: '20px' }}>
            <h3>Total: ${total.toFixed(2)}</h3>
            <button onClick={clearCart} style={{ backgroundColor: '#ccc', padding: '10px', marginRight: '10px', border: 'none', cursor: 'pointer' }}>
              Clear Cart
            </button>
            <button 
              onClick={handleCheckout}
              style={{ backgroundColor: '#BE1E2D', color: 'white', padding: '10px 20px', border: 'none', cursor: 'pointer' }}>
              Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function AdminPanel() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: '', image_url: '', description: '', stock: 0 });

  // 1. Fetch products so we can delete them
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await axios.get('http://localhost:5000/api/products');
    setProducts(res.data);
  };

  // 2. Handle adding a new product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/products', newProduct);
      alert("Product Added!");
      fetchProducts(); // Refresh list
      setNewProduct({ name: '', price: '', category: '', image_url: '', description: '', stock: 0 });
    } catch (err) { console.error(err); }
  };

  // 3. Handle deleting a product
  const handleDelete = async (id) => {
    if (window.confirm("Delete this item?")) {
      await axios.delete(`http://localhost:5000/api/products/${id}`);
      fetchProducts();
    }
  };

  return (
    <div style={{ padding: '40px' }}>
      <h2>Admin: Manage Inventory</h2>
      
      {/* ADD PRODUCT FORM */}
      <form onSubmit={handleAddProduct} style={{ marginBottom: '40px', border: '1px solid #ddd', padding: '20px' }}>
        <h3>Add New Gear</h3>
        <input placeholder="Name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required /><br/>
        <input placeholder="Price" type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} required /><br/>
        <input 
          placeholder="Stock" 
          type="number" 
        value={newProduct.stock} 
        onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value) || 0})} 
        required 
      /><br/>
        <input placeholder="Category" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} /><br/>
        <input placeholder="Image URL" value={newProduct.image_url} onChange={e => setNewProduct({...newProduct, image_url: e.target.value})} /><br/>
        <textarea placeholder="Description" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} /><br/>
        <button type="submit">Upload Product</button>
      </form>

      {/* PRODUCT LIST FOR DELETION */}
      <h3>Current Inventory</h3>
      {products.map(p => (
        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' }}>
          <span>{p.name} - ${p.price}</span>
          <button onClick={() => handleDelete(p.id)} style={{ color: 'red' }}>Delete</button>
        </div>
      ))}
    </div>
  );
}

// --- COMPONENT 2: HOME PAGE (The Grid) ---
function Home({ addToCart}) {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
      const res = await axios.get('http://localhost:5000/api/products');
      console.log("Full API Response:", res); // Check the structure
      
      // If res.data is an array, set it. Otherwise, set an empty array.
      setProducts(Array.isArray(res.data) ? res.data : []); 
    } catch (err) {
      console.error("Error fetching products:", err);
      setProducts([]); // Fallback so the app doesn't break
    }
    };
    fetchProducts();
    
  }, []);

  const filteredProducts = products.filter(p => {
  const name = p.name?.toLowerCase() || "";
  const category = p.category?.toLowerCase() || "";
  const search = searchTerm.toLowerCase();

  return name.includes(search) || category.includes(search);
  });

  return (
    
    <div style={{ padding: '40px' }}>
      <h1 style={{ textAlign: 'center', color: '#BE1E2D' }}>FSU Bobcat Shop</h1>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <input 
          type="text" 
          placeholder="Search FSU gear..." 
          style={{ width: '50%', padding: '12px', borderRadius: '25px' }}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {filteredProducts.map(product => (
          <div key={product.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '10px' }}>
            <img src={product.image_url} alt={product.name} style={{ width: '100%' }} />
            <h3>{product.name}</h3>
            <p>${product.price}</p>
            {/* THIS LINK CONNECTS THE PAGES */}
            <button 
              onClick={() => addToCart(product)} 
              style={{ width: '100%', marginBottom: '10px', cursor: 'pointer' }}>
                Add To Cart
              </button>
            <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', color: '#BE1E2D', fontWeight: 'bold' }}>
              View Details →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- COMPONENT 3: MAIN APP (The Switchboard) ---
function App() {
  const handleSignOut = () => {
  // 1. Remove the user from localStorage
  localStorage.removeItem("fsu_user");
  
  // 2. Optional: Remove the cart if you want a fresh start on signout
  // localStorage.removeItem("fsu_cart");

  // 3. Redirect to the home or login page to refresh the state
  window.location.href = "/login";
};
  // Initialize cart fromm LocalStorage so it persists on refresh
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("fsu_cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const userData = localStorage.getItem("fsu_user");
  const user = userData ? JSON.parse(userData) : null;

  // Save to localStorage everytime the cart changed
  useEffect(() => {
    localStorage.setItem("fsu_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart((prevCart) => [...prevCart, product]);
    alert(`${product.name} added to cart!`);
  }
  const clearCart = () => {
  if (window.confirm("Are you sure you want to clear your cart?")) {
    setCart([]); // Sets the list back to empty
  }
};
  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
  return (
    <Router>
      <nav style={{ 
        padding: '20px', 
        backgroundColor: '#333', 
        color: 'white', 
        display: 'flex', 
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 1000 
      }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>
          FSU BOBCAT SHOP
        </Link>
        <Link to="/orders">My Orders</Link>
        {user?.email === 'jack.maust2005@gmail.com' && (
  <Link to="/admin" style={{ color: 'red', fontWeight: 'bold' }}>Admin Panel</Link>
)}
        <div>
         <Link to="/cart" style={{ color: '#FFD700', textDecoration: 'none', fontWeight: 'bold' }}>
          🛒 Cart ({cart.length}) - ${cartTotal.toFixed(2)}
        </Link>
        </div>
        {user ? (
  <span style={{ marginRight: '15px' }}>{user ? (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '15px' }}>
    <span style={{ color: 'white' }}>Hi, {user.email}</span>
    <button 
      onClick={handleSignOut} 
      style={{ 
        padding: '5px 10px', 
        backgroundColor: '#BE1E2D', 
        color: 'white', 
        border: '1px solid white', 
        borderRadius: '4px', 
        cursor: 'pointer' 
      }}
    >
      Sign Out
    </button>
  </div>
) : (
  <Link to="/login" style={{ color: 'white', marginLeft: '15px' }}>Login</Link>
)}</span>
) : (
  <Link to="/login" style={{ color: 'white', marginRight: '15px' }}>Login</Link>
)}
      </nav>
      <Routes>
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/login" element={<Login />} />
        <Route path="/orders" element={<OrderHistory />} />
        <Route path="/" element={<Home addToCart={addToCart} />} />
        <Route path="/product/:id" element={<ProductDetail addToCart={addToCart}/>} />
        <Route path="/cart" element={<Cart cart={cart} clearCart={clearCart} />} />
        <Route path="/success" element={<SuccessPage cart={cart} clearCart={clearCart} />} />
      </Routes>
      {/* Add this inside <Router> after <Routes> */}
    <footer style={{ padding: '20px', backgroundColor: '#333', color: 'white', textAlign: 'center', marginTop: '40px' }}>
       <Link to="/about" style={{ color: 'white', margin: '0 10px' }}>About Us</Link>
        <Link to="/privacy" style={{ color: 'white', margin: '0 10px' }}>Privacy Policy</Link>
        <p>© 2026 FSU Bobcat Shop</p>
      </footer>
    </Router>
  );
}

function SuccessPage({ cart, clearCart }) {
  useEffect(() => {
    const saveOrder = async () => {
      // 1. Get the logged-in user's ID
      const savedUser = JSON.parse(localStorage.getItem("fsu_user")); 
      
      if (cart.length > 0 && savedUser) {
        try {
          const total = cart.reduce((sum, item) => sum + item.price, 0);

          // 2. Send the data to your 'orders' table
          const { error } = await supabase
            .from('orders')
            .insert([{ 
              user_id: savedUser.id, 
              total_amount: total, 
              items: cart 
            }]);

          if (error) {
  console.error("SUPABASE ERROR:", error.message);
  alert("Database Error: " + error.message); // This will tell you if types are wrong!
} else {
  console.log("Order saved!");
  clearCart();
}
        } catch (err) {
          console.error("Error saving order:", err);
        }
      }
    };

    saveOrder();
  }, [cart, clearCart]);

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1 style={{ color: 'green' }}>Order Confirmed! 🎉</h1>
      <p>Check your Order History to see your new drip.</p>
      <Link to="/">Continue Shopping</Link>
    </div>
  );
}

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const userData = localStorage.getItem("fsu_user");
  const user = userData ? JSON.parse(userData) : null;

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) console.error("History Error:", error);
      setOrders(data || []);
    };
    fetchOrders();
  }, [user]);

  // FIX: If NO user, tell them to login. Otherwise, show the orders.
  if (!user) return <div style={{ padding: '40px' }}>Please log in to view your orders.</div>;

  return (
    <div style={{ padding: '40px' }}>
      <h2>Your Order History</h2>
      {orders.length === 0 ? <p>No orders yet. Go get some drip!</p> : (
        orders.map(order => (
          <div key={order.id} style={{ border: '1px solid #ddd', margin: '10px 0', padding: '15px' }}>
            <p><strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
            <p><strong>Total:</strong> ${order.total_amount.toFixed(2)}</p>
            <ul>
              {order.items.map((item, i) => <li key={i}>{item.name}</li>)}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState('');

  const handleLogin = () => {
  // 1. Basic validation to make sure they didn't leave it blank
  if (!email || !email.includes('@')) {
    alert("Please enter a valid FSU email address!");
    return;
  }

  // 2. Create the user object
  // NOTE: I'm using a numeric ID here just in case you haven't 
  // changed your Supabase 'user_id' column to 'text' yet.
  const newUser = { 
    id: Math.floor(Math.random() * 10000000), // Generates a random number
    email: email 
  };

  // 3. Save to localStorage so the rest of the app "sees" the user
  localStorage.setItem("fsu_user", JSON.stringify(newUser));

  // 4. Feedback for the user
  if (email === 'jack.maust2005@gmail.com') {
    alert("Admin Access Granted. Welcome back, Jack.");
  } else {
    alert(`Logged in as ${email}`);
  }

  // 5. Force a redirect to Home to refresh the Navbar and 'My Orders' state
  window.location.href = "/";
};

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>FSU Student Login</h1>
      <input 
        type="email" 
        placeholder="Enter your student email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ padding: '10px', width: '300px', borderRadius: '5px' }}
      />
      <br /><br />
      <button onClick={handleLogin} style={{ padding: '10px 20px', backgroundColor: '#BE1E2D', color: 'white', border: 'none', cursor: 'pointer' }}>
        Login
      </button>
    </div>
  );
}

export default App;