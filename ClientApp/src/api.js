import axios from 'axios';
import { API_CONFIG, AUTH_CONFIG } from './config/constants';

const api = axios.create({
    baseURL: process.env.NODE_ENV !== 'production' ? (process.env.REACT_APP_API_URL || 'http://localhost:5026/api') : (process.env.REACT_APP_API_URL || API_CONFIG.BASE_URL),
    timeout: API_CONFIG.TIMEOUT,
    headers: { 'Content-Type': 'application/json' }
});

// Request interceptor
api.interceptors.request.use(config => {
    try {
        const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
        if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (e) {
        // ignore
    }
    return config;
});

// Response interceptor to normalize errors
api.interceptors.response.use(
    res => res,
    err => {
        if (err.response) {
            // server responded with a status
            const e = new Error('Request failed');
            e.response = err.response;
            return Promise.reject(e);
        }
        return Promise.reject(err);
    }
);

export default api;