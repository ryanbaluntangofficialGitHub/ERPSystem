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

function RequireAuth({ children, allowedRoles }) {
    const token = localStorage.getItem('erp_token');

    if (!token) return <Navigate to="/login" />;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/" />;
    } catch {
        return <Navigate to="/login" />;
    }

    return children;
}

function App() {
    const [token, setToken] = useState(localStorage.getItem('erp_token'));
    const [role, setRole] = useState(null);
    const navigate = useNavigate();

    // Called after login
    const handleLogin = (jwt) => {
        localStorage.setItem('erp_token', jwt);
        setToken(jwt);

        // Decode role from token
        const payload = JSON.parse(atob(jwt.split('.')[1]));
        const userRole = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        setRole(userRole);

        // Redirect based on role
        switch (userRole) {
            case 'Admin': navigate('/'); break;
            case 'Sales': navigate('/sales'); break;
            case 'Purchase': navigate('/purchases'); break;
            case 'HR': navigate('/hr'); break;
            case 'Accounting': navigate('/accounting'); break;
            case 'Production': navigate('/production'); break;
            default: navigate('/'); break;
        }
    };

    // Called on logout
    const handleLogout = () => {
        localStorage.removeItem('erp_token');
        setToken(null);
        setRole(null);
        navigate('/login');
    };

    useEffect(() => {
        if (token && !role) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setRole(payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']);
        }
    }, [token, role]);

    // Show only login page when not logged in
    if (!token) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-100">
                <Routes>
                    <Route path="/login" element={<Login onLogin={handleLogin} />} />
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </div>
        );
    }

    // Logged-in layout
    return (
        <div className="min-h-screen flex">
            <Sidebar onLogout={handleLogout} />
            <main className="flex-1 p-6">
                <Routes>
                    <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
                    <Route path="/sales" element={<RequireAuth allowedRoles={['Sales']}><Sales /></RequireAuth>} />
                    <Route path="/purchases" element={<RequireAuth allowedRoles={['Purchase']}><Purchases /></RequireAuth>} />
                    <Route path="/hr" element={<RequireAuth allowedRoles={['HR']}><HR /></RequireAuth>} />
                    <Route path="/accounting" element={<RequireAuth allowedRoles={['Accounting']}><Accounting /></RequireAuth>} />
                    <Route path="/production" element={<RequireAuth allowedRoles={['Production']}><Production /></RequireAuth>} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;
