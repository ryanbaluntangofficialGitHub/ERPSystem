import React, { useState } from 'react';
import api from '../api';

export default function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showCredentials, setShowCredentials] = useState(false);

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
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-md mx-auto relative animate-fade-in-up">
            {/* Hamburger Menu Button */}
            {process.env.NODE_ENV === 'development' && (
                <button
                    onClick={() => setShowCredentials(!showCredentials)}
                    className="absolute top-4 right-4 z-10 p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-lg"
                    title="Show test credentials"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            )}

            {/* Credentials Sidebar */}
            {process.env.NODE_ENV === 'development' && showCredentials && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-40"
                        onClick={() => setShowCredentials(false)}
                    />
                    {/* Sidebar */}
                    <div className="fixed top-0 right-0 h-full w-80 bg-gray-800 text-white shadow-xl z-50 transform transition-transform duration-300">
                        <div className="p-6">
                            {/* Close button */}
                            <button
                                onClick={() => setShowCredentials(false)}
                                className="absolute top-4 right-4 p-2 rounded hover:bg-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Content */}
                            <div className="mt-8">
                                <p className="text-lg font-semibold mb-4 flex items-center">
                                    <span className="text-xl mr-2">🔐</span>
                                    Development Test Accounts
                                </p>
                                <div className="space-y-3 font-mono text-sm">
                                    <div className="p-3 bg-gray-700 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center">
                                                <span className="mr-2">👑</span>
                                                admin
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setUsername('admin');
                                                    setPassword('Admin@123!');
                                                    setShowCredentials(false);
                                                }}
                                                className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded transition-colors"
                                            >
                                                Use
                                            </button>
                                        </div>
                                        <div className="text-gray-300 mt-1">Admin@123!</div>
                                    </div>
                                    <div className="p-3 bg-gray-700 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center">
                                                <span className="mr-2">💰</span>
                                                sales_user
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setUsername('sales_user');
                                                    setPassword('Sales@123!');
                                                    setShowCredentials(false);
                                                }}
                                                className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded transition-colors"
                                            >
                                                Use
                                            </button>
                                        </div>
                                        <div className="text-gray-300 mt-1">Sales@123!</div>
                                    </div>
                                    <div className="p-3 bg-gray-700 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center">
                                                <span className="mr-2">🛒</span>
                                                purchase_user
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setUsername('purchase_user');
                                                    setPassword('Purchase@123!');
                                                    setShowCredentials(false);
                                                }}
                                                className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded transition-colors"
                                            >
                                                Use
                                            </button>
                                        </div>
                                        <div className="text-gray-300 mt-1">Purchase@123!</div>
                                    </div>
                                    <div className="p-3 bg-gray-700 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center">
                                                <span className="mr-2">👥</span>
                                                hr_user
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setUsername('hr_user');
                                                    setPassword('HR@123!');
                                                    setShowCredentials(false);
                                                }}
                                                className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded transition-colors"
                                            >
                                                Use
                                            </button>
                                        </div>
                                        <div className="text-gray-300 mt-1">HR@123!</div>
                                    </div>
                                    <div className="p-3 bg-gray-700 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center">
                                                <span className="mr-2">📈</span>
                                                accounting_user
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setUsername('accounting_user');
                                                    setPassword('Accounting@123!');
                                                    setShowCredentials(false);
                                                }}
                                                className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded transition-colors"
                                            >
                                                Use
                                            </button>
                                        </div>
                                        <div className="text-gray-300 mt-1">Accounting@123!</div>
                                    </div>
                                    <div className="p-3 bg-gray-700 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center">
                                                <span className="mr-2">🏭</span>
                                                production_user
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setUsername('production_user');
                                                    setPassword('Production@123!');
                                                    setShowCredentials(false);
                                                }}
                                                className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded transition-colors"
                                            >
                                                Use
                                            </button>
                                        </div>
                                        <div className="text-gray-300 mt-1">Production@123!</div>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-4">
                                    ⚠️ These accounts are for development only. Change all passwords in production!
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <div className="bg-white p-6 sm:p-8 md:p-10 rounded-xl shadow-2xl animate-slide-up w-full max-w-md sm:max-w-lg md:max-w-xl">
                <div className="text-center mb-6 sm:mb-8 md:mb-10 animate-fade-in">
                    <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4 animate-bounce-in">🏢</div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 animate-slide-down">ERP System</h2>
                    <p className="text-sm sm:text-base text-gray-600 mt-2 animate-fade-in-delay">Sign in to your account</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                        <div className="flex items-center">
                            <span className="text-xl mr-2">⚠️</span>
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-6 animate-fade-in-delay">
                    <div className="animate-slide-up" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-400 focus:scale-105 transform"
                            placeholder="Enter your username"
                            required
                            disabled={loading}
                            autoComplete="username"
                            autoFocus
                        />
                    </div>

                    <div className="animate-slide-up" style={{ animationDelay: '0.7s', animationFillMode: 'both' }}>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-400 focus:scale-105 transform pr-10 sm:pr-12"
                                placeholder="Enter your password"
                                required
                                disabled={loading}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-all duration-200 hover:scale-110"
                                tabIndex={-1}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <div className="animate-slide-up" style={{ animationDelay: '0.8s', animationFillMode: 'both' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 sm:py-3 px-4 text-sm sm:text-base rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
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
                                <span className="flex items-center justify-center">
                                    <span className="mr-2">🚀</span>
                                    Sign In
                                </span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
            </div>
        </div>
    );
}
