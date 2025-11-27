import React, { useState } from 'react';
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
        to: '/purchase-requests',
        label: 'Purchase Requests',
        icon: '📝',
        roles: ['Admin', 'Purchase']
    },
    {
        to: '/purchase-orders',
        label: 'Purchase Orders',
        icon: '📦',
        roles: ['Admin', 'Purchase']
    },
    {
        to: '/goods-receipts',
        label: 'Goods Receipts',
        icon: '📥',
        roles: ['Admin', 'Purchase']
    },
    {
        to: '/suppliers',
        label: 'Suppliers',
        icon: '🏷️',
        roles: ['Admin', 'Purchase']
    },
    {
        to: '/hr',
        label: 'Human Resources',
        icon: '👥',
        roles: ['Admin', 'HR']
    },
    {
        to: '/departments',
        label: 'Departments',
        icon: '🏢',
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
    {
        to: '/products',
        label: 'Products',
        icon: '🧩',
        roles: ['Admin', 'Production']
    },
    {
        to: '/warehouses',
        label: 'Warehouses',
        icon: '📦',
        roles: ['Admin']
    },
    {
        to: '/users',
        label: 'Users',
        icon: '👤',
        roles: ['Admin']
    },
    {
        to: '/canvassings',
        label: 'Canvassings',
        icon: '🔎',
        roles: ['Admin', 'Purchase']
    },
    {
        to: '/invoices',
        label: 'Invoices',
        icon: '🧾',
        roles: ['Admin', 'Accounting', 'Purchase']
    }
];

export default function Sidebar({ onLogout, userRole, isOpen, onToggle }) {
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
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={onToggle}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 sm:w-72 bg-white border-r min-h-screen shadow-lg
                transform transition-transform duration-300 ease-in-out
                flex flex-col
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold">ERP System</h1>
                            <p className="text-sm opacity-90 mt-1">
                                Role: {normalizedRole || 'Loading...'}
                            </p>
                        </div>
                        {/* Mobile close button */}
                        <button
                            onClick={onToggle}
                            className="lg:hidden p-1 rounded hover:bg-white hover:bg-opacity-20"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                <nav className="p-4 flex-1 overflow-y-auto">
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
                                        onClick={() => window.innerWidth < 1024 && onToggle()} // Close on mobile after navigation
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 p-3 rounded-lg transition-all duration-200 whitespace-nowrap overflow-hidden ${isActive
                                                ? 'bg-blue-500 text-white shadow-md transform scale-105'
                                                : 'text-gray-700 hover:bg-gray-100 hover:transform hover:scale-102'
                                            }`
                                        }
                                    >
                                        <span className="text-xl flex-shrink-0">{link.icon}</span>
                                        <span className="font-medium truncate">{link.label}</span>
                                    </NavLink>
                                </li>
                            ))
                        )}
                    </ul>
                    <div className="mt-6 pt-4 border-t">
                        <button
                            onClick={() => {
                                onLogout();
                                window.innerWidth < 1024 && onToggle(); // Close on mobile after logout
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200 font-medium whitespace-nowrap overflow-hidden"
                        >
                            <span className="text-xl flex-shrink-0">🚪</span>
                            <span className="truncate">Logout</span>
                        </button>
                    </div>
                </nav>
            </aside>
        </>
    );
}
