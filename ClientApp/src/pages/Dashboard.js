import React, { useEffect, useState } from 'react';
import api from '../api';
import { getUserRole, getToken } from '../utils/auth';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalSales: 0,
        openPOs: 0,
        activeEmployees: 0,
        totalExpenses: 0,
        productsInStock: 0,
    });
    const [loading, setLoading] = useState(true);
    const userRole = getUserRole(getToken());

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            const requests = [];

            // Admin and Sales can see sales
            if (userRole === 'Admin' || userRole === 'Sales') {
                requests.push(api.get('/Sales').catch(() => ({ data: [] })));
            } else {
                requests.push(Promise.resolve({ data: [] }));
            }

            // Admin and Purchase can see purchases
            if (userRole === 'Admin' || userRole === 'Purchase') {
                requests.push(api.get('/Purchasing').catch(() => ({ data: [] })));
            } else {
                requests.push(Promise.resolve({ data: [] }));
            }

            // Admin and HR can see employees
            if (userRole === 'Admin' || userRole === 'HR') {
                requests.push(api.get('/HR').catch(() => ({ data: [] })));
            } else {
                requests.push(Promise.resolve({ data: [] }));
            }

            // Admin and Accounting can see expenses
            if (userRole === 'Admin' || userRole === 'Accounting') {
                requests.push(api.get('/Accounting').catch(() => ({ data: [] })));
            } else {
                requests.push(Promise.resolve({ data: [] }));
            }

            // Admin and Production can see products
            if (userRole === 'Admin' || userRole === 'Production') {
                requests.push(api.get('/Production').catch(() => ({ data: [] })));
            } else {
                requests.push(Promise.resolve({ data: [] }));
            }

            const [salesRes, purchaseRes, hrRes, accountingRes, productionRes] = await Promise.all(requests);

            const totalSales = salesRes.data.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
            const totalExpenses = accountingRes.data.reduce((sum, exp) => sum + (exp.amount || 0), 0);

            setStats({
                totalSales,
                openPOs: purchaseRes.data.length,
                activeEmployees: hrRes.data.length,
                totalExpenses,
                productsInStock: productionRes.data.reduce((sum, prod) => sum + (prod.quantity || 0), 0),
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-600">Loading dashboard...</div>
            </div>
        );
    }

    const cards = [
        {
            title: 'Total Sales',
            value: `₱${stats.totalSales.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
            icon: '💰',
            color: 'bg-blue-500',
            visible: userRole === 'Admin' || userRole === 'Sales'
        },
        {
            title: 'Open Purchase Orders',
            value: stats.openPOs,
            icon: '🛒',
            color: 'bg-green-500',
            visible: userRole === 'Admin' || userRole === 'Purchase'
        },
        {
            title: 'Active Employees',
            value: stats.activeEmployees,
            icon: '👥',
            color: 'bg-purple-500',
            visible: userRole === 'Admin' || userRole === 'HR'
        },
        {
            title: 'Total Expenses',
            value: `₱${stats.totalExpenses.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
            icon: '📈',
            color: 'bg-red-500',
            visible: userRole === 'Admin' || userRole === 'Accounting'
        },
        {
            title: 'Products in Stock',
            value: `${stats.productsInStock} units`,
            icon: '🏭',
            color: 'bg-yellow-500',
            visible: userRole === 'Admin' || userRole === 'Production'
        },
    ];

    const visibleCards = cards.filter(card => card.visible);

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
                <p className="text-gray-600 mt-1">Welcome back! Here's your overview.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleCards.map((card, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                                <p className="text-2xl font-bold text-gray-800 mt-2">{card.value}</p>
                            </div>
                            <div className={`${card.color} text-white text-3xl p-4 rounded-full`}>
                                {card.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {userRole === 'Admin' && (
                <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">👑 Admin Access</h3>
                    <p className="text-blue-700">
                        You have full access to all modules. Use the sidebar to navigate through Sales, Purchasing, HR, Accounting, and Production.
                    </p>
                </div>
            )}
        </div>
    );
}