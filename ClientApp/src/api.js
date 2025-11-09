import axios from 'axios';

const api = axios.create({
    baseURL: 'https://localhost:7273/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Request interceptor - add token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('erp_token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Request to:', config.url, 'with token');
        } else {
            console.warn('No token found for request to:', config.url);
        }

        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        console.log('Response from:', response.config.url, 'Status:', response.status);
        return response;
    },
    (error) => {
        console.error('Response error from:', error.config?.url, {
            status: error.response?.status,
            data: error.response?.data
        });

        // Redirect to login on 401
        if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
            console.log('401 Unauthorized - redirecting to login');
            localStorage.removeItem('erp_token');
            setTimeout(() => {
                window.location.href = '/login';
            }, 100);
        }

        return Promise.reject(error);
    }
);

export default api;