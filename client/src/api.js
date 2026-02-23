import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

// THE BETTER WAY: This "interceptor" grabs the token from storage 
// and sticks it in the header automatically for every single call.
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;