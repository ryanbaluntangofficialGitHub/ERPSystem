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

    if (!token) return <Navigate to='/login' />;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to='/' />;
    } catch {
        return <Navigate to='/login' />;
    }

    return children;
}

function App() {
    const [token, setToken] = useState(localStorage.getItem('erp_token'));
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('erp_token');
        setToken(null);
        navigate('/login');
    };

    useEffect(() => {
        if (!token) navigate('/login');
    }, [token, navigate]);

    return (
        <div className="min-h-screen flex">
            {token && <Sidebar onLogout={handleLogout} />}
            <main className="flex-1 p-6">
                <Routes>
                    <Route path="/login" element={<Login onLogin={setToken} />} />
                    <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
                    <Route path="/sales" element={<RequireAuth allowedRoles={['Sales']}><Sales /></RequireAuth>} />
                    <Route path="/purchases" element={<RequireAuth allowedRoles={['Purchase']}><Purchases /></RequireAuth>} />
                    <Route path="/hr" element={<RequireAuth allowedRoles={['HR']}><HR /></RequireAuth>} />
                    <Route path="/accounting" element={<RequireAuth allowedRoles={['Accounting']}><Accounting /></RequireAuth>} />
                    <Route path="/production" element={<RequireAuth allowedRoles={['Production']}><Production /></RequireAuth>} />
                </Routes>
            </main>
        </div>
    );
}

export default App;
