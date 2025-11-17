import React, { useEffect, useState } from 'react';
import api from '../api';
import DepartmentForm from './DepartmentForm';
import { useToast } from '../components/ToastProvider';

export default function Departments() {
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
            const res = await api.get('/Department');
            const data = res.data && (res.data.items || res.data.Items) ? (res.data.items || res.data.Items) : res.data;
            setItems(data || []);
            setError(null);
        } catch (err) {
            console.error('Failed to load departments', err);
            setError(err.response?.data?.message || err.message || 'Failed to load');
            toast.error('Failed to load departments');
        } finally { setLoading(false); }
    };

    const handleCreate = () => { setEditing(null); setShowForm(true); };
    const handleEdit = (d) => { setEditing(d); setShowForm(true); };
    const handleDelete = async (d) => {
        if (!window.confirm(`Delete department ${d.departmentName || d.DepartmentName}?`)) return;
        try {
            await api.delete(`/Department/${d.id ?? d.Id}`);
            toast.success('Department deleted');
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
                    <h2 className="text-3xl font-bold">Departments</h2>
                    <p className="text-gray-600">Manage departments and sections</p>
                </div>
                <div>
                    <button onClick={handleCreate} className="bg-blue-600 text-white px-3 py-2 rounded">Add Department</button>
                </div>
            </div>

            {showForm && (
                <div className="mb-6">
                    <DepartmentForm department={editing} onSaved={onSaved} onCancel={() => { setShowForm(false); setEditing(null); }} />
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
                                <th className="px-3 py-2">Name</th>
                                <th className="px-3 py-2">Code</th>
                                <th className="px-3 py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr><td colSpan="3" className="p-4 text-center text-gray-500">No departments</td></tr>
                            ) : items.map(d => (
                                <tr key={d.id ?? d.Id} className="border-t hover:bg-gray-50">
                                    <td className="px-3 py-2">{d.departmentName || d.DepartmentName}</td>
                                    <td className="px-3 py-2">{d.departmentCode || d.DepartmentCode}</td>
                                    <td className="px-3 py-2">
                                        <button onClick={() => handleEdit(d)} className="text-blue-600 mr-2">Edit</button>
                                        <button onClick={() => handleDelete(d)} className="text-red-600">Delete</button>
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
