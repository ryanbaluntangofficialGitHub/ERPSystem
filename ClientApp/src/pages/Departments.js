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
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-cyan-600 to-teal-800 text-white p-4 sm:p-6 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center">
                            <span className="text-3xl sm:text-4xl mr-3">🏢</span>
                            Departments
                        </h1>
                        <p className="text-cyan-100 text-sm sm:text-base">Manage organizational departments and sections</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold">{items.length}</div>
                            <div className="text-xs sm:text-sm text-cyan-200">Total Departments</div>
                        </div>
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <span className="text-2xl sm:text-3xl">🏗️</span>
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
                            className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center font-medium"
                        >
                            <span className="text-lg mr-2">+</span>
                            Add Department
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
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-cyan-500">
                    <DepartmentForm
                        department={editing}
                        onSaved={onSaved}
                        onCancel={() => { setShowForm(false); setEditing(null); }}
                    />
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-cyan-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Total Departments</div>
                            <div className="text-3xl font-bold text-gray-900">{items.length}</div>
                            <div className="text-sm text-cyan-600 font-medium">Organizational units</div>
                        </div>
                        <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">🏢</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Active Units</div>
                            <div className="text-3xl font-bold text-gray-900">{items.length}</div>
                            <div className="text-sm text-green-600 font-medium">Functional departments</div>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">✅</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Department Codes</div>
                            <div className="text-3xl font-bold text-gray-900">
                                {items.filter(d => d.departmentCode || d.DepartmentCode).length}
                            </div>
                            <div className="text-sm text-blue-600 font-medium">Coded departments</div>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">🏷️</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Departments Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <span className="text-2xl mr-2">🏢</span>
                        Department Directory
                    </h3>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
                        <span className="ml-3 text-gray-600">Loading departments...</span>
                    </div>
                ) : error ? (
                    <div className="p-6 text-center">
                        <div className="text-red-600 mb-4">{error}</div>
                        <button
                            onClick={fetch}
                            className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors"
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
                                        Department Name
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Department Code
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
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-4 sm:px-6 py-12 text-center">
                                            <div className="text-6xl mb-4">🏢</div>
                                            <div className="text-xl font-medium text-gray-900 mb-2">No departments found</div>
                                            <div className="text-gray-500 mb-4">
                                                Start organizing your company structure
                                            </div>
                                            <button
                                                onClick={handleCreate}
                                                className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors"
                                            >
                                                Add First Department
                                            </button>
                                        </td>
                                    </tr>
                                ) : items.map(d => (
                                    <tr key={d.id ?? d.Id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {d.departmentName || d.DepartmentName}
                                            </div>
                                            <div className="text-xs text-gray-500">Department name</div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {d.departmentCode || d.DepartmentCode || 'N/A'}
                                            </div>
                                            <div className="text-xs text-gray-500">Department code</div>
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
                                                    onClick={() => handleEdit(d)}
                                                    className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(d)}
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
