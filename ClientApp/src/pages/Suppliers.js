import React, { useEffect, useState } from 'react';
import api from '../api';
import SupplierForm from './SupplierForm';
import { useToast } from '../components/ToastProvider';

export default function Suppliers() {
    const toast = useToast();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editing, setEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => { fetch(); }, []);

    const fetch = async () => {
        try {
            setLoading(true);
            const res = await api.get('/Supplier');
            setItems(res.data || []);
            setError(null);
        } catch (err) {
            console.error('Failed to load suppliers', err);
            setError(err.response?.data?.message || err.message || 'Failed to load');
            toast.error('Failed to load suppliers');
        } finally { setLoading(false); }
    };

    const handleCreate = () => { setEditing(null); setShowForm(true); };
    const handleEdit = (s) => { setEditing(s); setShowForm(true); };
    const handleDelete = async (s) => {
        if (!window.confirm(`Delete supplier ${s.supplierName || s.SupplierName}?`)) return;
        try {
            await api.delete(`/Supplier/${s.id ?? s.Id}`);
            toast.success('Supplier deleted');
            await fetch();
        } catch (err) {
            console.error('Delete failed', err);
            toast.error(err.response?.data?.message || 'Delete failed');
        }
    };

    const onSaved = async () => { setShowForm(false); setEditing(null); await fetch(); };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold">Suppliers</h2>
                    <p className="text-gray-600">Manage suppliers</p>
                </div>
                <div>
                    <button onClick={handleCreate} className="bg-blue-600 text-white px-3 py-2 rounded">Add Supplier</button>
                </div>
            </div>

            <div className="bg-white rounded shadow overflow-auto">
                {loading ? (
                    <div className="p-6">Loading...</div>
                ) : error ? (
                    <div className="p-6 text-red-600">{error}</div>
                ) : (
                    <table className="min-w-full text-sm">
                        <thead className="text-gray-500 text-xs uppercase">
                            <tr>
                                <th className="px-3 py-2">Name</th>
                                <th className="px-3 py-2">Contact</th>
                                <th className="px-3 py-2">Email</th>
                                <th className="px-3 py-2">Phone</th>
                                <th className="px-3 py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr><td colSpan="5" className="p-4 text-center text-gray-500">No suppliers</td></tr>
                            ) : items.map(s => (
                                <tr key={s.id ?? s.Id} className="border-t hover:bg-gray-50">
                                    <td className="px-3 py-2">{s.supplierName || s.SupplierName}</td>
                                    <td className="px-3 py-2">{s.contactPerson || s.ContactPerson}</td>
                                    <td className="px-3 py-2">{s.email}</td>
                                    <td className="px-3 py-2">{s.phone}</td>
                                    <td className="px-3 py-2">
                                        <button onClick={() => handleEdit(s)} className="text-blue-600 mr-2">Edit</button>
                                        <button onClick={() => handleDelete(s)} className="text-red-600">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showForm && (
                <div className="mt-4">
                    <SupplierForm supplier={editing} onSaved={onSaved} onCancel={() => { setShowForm(false); setEditing(null); }} />
                </div>
            )}
        </div>
    );
}
