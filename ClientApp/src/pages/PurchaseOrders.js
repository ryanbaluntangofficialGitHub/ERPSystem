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

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-3xl font-bold">Purchase Orders</h2>
                <p className="text-gray-600">Manage Purchase Orders</p>
            </div>

            <div className="bg-white rounded-lg shadow overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO #</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {orders.length === 0 ? (
                            <tr><td colSpan="5" className="p-4 text-center text-gray-500">No purchase orders</td></tr>
                        ) : orders.map(o => (
                            <tr key={o.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">{o.poNumber || o.PONumber || `PO-${o.id}`}</td>
                                <td className="px-6 py-4">{o.supplier?.supplierName || o.supplier?.suppliername || o.supplierId}</td>
                                <td className="px-6 py-4">{o.orderDate ? new Date(o.orderDate).toLocaleDateString() : ''}</td>
                                <td className="px-6 py-4">{o.status}</td>
                                <td className="px-6 py-4 text-right">
                                    {o.status === 'Draft' && <button disabled={busyIds.has(o.id)} onClick={() => doAction(o.id, 'approve')} className="text-green-600 mr-2">{busyIds.has(o.id) ? 'Processing...' : 'Approve'}</button>}
                                    {o.status === 'Approved' && <button disabled={busyIds.has(o.id)} onClick={() => doAction(o.id, 'send')} className="text-blue-600 mr-2">{busyIds.has(o.id) ? 'Processing...' : 'Send'}</button>}
                                    {o.status === 'Sent' && <button disabled={busyIds.has(o.id)} onClick={() => doAction(o.id, 'confirm')} className="text-indigo-600 mr-2">{busyIds.has(o.id) ? 'Processing...' : 'Confirm'}</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
