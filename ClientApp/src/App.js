import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import HR from './pages/HR';
import Accounting from './pages/Accounting';
import Production from './pages/Production';

// Helper function to get role from token
function getRoleFromToken(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Full token payload:', payload);

        // Try different claim names
        let role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
            || payload.role
            || payload.Role;

        // Handle if role is an array (sometimes JWT returns arrays)
        if (Array.isArray(role)) {
            role = role[0]; // Take the first role
        }

        console.log('Extracted role:', role);
        return role;
    } catch (error) {
        console.error('Error parsing token:', error);
        return null;
    }
}

function RequireAuth({ children, allowedRoles }) {
    const token = localStorage.getItem('erp_token');

    if (!token) {
        console.log('No token, redirecting to login');
        return <Navigate to="/login" />;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));

        // Check token expiration
        const exp = payload.exp;
        if (exp && Date.now() >= exp * 1000) {
            console.log('Token expired');
            localStorage.removeItem('erp_token');
            return <Navigate to="/login" />;
        }

        const role = getRoleFromToken(token);
        console.log('User role:', role, 'Allowed roles:', allowedRoles);

        // Admin has access to everything
        if (role === 'Admin') {
            console.log('Admin access granted');
            return children;
        }

        // Check if user's role is in allowedRoles
        if (allowedRoles && !allowedRoles.includes(role)) {
            console.log('Access denied, redirecting to dashboard');
            return <Navigate to="/" />;
        }
    } catch (error) {
        console.error('Token validation error:', error);
        localStorage.removeItem('erp_token');
        return <Navigate to="/login" />;
    }

    return children;
}

function App() {
    const [token, setToken] = useState(localStorage.getItem('erp_token'));
    const [role, setRole] = useState(null);
    const navigate = useNavigate();

    const handleLogin = (jwt) => {
        console.log('handleLogin called with token');
        localStorage.setItem('erp_token', jwt);
        setToken(jwt);

        const userRole = getRoleFromToken(jwt);
        console.log('User logged in with role:', userRole);
        setRole(userRole);

        // Navigate based on role
        if (userRole === 'Admin') {
            console.log('Navigating to dashboard');
            navigate('/');
        } else {
            const roleRoutes = {
                'Sales': '/sales',
                'Purchase': '/purchases',
                'HR': '/hr',
                'Accounting': '/accounting',
                'Production': '/production'
            };
            const route = roleRoutes[userRole] || '/';
            console.log('Navigating to:', route);
            navigate(route);
        }
    };

    const handleLogout = () => {
        console.log('Logging out');
        localStorage.removeItem('erp_token');
        setToken(null);
        setRole(null);
        navigate('/login');
    };

    useEffect(() => {
        if (token && !role) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));

                // Check expiration
                const exp = payload.exp;
                if (exp && Date.now() >= exp * 1000) {
                    console.log('Token expired on mount');
                    handleLogout();
                    return;
                }

                const userRole = getRoleFromToken(token);
                console.log('Setting role from token:', userRole);
                setRole(userRole);
            } catch (error) {
                console.error('Error reading token:', error);
                handleLogout();
            }
        }
    }, [token, role]);

    console.log('App render - token:', !!token, 'role:', role);

    if (!token) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <Routes>
                    <Route path="/login" element={<Login onLogin={handleLogin} />} />
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-gray-50">
            <Sidebar onLogout={handleLogout} userRole={role} />
            <main className="flex-1 p-6 overflow-auto">
                <Routes>
                    <Route
                        path="/"
                        element={
                            <RequireAuth>
                                <Dashboard />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/sales"
                        element={
                            <RequireAuth allowedRoles={['Sales']}>
                                <Sales />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/purchases"
                        element={
                            <RequireAuth allowedRoles={['Purchase']}>
                                <Purchases />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/hr"
                        element={
                            <RequireAuth allowedRoles={['HR']}>
                                <HR />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/accounting"
                        element={
                            <RequireAuth allowedRoles={['Accounting']}>
                                <Accounting />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/production"
                        element={
                            <RequireAuth allowedRoles={['Production']}>
                                <Production />
                            </RequireAuth>
                        }
                    />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;