import React, { useEffect, useState } from 'react';
import api from '../api';
import InvoiceForm from './InvoiceForm';
import { useToast } from '../components/ToastProvider';

export default function Invoices() {
    const toast = useToast();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);

    useEffect(() => { fetch(); }, []);

    const fetch = async () => {
        try {
            setLoading(true);
            const res = await api.get('/Invoice');
            const data = res.data && (res.data.items || res.data.Items) ? (res.data.items || res.data.Items) : res.data;
            setInvoices(data || []);
            setError(null);
        } catch (err) {
            console.error('Failed to load invoices', err);
            setError(err.response?.data?.message || err.message || 'Failed to load');
            toast.error('Failed to load invoices');
        } finally { setLoading(false); }
    };

    const handleCreate = () => { setEditing(null); setShowForm(true); };
    const handleEdit = (inv) => { setEditing(inv); setShowForm(true); };

    const handleDelete = async (inv) => {
        if (!window.confirm(`Delete invoice ${inv.invoiceNumber || inv.InvoiceNumber || inv.id}?`)) return;
        try {
            await api.delete(`/Invoice/${inv.id ?? inv.Id}`);
            toast.success('Invoice deleted');
            await fetch();
        } catch (err) {
            console.error('Delete failed', err);
            toast.error(err.response?.data?.message || 'Delete failed');
        }
    };

    const handleEncode = async (id) => {
        try {
            await api.post(`/Invoice/${id}/encode`);
            toast.success('Invoice encoded');
            await fetch();
        } catch (err) {
            console.error('Encode failed', err);
            toast.error(err.response?.data?.message || 'Encode failed');
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm('Approve this invoice?')) return;
        try {
            await api.post(`/Invoice/${id}/approve`);
            toast.success('Invoice approved');
            await fetch();
        } catch (err) {
            console.error('Approve failed', err);
            toast.error(err.response?.data?.message || 'Approve failed');
        }
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold">Invoices</h2>
                    <p className="text-gray-600">Manage supplier invoices</p>
                </div>
                <div>
                    <button onClick={handleCreate} className="bg-blue-600 text-white px-3 py-2 rounded">New Invoice</button>
                </div>
            </div>

            {showForm && (
                <div className="mb-6">
                    <InvoiceForm invoice={editing} onSaved={async () => { setShowForm(false); setEditing(null); await fetch(); }} onCancel={() => { setShowForm(false); setEditing(null); }} />
                </div>
            )}

            <div className="bg-white rounded shadow overflow-auto">
                {loading ? (
                    <div className="p-6">Loading...</div>
                ) : error ? (
                    <div className="p-6 text-red-600">{error}</div>
                ) : (
                    <table className="min-w-full text-sm">
                        <thead className="text-gray-500 text-xs uppercase">
                            <tr>
                                <th className="px-3 py-2">Invoice #</th>
                                <th className="px-3 py-2">PO #</th>
                                <th className="px-3 py-2">Supplier</th>
                                <th className="px-3 py-2">Date</th>
                                <th className="px-3 py-2">Total</th>
                                <th className="px-3 py-2">Status</th>
                                <th className="px-3 py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.length === 0 ? (
                                <tr><td colSpan="7" className="p-4 text-center text-gray-500">No invoices</td></tr>
                            ) : invoices.map(inv => (
                                <tr key={inv.id ?? inv.Id} className="border-t hover:bg-gray-50">
                                    <td className="px-3 py-2">{inv.invoiceNumber || inv.InvoiceNumber}</td>
                                    <td className="px-3 py-2">{inv.purchaseOrder?.poNumber || inv.purchaseOrderId}</td>
                                    <td className="px-3 py-2">{inv.supplier?.supplierName || inv.supplierId}</td>
                                    <td className="px-3 py-2">{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : ''}</td>
                                    <td className="px-3 py-2">{inv.totalAmount}</td>
                                    <td className="px-3 py-2">{inv.status}</td>
                                    <td className="px-3 py-2">
                                        <button onClick={() => handleEdit(inv)} className="text-blue-600 mr-2">Edit</button>
                                        {inv.status === 'Draft' && <button onClick={() => handleEncode(inv.id ?? inv.Id)} className="text-green-600 mr-2">Encode</button>}
                                        {inv.status === 'Encoded' && <button onClick={() => handleApprove(inv.id ?? inv.Id)} className="text-indigo-600 mr-2">Approve</button>}
                                        <button onClick={() => handleDelete(inv)} className="text-red-600">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
