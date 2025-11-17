import React, { useState } from 'react';
import api from '../api';

export default function EmployeeQuickForm({ defaultCompanyId = 1, onCreated, onCancel }) {
    const [model, setModel] = useState({
        companyId: defaultCompanyId,
        employeeCode: '',
        name: '',
        position: 'Manager',
        department: 'Operations',
        email: '',
        phone: '',
        hireDate: new Date().toISOString().substring(0, 10)
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setModel(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            setSaving(true);
            const res = await api.post('/Employee', model);
            if (onCreated) onCreated(res.data || res);
        } catch (err) {
            console.error('Error creating employee', err);
            const msg = err.response?.data?.message || err.response?.data || err.message || 'Failed to create employee';
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded shadow-lg w-full max-w-md p-4">
                <h3 className="font-semibold mb-2">Add Manager</h3>
                {error && <div className="mb-2 text-red-600 text-sm whitespace-pre-wrap">{typeof error === 'object' ? JSON.stringify(error) : error}</div>}
                <form onSubmit={handleSubmit} className="grid gap-2">
                    <div>
                        <label className="block text-sm">Employee Code</label>
                        <input name="employeeCode" value={model.employeeCode} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label className="block text-sm">Name</label>
                        <input name="name" value={model.name} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-sm">Position</label>
                            <input name="position" value={model.position} onChange={handleChange} className="w-full border p-2 rounded" />
                        </div>
                        <div>
                            <label className="block text-sm">Department</label>
                            <input name="department" value={model.department} onChange={handleChange} className="w-full border p-2 rounded" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-sm">Email</label>
                            <input name="email" value={model.email} onChange={handleChange} className="w-full border p-2 rounded" />
                        </div>
                        <div>
                            <label className="block text-sm">Phone</label>
                            <input name="phone" value={model.phone} onChange={handleChange} className="w-full border p-2 rounded" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm">Hire Date</label>
                        <input type="date" name="hireDate" value={model.hireDate} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                    <div className="flex gap-2 justify-end mt-2">
                        <button type="button" onClick={onCancel} className="px-3 py-1 rounded border">Cancel</button>
                        <button type="submit" disabled={saving} className="px-3 py-1 rounded bg-blue-600 text-white">{saving ? 'Saving...' : 'Create'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
