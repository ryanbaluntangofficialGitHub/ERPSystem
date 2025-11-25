import React, { useEffect, useState } from 'react';
import api from '../api';

export default function HR() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all' or 'active'

    useEffect(() => {
        fetchEmployees();
    }, [filter]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const endpoint = filter === 'active' ? '/HR/active' : '/HR';
            const response = await api.get(endpoint);
            setEmployees(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching employees:', err);
            if (err.response?.status !== 401) {
                setError('Failed to load employees');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <span className="mt-3 text-gray-600">Loading employees...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto mt-8">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                    <button
                        onClick={fetchEmployees}
                        className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const activeCount = employees.filter(e => e.isActive).length;
    const inactiveCount = employees.filter(e => !e.isActive).length;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-4 sm:p-6 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center">
                            <span className="text-3xl sm:text-4xl mr-3">👥</span>
                            Human Resources
                        </h1>
                        <p className="text-purple-100 text-sm sm:text-base">Employee management and organizational records</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold">{activeCount}</div>
                            <div className="text-xs sm:text-sm text-purple-200">Active Employees</div>
                        </div>
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <span className="text-2xl sm:text-3xl">👤</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Active Employees</div>
                            <div className="text-3xl font-bold text-gray-900">{activeCount}</div>
                            <div className="text-sm text-green-600 font-medium">Currently employed</div>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">✅</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-gray-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Inactive Employees</div>
                            <div className="text-3xl font-bold text-gray-900">{inactiveCount}</div>
                            <div className="text-sm text-gray-600 font-medium">Former employees</div>
                        </div>
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">⏸️</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Total Workforce</div>
                            <div className="text-3xl font-bold text-gray-900">{employees.length}</div>
                            <div className="text-sm text-blue-600 font-medium">All employees</div>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">👥</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Buttons */}
            <div className="bg-white p-4 rounded-xl shadow-md">
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                            filter === 'all'
                                ? 'bg-purple-600 text-white shadow-md transform scale-105'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                        }`}
                    >
                        👥 All Employees ({employees.length})
                    </button>
                    <button
                        onClick={() => setFilter('active')}
                        className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                            filter === 'active'
                                ? 'bg-green-600 text-white shadow-md transform scale-105'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                        }`}
                    >
                        ✅ Active Only ({activeCount})
                    </button>
                </div>
            </div>

            {/* Employees Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <span className="text-2xl mr-2">👥</span>
                        Employee Directory
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Employee ID
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Position
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Department
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Hire Date
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
                            {employees.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-4 sm:px-6 py-12 text-center">
                                        <div className="text-6xl mb-4">👥</div>
                                        <div className="text-xl font-medium text-gray-900 mb-2">No employees found</div>
                                        <div className="text-gray-500 mb-4">
                                            Employee records will appear here once added
                                        </div>
                                        <button
                                            onClick={fetchEmployees}
                                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                                        >
                                            Refresh Data
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                employees.map((employee) => (
                                    <tr key={employee.id} className={`hover:bg-gray-50 transition-colors ${!employee.isActive ? 'opacity-60' : ''}`}>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">EMP-{employee.id}</div>
                                            <div className="text-xs text-gray-500">Employee ID</div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                                            <div className="text-xs text-gray-500">Full name</div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{employee.position || 'N/A'}</div>
                                            <div className="text-xs text-gray-500">Job title</div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{employee.department || 'N/A'}</div>
                                            <div className="text-xs text-gray-500">Department</div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4">
                                            <div className="text-sm text-gray-900">{employee.email || 'N/A'}</div>
                                            {employee.phone && (
                                                <div className="text-xs text-gray-500">{employee.phone}</div>
                                            )}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {new Date(employee.hireDate).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                            <div className="text-xs text-gray-500">Hire date</div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            {employee.isActive ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></span>
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1.5"></span>
                                                    Inactive
                                                </span>
                                            )}
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
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
