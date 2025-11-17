import React, { useEffect, useState } from 'react';
import api from '../api';
import { useToast } from '../components/ToastProvider';

export default function SupplierForm({ supplier, onSaved, onCancel }) {
    const toast = useToast();
    const [model, setModel] = useState({ companyId:1, supplierName:'', contactPerson:'', email:'', phone:'', address:'' });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (supplier) {
            setModel({
                companyId: supplier.companyId || supplier.CompanyId || 1,
                supplierName: supplier.supplierName || supplier.SupplierName || '',
                contactPerson: supplier.contactPerson || supplier.ContactPerson || '',
                email: supplier.email || '',
                phone: supplier.phone || '',
                address: supplier.address || ''
            });
        }
    }, [supplier]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setModel(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: undefined }));
    };

    const validate = () => {
        const e = {};
        if (!model.supplierName || model.supplierName.trim() === '') e.supplierName = 'Name is required';
        if (model.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(model.email)) e.email = 'Invalid email';
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const v = validate();
        if (Object.keys(v).length > 0) { setErrors(v); toast.error('Fix validation errors'); return; }
        try {
            if (supplier) {
                await api.put(`/Supplier/${supplier.id ?? supplier.Id}`, { ...model, id: supplier.id ?? supplier.Id });
                toast.success('Supplier updated');
            } else {
                await api.post('/Supplier', model);
                toast.success('Supplier created');
            }
            onSaved();
        } catch (err) {
            console.error('Save supplier failed', err);
            const msg = err.response?.data?.message || err.response?.data || err.message || 'Save failed';
            toast.error(msg);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm">Name</label>
                    <input name="supplierName" value={model.supplierName} onChange={handleChange} className="w-full border p-2 rounded" />
                    {errors.supplierName && <div className="text-red-600 text-sm">{errors.supplierName}</div>}
                </div>
                <div>
                    <label className="block text-sm">Contact Person</label>
                    <input name="contactPerson" value={model.contactPerson} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label className="block text-sm">Email</label>
                    <input name="email" value={model.email} onChange={handleChange} className="w-full border p-2 rounded" />
                    {errors.email && <div className="text-red-600 text-sm">{errors.email}</div>}
                </div>
                <div>
                    <label className="block text-sm">Phone</label>
                    <input name="phone" value={model.phone} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div className="col-span-2">
                    <label className="block text-sm">Address</label>
                    <textarea name="address" value={model.address} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
            </div>
            <div className="mt-4 flex gap-2">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
                <button type="button" onClick={onCancel} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
            </div>
        </form>
    );
}
