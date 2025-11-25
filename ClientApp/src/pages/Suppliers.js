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
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-800 text-white p-4 sm:p-6 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center">
                            <span className="text-3xl sm:text-4xl mr-3">🏢</span>
                            Suppliers
                        </h1>
                        <p className="text-indigo-100 text-sm sm:text-base">Manage supplier relationships and contacts</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold">{items.length}</div>
                            <div className="text-xs sm:text-sm text-indigo-200">Total Suppliers</div>
                        </div>
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <span className="text-2xl sm:text-3xl">🏪</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-4 rounded-xl shadow-md">
                <div className="flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleCreate}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center font-medium"
                        >
                            <span className="text-lg mr-2">+</span>
                            Add Supplier
                        </button>
                        <button
                            onClick={fetch}
                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center font-medium"
                        >
                            <span className="text-lg mr-2">🔄</span>
                            Refresh
                        </button>
                    </div>
                    {showForm && (
                        <button
                            onClick={() => { setShowForm(false); setEditing(null); }}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                        >
                            Cancel Form
                        </button>
                    )}
                </div>
            </div>

            {/* Form Section */}
            {showForm && (
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-indigo-500">
                    <SupplierForm
                        supplier={editing}
                        onSaved={onSaved}
                        onCancel={() => { setShowForm(false); setEditing(null); }}
                    />
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-indigo-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Total Suppliers</div>
                            <div className="text-3xl font-bold text-gray-900">{items.length}</div>
                            <div className="text-sm text-indigo-600 font-medium">Active partners</div>
                        </div>
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">🏢</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">With Contact Info</div>
                            <div className="text-3xl font-bold text-gray-900">
                                {items.filter(s => s.email || s.phone).length}
                            </div>
                            <div className="text-sm text-green-600 font-medium">Contactable suppliers</div>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📞</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Active Partners</div>
                            <div className="text-3xl font-bold text-gray-900">{items.length}</div>
                            <div className="text-sm text-blue-600 font-medium">Current suppliers</div>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">🤝</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Suppliers Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <span className="text-2xl mr-2">🏢</span>
                        Supplier Directory
                    </h3>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                        <span className="ml-3 text-gray-600">Loading suppliers...</span>
                    </div>
                ) : error ? (
                    <div className="p-6 text-center">
                        <div className="text-red-600 mb-4">{error}</div>
                        <button
                            onClick={fetch}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Supplier Name
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contact Person
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Phone
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-4 sm:px-6 py-12 text-center">
                                            <div className="text-6xl mb-4">🏢</div>
                                            <div className="text-xl font-medium text-gray-900 mb-2">No suppliers found</div>
                                            <div className="text-gray-500 mb-4">
                                                Start building your supplier network
                                            </div>
                                            <button
                                                onClick={handleCreate}
                                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                                            >
                                                Add First Supplier
                                            </button>
                                        </td>
                                    </tr>
                                ) : items.map(s => (
                                    <tr key={s.id ?? s.Id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {s.supplierName || s.SupplierName}
                                            </div>
                                            <div className="text-xs text-gray-500">Supplier</div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {s.contactPerson || s.ContactPerson || 'N/A'}
                                            </div>
                                            <div className="text-xs text-gray-500">Contact person</div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4">
                                            <div className="text-sm text-gray-900">{s.email || 'N/A'}</div>
                                            <div className="text-xs text-gray-500">Email address</div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{s.phone || 'N/A'}</div>
                                            <div className="text-xs text-gray-500">Phone number</div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => handleEdit(s)}
                                                    className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(s)}
                                                    className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
