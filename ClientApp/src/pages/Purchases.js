import React, { useEffect, useState } from 'react';
import api from '../api';

export default function Purchases() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await api.get('/Purchasing');
            // normalize possible response shapes
            const data = response.data?.items || response.data || [];
            setOrders(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err) {
            console.error('Error fetching purchase orders:', err);
            setError('Failed to load purchase orders');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-600">Loading purchase orders...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
            </div>
        );
    }

    const totalPurchases = orders.reduce((sum, order) => {
        const totalRaw = order.total ?? order.totalAmount ?? order.total_amount ?? order.TotalAmount ?? 0;
        return sum + Number(totalRaw);
    }, 0);
    const orderCount = orders.length;
    const uniqueSuppliers = new Set(orders.map(order =>
        order.supplier?.supplierName || order.supplier?.supplierName || order.supplier || order.supplierName || order.SupplierName
    ).filter(Boolean)).size;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-4 sm:p-6 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center">
                            <span className="text-3xl sm:text-4xl mr-3">🛒</span>
                            Purchase Orders
                        </h1>
                        <p className="text-green-100 text-sm sm:text-base">Manage supplier purchases and procurement</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold">{orderCount}</div>
                            <div className="text-xs sm:text-sm text-green-200">Total Orders</div>
                        </div>
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <span className="text-2xl sm:text-3xl">📦</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Total Orders</div>
                            <div className="text-3xl font-bold text-gray-900">{orderCount}</div>
                            <div className="text-sm text-green-600 font-medium">Purchase transactions</div>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📋</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Total Spent</div>
                            <div className="text-3xl font-bold text-gray-900">
                                ₱{totalPurchases.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-sm text-blue-600 font-medium">Procurement cost</div>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">💰</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Active Suppliers</div>
                            <div className="text-3xl font-bold text-gray-900">{uniqueSuppliers}</div>
                            <div className="text-sm text-purple-600 font-medium">Supplier relationships</div>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">🏢</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <span className="text-2xl mr-2">📦</span>
                        Purchase Orders
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    PO Number
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Supplier
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-4 sm:px-6 py-12 text-center">
                                        <div className="text-6xl mb-4">📦</div>
                                        <div className="text-xl font-medium text-gray-900 mb-2">No purchase orders found</div>
                                        <div className="text-gray-500 mb-4">
                                            Purchase orders will appear here once created
                                        </div>
                                        <button
                                            onClick={fetchOrders}
                                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            Refresh Data
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => {
                                    const dateRaw = order.date || order.orderDate || order.order_date || order.orderDateUtc || order.orderDateTime;
                                    const totalRaw = order.total ?? order.totalAmount ?? order.total_amount ?? order.TotalAmount;
                                    const supplierRaw = order.supplier?.supplierName || order.supplier?.supplierName || order.supplier || order.supplierName || order.SupplierName;

                                    const dateStr = dateRaw ? new Date(dateRaw).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    }) : '';
                                    const totalStr = (totalRaw !== undefined && totalRaw !== null) ? Number(totalRaw).toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '0.00';

                                    return (
                                        <tr key={order.id ?? order.Id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {order.poNumber || order.PONumber || `PO-${order.id ?? order.Id}`}
                                                </div>
                                                <div className="text-xs text-gray-500">Purchase Order</div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{supplierRaw || 'N/A'}</div>
                                                <div className="text-xs text-gray-500">Supplier</div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{dateStr || 'N/A'}</div>
                                                <div className="text-xs text-gray-500">Order date</div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <div className="text-lg font-bold text-blue-600">₱{totalStr}</div>
                                                <div className="text-xs text-gray-500">Total amount</div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                    Active
                                                </span>
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
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
