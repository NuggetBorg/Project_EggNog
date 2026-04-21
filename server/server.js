const express = require("express");
const cors = require("cors");

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();
const stripe = require('stripe')(process.env.STRIPEKEY);
const app = express();



// Initialize the base Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.use(cors());
app.use(express.json());


// --- PUBLIC ROUTES ---
app.get("/", (req, res) => res.json({ message: "API is running" }));

app.get("/api/products", async (req, res) => {
  const { data, error } = await supabase.from("products").select("*");
  if (error) return res.status(400).json({ error: error.message });
  res.json(data); // Returns the full array []
});

// 2. GET SINGLE PRODUCT BY ID (For the Detail Page)
app.get("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single(); // Returns one object {}
    
  if (error) return res.status(404).json({ error: "Product not found" });
  res.json(data);
});

//Checkout process
app.post('/api/create-checkout-session', async (req, res) => {
  const { cartItems } = req.body;
  // turn cart intems into stripe format
  const line_items = cartItems.map(item => ({
    price_data: {
    currency: 'usd',
    product_data: { name: item.name },
    unit_amount: item.price * 100, // Stripe uses cents so 1.00 usd = 100
    },
    quantity: 1,
  }))

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items,
    mode: 'payment',
    success_url: `${req.headers.origin}/success`, 
    cancel_url: `${req.headers.origin}/cart`,
});
  res.json({ id: session.id });
});

// --- AUTHENTICATION ROUTES ---
app.post("/api/signup", async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.status(200).json({ token: data.session.access_token, user: data.user });
});

// --- PROTECTED ROUTE (Now with RLS Support) ---
// 1. CREATE A PRODUCT
app.post("/api/products", async (req, res) => {
  const { name, description, price, stock, image_url, category } = req.body;
  
  // We use the base 'supabase' client here to bypass token checks for now
  const { data, error } = await supabase
    .from("products")
    .insert([{ name, description, price, stock, image_url, category }])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// 2. DELETE A PRODUCT
app.delete("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "Product deleted successfully" });
});

//const PORT = process.env.PORT || 5000;
module.exports = app; // Add this instead
app.post("/api/products/deduct-stock", async (req, res) => {
  const { cartItems } = req.body;

  try {
    for (const item of cartItems) {
      // Fetch current stock first
      const { data: p } = await supabase
        .from("products")
        .select("stock")
        .eq("id", item.id)
        .single();

      if (p) {
        // Subtract 1 and update
        const newStock = Math.max(0, p.stock - 1);
        await supabase
          .from("products")
          .update({ stock: newStock })
          .eq("id", item.id);
      }
    }
    res.json({ message: "Stock updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;

  const { data, error } = await supabase
    .from("products")
    .update({ stock: stock })
    .eq("id", id)
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
// --- ADMIN ORDER MANAGEMENT ---

// 1. Get ALL orders from EVERYONE (Admin only logic)
app.get("/api/admin/orders", async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// 2. Update the status of an order (e.g., Pending -> Shipped)
app.put("/api/admin/orders/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const { data, error } = await supabase
    .from("orders")
    .update({ status: status })
    .eq("id", id)
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});