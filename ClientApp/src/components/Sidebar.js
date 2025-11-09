import React from 'react';
import { NavLink } from 'react-router-dom';

const ALL_LINKS = [
    {
        to: '/',
        label: 'Dashboard',
        icon: '📊',
        roles: ['Admin', 'Sales', 'Purchase', 'HR', 'Accounting', 'Production']
    },
    {
        to: '/sales',
        label: 'Sales',
        icon: '💰',
        roles: ['Admin', 'Sales']
    },
    {
        to: '/purchases',
        label: 'Purchasing',
        icon: '🛒',
        roles: ['Admin', 'Purchase']
    },
    {
        to: '/hr',
        label: 'Human Resources',
        icon: '👥',
        roles: ['Admin', 'HR']
    },
    {
        to: '/accounting',
        label: 'Accounting',
        icon: '📈',
        roles: ['Admin', 'Accounting']
    },
    {
        to: '/production',
        label: 'Production',
        icon: '🏭',
        roles: ['Admin', 'Production']
    },
];

export default function Sidebar({ onLogout, userRole }) {
    console.log('Sidebar render - userRole:', userRole);

    // Normalize userRole to string if it's an array
    let normalizedRole = userRole;
    if (Array.isArray(userRole)) {
        normalizedRole = userRole[0];
        console.log('Role was array, using first element:', normalizedRole);
    }

    // Admin sees everything, others see only their modules
    const visibleLinks = normalizedRole === 'Admin'
        ? ALL_LINKS
        : ALL_LINKS.filter(link => link.roles.includes(normalizedRole));

    console.log('Normalized role:', normalizedRole);
    console.log('Visible links count:', visibleLinks.length);

    return (
        <aside className="w-64 bg-white border-r min-h-screen shadow-lg">
            <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <h1 className="text-xl font-bold">ERP System</h1>
                <p className="text-sm opacity-90 mt-1">
                    Role: {normalizedRole || 'Loading...'}
                </p>
            </div>
            <nav className="p-4">
                <ul className="space-y-1">
                    {visibleLinks.length === 0 ? (
                        <li className="text-gray-500 text-sm p-3">
                            Loading menu...
                        </li>
                    ) : (
                        visibleLinks.map((link) => (
                            <li key={link.to}>
                                <NavLink
                                    to={link.to}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${isActive
                                            ? 'bg-blue-500 text-white shadow-md transform scale-105'
                                            : 'text-gray-700 hover:bg-gray-100 hover:transform hover:scale-102'
                                        }`
                                    }
                                >
                                    <span className="text-xl">{link.icon}</span>
                                    <span className="font-medium">{link.label}</span>
                                </NavLink>
                            </li>
                        ))
                    )}
                </ul>
                <div className="mt-6 pt-4 border-t">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 p-3 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200 font-medium"
                    >
                        <span className="text-xl">🚪</span>
                        <span>Logout</span>
                    </button>
                </div>
            </nav>
        </aside>
    );
}