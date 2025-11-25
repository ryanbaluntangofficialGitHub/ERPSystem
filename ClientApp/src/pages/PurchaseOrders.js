import React, { useEffect, useState } from 'react';
import api from '../api';
import { useToast } from '../components/ToastProvider';

export default function PurchaseOrders() {
    const toast = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busyIds, setBusyIds] = useState(new Set());

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await api.get('/PurchaseOrder');
            setOrders(res.data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching POs', err);
            const msg = err.response?.data?.message || err.message || 'Failed to load purchase orders';
            setError(msg);
            toast.error(msg);
        } finally { setLoading(false); }
    };

    const doAction = async (id, action) => {
        if (!window.confirm(`Are you sure you want to ${action} PO ${id}?`)) return;
        try {
            setBusyIds(prev => new Set(prev).add(id));
            await api.post(`/PurchaseOrder/${id}/${action}`);
            toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} action succeeded`);
            await fetchOrders();
        } catch (err) {
            console.error(`${action} failed`, err);
            const msg = err.response?.data?.message || err.message || `${action} failed`;
            toast.error(msg);
        } finally {
            setBusyIds(prev => { const next = new Set(prev); next.delete(id); return next; });
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64">Loading purchase orders...</div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700">{error}</div>;

    // Calculate stats
    const totalOrders = orders.length;
    const draftCount = orders.filter(o => o.status === 'Draft').length;
    const approvedCount = orders.filter(o => o.status === 'Approved').length;
    const sentCount = orders.filter(o => o.status === 'Sent').length;
    const confirmedCount = orders.filter(o => o.status === 'Confirmed').length;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-teal-600 to-cyan-800 text-white p-4 sm:p-6 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center">
                            <span className="text-3xl sm:text-4xl mr-3">📦</span>
                            Purchase Orders
                        </h1>
                        <p className="text-teal-100 text-sm sm:text-base">Manage and track purchase order lifecycle</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold">{totalOrders}</div>
                            <div className="text-xs sm:text-sm text-teal-200">Total Orders</div>
                        </div>
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <span className="text-2xl sm:text-3xl">📋</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Draft Orders</div>
                            <div className="text-3xl font-bold text-gray-900">{draftCount}</div>
                            <div className="text-sm text-yellow-600 font-medium">Awaiting approval</div>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📝</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Approved</div>
                            <div className="text-3xl font-bold text-gray-900">{approvedCount}</div>
                            <div className="text-sm text-green-600 font-medium">Ready to send</div>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">✅</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Sent</div>
                            <div className="text-3xl font-bold text-gray-900">{sentCount}</div>
                            <div className="text-sm text-blue-600 font-medium">In transit</div>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📤</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Confirmed</div>
                            <div className="text-3xl font-bold text-gray-900">{confirmedCount}</div>
                            <div className="text-sm text-purple-600 font-medium">Completed</div>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">🎯</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Purchase Orders Table */}
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
                                    Order Date
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
                                    <td colSpan="5" className="px-4 sm:px-6 py-12 text-center">
                                        <div className="text-6xl mb-4">📦</div>
                                        <div className="text-xl font-medium text-gray-900 mb-2">No purchase orders found</div>
                                        <div className="text-gray-500 mb-4">
                                            Purchase orders will appear here once created
                                        </div>
                                        <button
                                            onClick={fetchOrders}
                                            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                                        >
                                            Refresh Data
                                        </button>
                                    </td>
                                </tr>
                            ) : orders.map(o => (
                                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {o.poNumber || o.PONumber || `PO-${o.id}`}
                                        </div>
                                        <div className="text-xs text-gray-500">Purchase Order</div>
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {o.supplier?.supplierName || o.supplier?.suppliername || o.supplierId || 'N/A'}
                                        </div>
                                        <div className="text-xs text-gray-500">Supplier</div>
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {o.orderDate ? new Date(o.orderDate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            }) : 'N/A'}
                                        </div>
                                        <div className="text-xs text-gray-500">Order date</div>
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            o.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                                            o.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                            o.status === 'Sent' ? 'bg-blue-100 text-blue-800' :
                                            o.status === 'Confirmed' ? 'bg-purple-100 text-purple-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                                o.status === 'Draft' ? 'bg-yellow-400' :
                                                o.status === 'Approved' ? 'bg-green-400' :
                                                o.status === 'Sent' ? 'bg-blue-400' :
                                                o.status === 'Confirmed' ? 'bg-purple-400' :
                                                'bg-gray-400'
                                            }`}></span>
                                            {o.status}
                                        </span>
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-wrap gap-2">
                                            {o.status === 'Draft' && (
                                                <button
                                                    disabled={busyIds.has(o.id)}
                                                    onClick={() => doAction(o.id, 'approve')}
                                                    className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {busyIds.has(o.id) ? 'Processing...' : 'Approve'}
                                                </button>
                                            )}
                                            {o.status === 'Approved' && (
                                                <button
                                                    disabled={busyIds.has(o.id)}
                                                    onClick={() => doAction(o.id, 'send')}
                                                    className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {busyIds.has(o.id) ? 'Processing...' : 'Send'}
                                                </button>
                                            )}
                                            {o.status === 'Sent' && (
                                                <button
                                                    disabled={busyIds.has(o.id)}
                                                    onClick={() => doAction(o.id, 'confirm')}
                                                    className="px-3 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {busyIds.has(o.id) ? 'Processing...' : 'Confirm'}
                                                </button>
                                            )}
                                            <button className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                                                View Details
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
