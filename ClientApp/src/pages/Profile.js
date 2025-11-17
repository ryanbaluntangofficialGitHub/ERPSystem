import React, { useEffect, useState } from 'react';
import api from '../api';
import { useToast } from '../components/ToastProvider';

export default function Profile() {
    const toast = useToast();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await api.post('/Auth/validate');
            setProfile(res.data);
        } catch (err) {
            console.error('Failed to load profile', err);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const changePassword = async (e) => {
        e.preventDefault();
        try {
            await api.post('/Auth/change-password', { currentPassword, newPassword });
            toast.success('Password changed');
            setCurrentPassword('');
            setNewPassword('');
        } catch (err) {
            console.error('Change password failed', err);
            const msg = err.response?.data?.message || err.message || 'Failed';
            toast.error(msg);
        }
    };

    if (loading) return <div>Loading profile...</div>;

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">My Profile</h2>
            <div className="bg-white p-4 rounded shadow mb-4">
                <div><strong>Username:</strong> {profile?.Username ?? profile?.username ?? profile?.Username}</div>
                <div><strong>Role:</strong> {profile?.Role ?? profile?.role}</div>
            </div>

            <div className="bg-white p-4 rounded shadow">
                <h3 className="font-semibold mb-2">Change Password</h3>
                <form onSubmit={changePassword} className="grid gap-2 max-w-sm">
                    <input type="password" placeholder="Current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="border p-2 rounded" />
                    <input type="password" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="border p-2 rounded" />
                    <div className="flex gap-2">
                        <button className="bg-blue-600 text-white px-3 py-1 rounded">Change</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
