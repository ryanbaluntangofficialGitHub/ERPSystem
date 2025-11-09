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

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Sales Orders</h2>
                <p className="text-gray-600 mt-1">Manage all sales transactions</p>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Order #
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                        <div className="text-4xl mb-2">📦</div>
                                        <div>No sales orders found</div>
                                        <div className="text-sm mt-2 text-gray-400">
                                            Sample data should be loaded automatically on first run
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            #{order.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {order.customerName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {new Date(order.saleDate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                                            ₱{order.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
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