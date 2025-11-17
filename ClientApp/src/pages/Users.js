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

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">User Management</h2>
            <div className="bg-white p-4 rounded shadow mb-4">
                <form className="grid grid-cols-3 gap-2" onSubmit={createUser}>
                    <div>
                        <label className="block text-sm">Username</label>
                        <input name="username" value={form.username} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label className="block text-sm">Password</label>
                        <input type="password" name="password" value={form.password} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label className="block text-sm">Role</label>
                        <select name="roleName" value={form.roleName} onChange={handleChange} className="w-full border p-2 rounded">
                            <option value="">-- select role --</option>
                            {roles.map(r => <option key={r.Id ?? r.id} value={r.Name ?? r.name}>{r.Name ?? r.name}</option>)}
                        </select>
                    </div>
                    <div className="col-span-3 mt-2 flex gap-2">
                        <button type="submit" disabled={creating} className="bg-blue-600 text-white px-3 py-1 rounded">{creating ? 'Creating...' : 'Create User'}</button>
                        <button type="button" onClick={fetchAll} className="bg-gray-200 px-3 py-1 rounded">Refresh</button>
                    </div>
                </form>
            </div>

            <div className="bg-white p-4 rounded shadow">
                <h3 className="font-semibold mb-2">Existing Users</h3>
                {loading ? <div>Loading...</div> : (
                    <table className="min-w-full text-left text-sm">
                        <thead className="text-gray-500 text-xs uppercase">
                            <tr>
                                <th className="px-2 py-1">Username</th>
                                <th className="px-2 py-1">Role</th>
                                <th className="px-2 py-1">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.Id ?? u.id} className="border-t">
                                    <td className="px-2 py-1">{u.Username ?? u.username}</td>
                                    <td className="px-2 py-1">
                                        <select defaultValue={u.Role ?? u.role} onChange={(e) => changeRole(u.Id ?? u.id, e.target.value)} className="border p-1 rounded">
                                            {roles.map(r => <option key={r.Id ?? r.id} value={r.Name ?? r.name}>{r.Name ?? r.name}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-2 py-1">
                                        <button onClick={() => resetPassword(u.Username ?? u.username)} className="px-2 py-1 bg-yellow-400 rounded mr-2">Reset PW</button>
                                        <button onClick={() => deleteUser(u.Id ?? u.id, u.Username ?? u.username)} className="px-2 py-1 bg-red-600 text-white rounded">Delete</button>
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
