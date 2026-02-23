const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();

// Initialize the base Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.use(cors({
  origin: "http://localhost:3000", // Allow your React app
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"] // Essential for tokens!
}));
app.use(express.json());


// --- PUBLIC ROUTES ---
app.get("/", (req, res) => res.json({ message: "API is running" }));

app.get("/api/products", async (req, res) => {
  const { data, error } = await supabase.from("products").select("*");
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
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
app.post("/api/products", async (req, res) => {
  const { name, description, price, stock, image_url } = req.body;
  
  // 1. Get the token from the header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Missing token" });

  // 2. Create a one-time client that uses the USER'S token
  const supabaseAuth = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  // 3. This insert now respects your RLS "Authenticated" policy
  const { data, error } = await supabaseAuth
    .from("products")
    .insert([{ name, description, price, stock, image_url }])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));