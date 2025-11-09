import React, { useState } from 'react';
import api from '../api';

export default function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        // Client-side validation
        if (!username.trim() || !password.trim()) {
            setError('Please enter both username and password');
            setLoading(false);
            return;
        }

        try {
            const res = await api.post('/auth/login', {
                username: username.trim(),
                password
            });

            const token = res.data.token;

            if (!token) {
                throw new Error('No token returned from server');
            }

            // Successfully logged in
            onLogin(token);
        } catch (err) {
            console.error('Login error:', err);

            let errorMessage = 'Login failed. Please try again.';

            if (err.response?.status === 401) {
                errorMessage = 'Invalid username or password';
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md w-full mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-xl">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-4">🏢</div>
                    <h2 className="text-3xl font-bold text-gray-800">ERP System</h2>
                    <p className="text-gray-600 mt-2">Sign in to your account</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                        <div className="flex items-center">
                            <span className="text-xl mr-2">⚠️</span>
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter your username"
                            required
                            disabled={loading}
                            autoComplete="username"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                                placeholder="Enter your password"
                                required
                                disabled={loading}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                tabIndex={-1}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Signing in...
                            </span>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>
            </div>

            {/* Development credentials info */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-6 p-4 bg-gray-800 text-white rounded-lg shadow-lg">
                    <p className="text-sm font-semibold mb-3 flex items-center">
                        <span className="text-xl mr-2">🔐</span>
                        Development Test Accounts:
                    </p>
                    <div className="text-xs space-y-2 font-mono">
                        <div className="flex justify-between items-center p-2 bg-gray-700 rounded">
                            <span>👑 admin</span>
                            <span className="text-gray-300">Admin@123!</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-700 rounded">
                            <span>💰 sales_user</span>
                            <span className="text-gray-300">Sales@123!</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-700 rounded">
                            <span>🛒 purchase_user</span>
                            <span className="text-gray-300">Purchase@123!</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-700 rounded">
                            <span>👥 hr_user</span>
                            <span className="text-gray-300">HR@123!</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-700 rounded">
                            <span>📈 accounting_user</span>
                            <span className="text-gray-300">Accounting@123!</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-700 rounded">
                            <span>🏭 production_user</span>
                            <span className="text-gray-300">Production@123!</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">
                        ⚠️ These accounts are for development only. Change all passwords in production!
                    </p>
                </div>
            )}
        </div>
    );
}