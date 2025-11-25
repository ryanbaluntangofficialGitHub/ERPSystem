import React, { useEffect, useState } from 'react';
import api from '../api';
import WarehouseForm from './WarehouseForm';
import { useToast } from '../components/ToastProvider';

export default function Warehouses() {
    const toast = useToast();
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
            toast.error(err.response?.data?.message || err.message || 'Failed to load warehouses');
        } finally { setLoading(false); }
    };

    const handleCreate = () => { setEditing(null); setShowForm(true); };
    const handleEdit = (w) => { setEditing(w); setShowForm(true); };
    const handleDelete = async (id) => { 
        if (!window.confirm('Delete this warehouse?')) return; 
        try { await api.delete(`/Warehouse/${id}`); toast.success('Warehouse deleted'); await fetchWarehouses(); } 
        catch (err) { console.error('Delete failed', err); toast.error(err.response?.data?.message || err.message || 'Delete failed'); }
    };

    const onSaved = async () => { setShowForm(false); setEditing(null); await fetchWarehouses(); };

    if (loading) return <div className="flex justify-center items-center h-64">Loading warehouses...</div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700">{error}</div>;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-rose-600 to-pink-800 text-white p-4 sm:p-6 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center">
                            <span className="text-3xl sm:text-4xl mr-3">📦</span>
                            Warehouses
                        </h1>
                        <p className="text-rose-100 text-sm sm:text-base">Manage storage locations and inventory facilities</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold">{warehouses.length}</div>
                            <div className="text-xs sm:text-sm text-rose-200">Total Warehouses</div>
                        </div>
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <span className="text-2xl sm:text-3xl">🏭</span>
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
                            className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors flex items-center font-medium"
                        >
                            <span className="text-lg mr-2">+</span>
                            New Warehouse
                        </button>
                        <button
                            onClick={fetchWarehouses}
                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center font-medium"
                        >
                            <span className="text-lg mr-2">🔄</span>
                            Refresh
                        </button>
                        <button className="px-6 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center font-medium">
                            <span className="text-lg mr-2">📍</span>
                            View Locations
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
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-rose-500">
                    <WarehouseForm
                        warehouse={editing}
                        onSaved={onSaved}
                        onCancel={() => { setShowForm(false); setEditing(null); }}
                    />
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-rose-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Total Warehouses</div>
                            <div className="text-3xl font-bold text-gray-900">{warehouses.length}</div>
                            <div className="text-sm text-rose-600 font-medium">Storage facilities</div>
                        </div>
                        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📦</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Active Facilities</div>
                            <div className="text-3xl font-bold text-gray-900">{warehouses.length}</div>
                            <div className="text-sm text-green-600 font-medium">Operational sites</div>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">✅</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Locations</div>
                            <div className="text-3xl font-bold text-gray-900">
                                {new Set(warehouses.map(w => w.city).filter(Boolean)).size}
                            </div>
                            <div className="text-sm text-blue-600 font-medium">Cities covered</div>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📍</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Warehouses Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <span className="text-2xl mr-2">📦</span>
                        Warehouse Directory
                    </h3>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
                        <span className="ml-3 text-gray-600">Loading warehouses...</span>
                    </div>
                ) : error ? (
                    <div className="p-6 text-center">
                        <div className="text-red-600 mb-4">{error}</div>
                        <button
                            onClick={fetchWarehouses}
                            className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors"
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
                                        Warehouse ID
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Code
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Warehouse Name
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Location
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
                                {warehouses.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-4 sm:px-6 py-12 text-center">
                                            <div className="text-6xl mb-4">📦</div>
                                            <div className="text-xl font-medium text-gray-900 mb-2">No warehouses found</div>
                                            <div className="text-gray-500 mb-4">
                                                Set up your first storage facility
                                            </div>
                                            <button
                                                onClick={handleCreate}
                                                className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors"
                                            >
                                                Add First Warehouse
                                            </button>
                                        </td>
                                    </tr>
                                ) : (
                                    warehouses.map(w => (
                                        <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">WH-{w.id}</div>
                                                <div className="text-xs text-gray-500">Warehouse ID</div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {w.warehouseCode || w.warehousecode || 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-500">Warehouse code</div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {w.warehouseName || 'Unnamed Warehouse'}
                                                </div>
                                                <div className="text-xs text-gray-500">Facility name</div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 flex items-center">
                                                    <span className="text-lg mr-2">📍</span>
                                                    {w.city || 'Location not set'}
                                                </div>
                                                <div className="text-xs text-gray-500">City/Location</div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></span>
                                                    Active
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => handleEdit(w)}
                                                        className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(w.id)}
                                                        className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
