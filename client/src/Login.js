import React, { useState } from 'react';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/login', { email, password });
      
      // THE BETTER WAY: Storing the token automatically!
      localStorage.setItem('token', res.data.token);
      
      alert('Logged in! The token is saved in your browser.');
    } catch (err) {
      alert('Login failed: ' + err.response.data.error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Store Manager Login</h2>
      <form onSubmit={handleLogin}>
        <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;