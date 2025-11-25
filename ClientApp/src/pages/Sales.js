import React, { useEffect, useState, useRef } from 'react';
import api from '../api';

export default function Sales() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const hasFetched = useRef(false);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        console.log('Sales component mounted');
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        console.log('Fetching sales orders...');
        const token = localStorage.getItem('erp_token');
        console.log('Token exists:', !!token);

        try {
            setLoading(true);
            setError(null);

            console.log('Making API call to /Sales...');
            const response = await api.get('/Sales');
            console.log('Sales orders loaded successfully:', response.data);

            setOrders(response.data || []);
        } catch (err) {
            console.error('Error fetching sales orders:', {
                status: err.response?.status,
                message: err.response?.data?.message || err.message,
                fullError: err
            });

            if (err.response?.status !== 401) {
                setError(err.response?.data?.message || 'Failed to load sales orders. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    console.log('Sales render - loading:', loading, 'orders:', orders.length, 'error:', error);

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <span className="mt-3 text-gray-600">Loading sales orders...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto mt-8">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                    <button
                        onClick={() => {
                            hasFetched.current = false;
                            fetchOrders();
                        }}
                        className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const orderCount = orders.length;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-800 text-white p-4 sm:p-6 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center">
                            <span className="text-3xl sm:text-4xl mr-3">💰</span>
                            Sales
                        </h1>
                        <p className="text-blue-100 text-sm sm:text-base">Manage sales orders and revenue tracking</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold">{orders.length}</div>
                            <div className="text-xs sm:text-sm text-blue-200">Total Orders</div>
                        </div>
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <span className="text-2xl sm:text-3xl">📊</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Total Orders</div>
                            <div className="text-3xl font-bold text-gray-900">{orderCount}</div>
                            <div className="text-sm text-blue-600 font-medium">Sales transactions</div>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📦</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Total Revenue</div>
                            <div className="text-3xl font-bold text-gray-900">
                                ₱{totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-sm text-green-600 font-medium">All time sales</div>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">💰</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Average Order</div>
                            <div className="text-3xl font-bold text-gray-900">
                                ₱{orderCount > 0 ? (totalRevenue / orderCount).toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '0.00'}
                            </div>
                            <div className="text-sm text-purple-600 font-medium">Per transaction</div>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📈</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <span className="text-2xl mr-2">📋</span>
                        Sales Orders
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Order #
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-4 sm:px-6 py-12 text-center">
                                        <div className="text-6xl mb-4">📦</div>
                                        <div className="text-xl font-medium text-gray-900 mb-2">No sales orders found</div>
                                        <div className="text-gray-500 mb-4">
                                            Sample data should be loaded automatically on first run
                                        </div>
                                        <button
                                            onClick={() => {
                                                hasFetched.current = false;
                                                fetchOrders();
                                            }}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Refresh Data
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                                            <div className="text-xs text-gray-500">Order ID</div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                                            <div className="text-xs text-gray-500">Customer</div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {new Date(order.saleDate).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                            <div className="text-xs text-gray-500">Sale date</div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-lg font-bold text-green-600">
                                                ₱{order.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                            </div>
                                            <div className="text-xs text-gray-500">Total amount</div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="flex space-x-2">
                                                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                                    View
                                                </button>
                                                <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                                                    Edit
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
