import React, { useState } from 'react';
import api from '../api';

export default function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    const submit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const res = await api.post('/auth/login', { username, password });
            const token = res.data.token;
            if (!token) throw new Error('No token returned from API');

            // Call parent to update App state
            onLogin(token);
        } catch (err) {
            console.error(err);
            setError('Login failed. Check credentials.');
        }
    };

    return (
        <div className="max-w-md w-full mx-auto bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Sign in</h2>
            {error && <div className="mb-4 text-red-600">{error}</div>}
            <form onSubmit={submit}>
                <div className="mb-3">
                    <label className="block mb-1">Username</label>
                    <input
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full border p-2 rounded"
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="block mb-1">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full border p-2 rounded"
                        required
                    />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
                    Sign in
                </button>
            </form>
        </div>
    );
}
