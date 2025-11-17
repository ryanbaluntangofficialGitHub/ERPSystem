import React, { useEffect, useState } from 'react';
import api from '../api';
import { useToast } from '../components/ToastProvider';

export default function DepartmentForm({ department, onSaved, onCancel }) {
    const toast = useToast();
    const [model, setModel] = useState({ departmentName: '', departmentCode: '' });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (department) {
            setModel({ departmentName: department.departmentName || department.DepartmentName || '', departmentCode: department.departmentCode || department.DepartmentCode || '' });
        }
    }, [department]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setModel(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: undefined }));
    };

    const validate = () => {
        const e = {};
        if (!model.departmentName || model.departmentName.trim() === '') e.departmentName = 'Name is required';
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const v = validate();
        if (Object.keys(v).length > 0) { setErrors(v); toast.error('Fix validation errors'); return; }
        try {
            if (department) {
                await api.put(`/Department/${department.id ?? department.Id}`, { id: department.id ?? department.Id, departmentName: model.departmentName, departmentCode: model.departmentCode });
                toast.success('Department updated');
            } else {
                await api.post('/Department', model);
                toast.success('Department created');
            }
            onSaved();
        } catch (err) {
            console.error('Save department failed', err);
            const msg = err.response?.data?.message || err.response?.data || err.message || 'Save failed';
            toast.error(msg);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm">Name</label>
                    <input name="departmentName" value={model.departmentName} onChange={handleChange} className="w-full border p-2 rounded" />
                    {errors.departmentName && <div className="text-red-600 text-sm">{errors.departmentName}</div>}
                </div>
                <div>
                    <label className="block text-sm">Code</label>
                    <input name="departmentCode" value={model.departmentCode} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
            </div>
            <div className="mt-4 flex gap-2">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
                <button type="button" onClick={onCancel} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
            </div>
        </form>
    );
}
