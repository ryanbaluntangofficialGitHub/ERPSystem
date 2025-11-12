import React, { useEffect, useState } from 'react';
import api from '../api';
import WarehouseForm from './WarehouseForm';

export default function Warehouses() {
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editing, setEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => { fetchWarehouses(); }, []);

    const fetchWarehouses = async () => {
        try {
            setLoading(true);
            const res = await api.get('/Warehouse');
            const data = res.data && (res.data.items || res.data.Items) ? (res.data.items || res.data.Items) : res.data;
            setWarehouses(data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching warehouses', err);
            setError('Failed to load warehouses');
        } finally { setLoading(false); }
    };

    const handleCreate = () => { setEditing(null); setShowForm(true); };
    const handleEdit = (w) => { setEditing(w); setShowForm(true); };
    const handleDelete = async (id) => { if (!window.confirm('Delete this warehouse?')) return; try { await api.delete(`/Warehouse/${id}`); await fetchWarehouses(); } catch (err) { console.error('Delete failed', err); alert('Delete failed'); } };

    const onSaved = async () => { setShowForm(false); setEditing(null); await fetchWarehouses(); };

    if (loading) return <div className="flex justify-center items-center h-64">Loading warehouses...</div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700">{error}</div>;

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold">Warehouses</h2>
                    <p className="text-gray-600">Manage storage locations</p>
                </div>
                <div>
                    <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded">New Warehouse</button>
                </div>
            </div>

            {showForm && (
                <div className="mb-6"><WarehouseForm warehouse={editing} onSaved={onSaved} onCancel={() => { setShowForm(false); setEditing(null); }} /></div>
            )}

            <div className="bg-white rounded-lg shadow overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                            <th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {warehouses.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No warehouses found</td></tr>
                        ) : (
                            warehouses.map(w => (
                                <tr key={w.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium">{w.id}</td>
                                    <td className="px-6 py-4 text-sm">{w.warehouseCode || w.warehousecode}</td>
                                    <td className="px-6 py-4 text-sm">{w.warehouseName}</td>
                                    <td className="px-6 py-4 text-sm">{w.city}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleEdit(w)} className="text-blue-600 mr-2">Edit</button>
                                        <button onClick={() => handleDelete(w.id)} className="text-red-600">Delete</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
