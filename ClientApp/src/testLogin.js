import api from './api';

export const testLogin = async () => {
    try {
        console.log('Testing login...');
        const response = await api.post('/auth/login', {
            username: 'admin',
            password: 'password123'
        });
        console.log('Login successful!', response.data);
        return response.data;
    } catch (error) {
        console.error('Login failed:', error.response?.data || error.message);
        throw error;
    }
};