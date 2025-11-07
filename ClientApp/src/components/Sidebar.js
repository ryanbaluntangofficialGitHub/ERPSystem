import React from 'react';
import { NavLink } from 'react-router-dom';

// Links can be dynamic based on user role if needed
const links = [
    { to: '/', label: 'Dashboard' },
    { to: '/sales', label: 'Sales' },
    { to: '/purchases', label: 'Purchasing' },
    { to: '/hr', label: 'HR' },
    { to: '/accounting', label: 'Accounting' },
    { to: '/production', label: 'Production' },
];

export default function Sidebar({ onLogout }) {
    return (
        <aside className="w-64 bg-white border-r min-h-screen">
            <div className="p-4 border-b">
                <h1 className="text-xl font-bold">ERP System</h1>
            </div>
            <nav className="p-4">
                <ul>
                    {links.map((link) => (
                        <li key={link.to} className="mb-2">
                            <NavLink
                                to={link.to}
                                className={({ isActive }) =>
                                    `block p-2 rounded ${isActive ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`
                                }
                            >
                                {link.label}
                            </NavLink>
                        </li>
                    ))}
                    <li className="mt-4">
                        <button
                            onClick={onLogout} // Use logout handler passed from App.js
                            className="w-full text-left p-2 rounded text-red-600 hover:bg-gray-100"
                        >
                            Logout
                        </button>
                    </li>
                </ul>
            </nav>
        </aside>
    );
}
