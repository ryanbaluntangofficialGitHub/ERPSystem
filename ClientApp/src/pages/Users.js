import React, { useEffect, useState } from 'react';
import api from '../api';
import { useToast } from '../components/ToastProvider';

export default function Users() {
    const toast = useToast();
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ username: '', password: '', roleName: '' });

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [u, r] = await Promise.all([api.get('/Auth/users'), api.get('/Auth/roles')]);
            setUsers(u.data || []);
            setRoles(r.data || []);
            if ((r.data || []).length > 0 && !form.roleName) setForm(f => ({ ...f, roleName: r.data[0].name || r.data[0].Name || '' }));
        } catch (err) {
            console.error('Failed to load users/roles', err);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const createUser = async (e) => {
        e.preventDefault();
        if (!form.username || !form.password || !form.roleName) {
            toast.error('Username, password and role are required');
            return;
        }
        try {
            setCreating(true);
            await api.post('/Auth/register', {
                username: form.username,
                password: form.password,
                roleName: form.roleName
            });
            toast.success('User created');
            setForm({ username: '', password: '', roleName: roles[0]?.name || roles[0]?.Name || '' });
            await fetchAll();
        } catch (err) {
            console.error('Create user failed', err);
            const msg = err.response?.data?.message || err.response?.data || err.message || 'Create failed';
            toast.error(msg);
        } finally {
            setCreating(false);
        }
    };

    const deleteUser = async (id, username) => {
        if (!window.confirm(`Delete user ${username}?`)) return;
        try {
            await api.delete(`/Auth/users/${id}`);
            toast.success('User deleted');
            await fetchAll();
        } catch (err) {
            console.error('Delete failed', err);
            toast.error('Delete failed');
        }
    };

    const changeRole = async (id, newRole) => {
        try {
            await api.put(`/Auth/users/${id}/role`, { roleName: newRole });
            toast.success('Role updated');
            await fetchAll();
        } catch (err) {
            console.error('Update role failed', err);
            toast.error('Update role failed');
        }
    };

    const resetPassword = async (username) => {
        const pw = window.prompt(`Enter new password for ${username}`);
        if (!pw) return;
        try {
            await api.post('/Auth/reset-password', { username, newPassword: pw });
            toast.success('Password reset');
        } catch (err) {
            console.error('Reset failed', err);
            toast.error('Password reset failed');
        }
    };

    // Calculate stats
    const totalUsers = users.length;
    const adminUsers = users.filter(u => (u.Role ?? u.role) === 'Admin').length;
    const regularUsers = users.filter(u => (u.Role ?? u.role) !== 'Admin').length;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-amber-600 to-yellow-800 text-white p-4 sm:p-6 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center">
                            <span className="text-3xl sm:text-4xl mr-3">👥</span>
                            User Management
                        </h1>
                        <p className="text-amber-100 text-sm sm:text-base">Manage system users, roles, and access permissions</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold">{totalUsers}</div>
                            <div className="text-xs sm:text-sm text-amber-200">Total Users</div>
                        </div>
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <span className="text-2xl sm:text-3xl">🔐</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-amber-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Total Users</div>
                            <div className="text-3xl font-bold text-gray-900">{totalUsers}</div>
                            <div className="text-sm text-amber-600 font-medium">System users</div>
                        </div>
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">👥</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Administrators</div>
                            <div className="text-3xl font-bold text-gray-900">{adminUsers}</div>
                            <div className="text-sm text-red-600 font-medium">Admin access</div>
                        </div>
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">👑</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Regular Users</div>
                            <div className="text-3xl font-bold text-gray-900">{regularUsers}</div>
                            <div className="text-sm text-blue-600 font-medium">Standard access</div>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">👤</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create User Form */}
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-amber-500">
                <div className="flex items-center mb-4">
                    <span className="text-2xl mr-3">➕</span>
                    <h3 className="text-lg font-semibold text-gray-800">Create New User</h3>
                </div>

                <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={createUser}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            placeholder="Enter username"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            placeholder="Enter password"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select
                            name="roleName"
                            value={form.roleName}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        >
                            <option value="">-- Select Role --</option>
                            {roles.map(r => (
                                <option key={r.Id ?? r.id} value={r.Name ?? r.name}>
                                    {r.Name ?? r.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-3 flex gap-3 mt-2">
                        <button
                            type="submit"
                            disabled={creating}
                            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="text-lg mr-2">{creating ? '⏳' : '➕'}</span>
                            {creating ? 'Creating User...' : 'Create User'}
                        </button>
                        <button
                            type="button"
                            onClick={fetchAll}
                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center font-medium"
                        >
                            <span className="text-lg mr-2">🔄</span>
                            Refresh
                        </button>
                    </div>
                </form>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <span className="text-2xl mr-2">👥</span>
                        System Users
                    </h3>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                        <span className="ml-3 text-gray-600">Loading users...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User ID
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Username
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
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
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-4 sm:px-6 py-12 text-center">
                                            <div className="text-6xl mb-4">👥</div>
                                            <div className="text-xl font-medium text-gray-900 mb-2">No users found</div>
                                            <div className="text-gray-500 mb-4">
                                                Create your first system user above
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    users.map(u => (
                                        <tr key={u.Id ?? u.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">USER-{u.Id ?? u.id}</div>
                                                <div className="text-xs text-gray-500">User ID</div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {u.Username ?? u.username}
                                                </div>
                                                <div className="text-xs text-gray-500">Login username</div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <select
                                                    defaultValue={u.Role ?? u.role}
                                                    onChange={(e) => changeRole(u.Id ?? u.id, e.target.value)}
                                                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                >
                                                    {roles.map(r => (
                                                        <option key={r.Id ?? r.id} value={r.Name ?? r.name}>
                                                            {r.Name ?? r.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    (u.Role ?? u.role) === 'Admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                                        (u.Role ?? u.role) === 'Admin' ? 'bg-red-400' : 'bg-blue-400'
                                                    }`}></span>
                                                    {(u.Role ?? u.role) === 'Admin' ? 'Administrator' : 'User'}
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => resetPassword(u.Username ?? u.username)}
                                                        className="px-3 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-lg hover:bg-yellow-200 transition-colors"
                                                    >
                                                        Reset Password
                                                    </button>
                                                    <button
                                                        onClick={() => deleteUser(u.Id ?? u.id, u.Username ?? u.username)}
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
