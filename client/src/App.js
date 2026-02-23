import React, { useState } from 'react';
import API from './api';

function App() {
  const [email, setEmail] = useState('jack.maust2005@gmail.com');
  const [password, setPassword] = useState('');

  const login = async () => {
    try {
      const res = await API.post('/login', { email, password });
      localStorage.setItem('token', res.data.token); // Saved!
      alert("Logged in! Token is now handled automatically.");
    } catch (err) {
      alert("Login failed. Check terminal.");
    }
  };

  const addProduct = async () => {
    try {
      await API.post('/products', {
        name: "Better Way Nog",
        description: "No more long ahh tokens!",
        price: 10.99,
        stock: 100
      });
      alert("Product added successfully via RLS!");
    } catch (err) {
      console.log(err.response.data);
      alert("Still blocked by RLS. We'll fix the policy next.");
    }
  };

  return (
    <div style={{ padding: '50px' }}>
      <h1>EggNog Manager</h1>
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
      <button onClick={login}>1. Login (Auto-save Token)</button>
      <hr />
      <button onClick={addProduct}>2. Add Product (Uses Saved Token)</button>
    </div>
  );
}

export default App;