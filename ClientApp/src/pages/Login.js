import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const submit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            console.log('Submitting login:', { username, password });
            const res = await api.post('/auth/login', { username, password });
            console.log('Response:', res.data);

            const token = res.data.token;
            if (!token) throw new Error('No token returned from API');

            // ✅ Save token
            localStorage.setItem('erp_token', token);
            if (onLogin) onLogin(token);

            // ✅ Decode JWT (get role)
            const payload = JSON.parse(atob(token.split('.')[1]));
            const role =
                payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
                'User';

            console.log('Logged in role:', role);

            // ✅ Redirect based on role
            switch (role) {
                case 'Admin':
                    navigate('/'); // Admin dashboard
                    break;
                case 'Sales':
                    navigate('/sales');
                    break;
                case 'Purchase':
                    navigate('/purchases');
                    break;
                case 'HR':
                    navigate('/hr');
                    break;
                case 'Accounting':
                    navigate('/accounting');
                    break;
                case 'Production':
                    navigate('/production');
                    break;
                default:
                    navigate('/'); // fallback
                    break;
            }
        } catch (err) {
            console.error(err);
            setError('Login failed. Check credentials or backend connection.');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20 bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Sign in</h2>
            {error && <div className="mb-4 text-red-600">{error}</div>}
            <form onSubmit={submit}>
                <div className="mb-3">
                    <label className="block mb-1">Username</label>
                    <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full border p-2 rounded"
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="block mb-1">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border p-2 rounded"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                >
                    Sign in
                </button>
            </form>
        </div>
    );
}
