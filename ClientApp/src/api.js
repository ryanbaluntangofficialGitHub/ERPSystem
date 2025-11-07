// src/api.js
import axios from 'axios';

const api = axios.create({
    baseURL: 'https://localhost:7273/api', // Backend URL
    withCredentials: true,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('erp_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
