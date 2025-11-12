import React, { useEffect, useState } from 'react';
import api from '../api';

export default function WarehouseForm({ warehouse, onSaved, onCancel }) {
    const [model, setModel] = useState({
        companyId: 1,
        warehouseCode: '',
        warehouseName: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        managerId: null,
        isActive: true
    });

    useEffect(() => {
        if (warehouse) {
            setModel({
                companyId: warehouse.companyId || warehouse.companyid || 1,
                warehouseCode: warehouse.warehouseCode || warehouse.warehousecode || '',
                warehouseName: warehouse.warehouseName || warehouse.warehousename || '',
                address: warehouse.address || '',
                city: warehouse.city || '',
                state: warehouse.state || '',
                country: warehouse.country || '',
                postalCode: warehouse.postalCode || warehouse.postalcode || '',
                managerId: warehouse.managerId || warehouse.managerid || null,
                isActive: warehouse.isActive ?? true
            });
        }
    }, [warehouse]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setModel(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (warehouse) {
                await api.put(`/Warehouse/${warehouse.id}`, model);
            } else {
                await api.post('/Warehouse', model);
            }
            onSaved();
        } catch (err) {
            console.error('Save failed', err);
            alert('Save failed');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm">Code</label>
                    <input name="warehouseCode" value={model.warehouseCode} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label className="block text-sm">Name</label>
                    <input name="warehouseName" value={model.warehouseName} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label className="block text-sm">City</label>
                    <input name="city" value={model.city} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label className="block text-sm">Country</label>
                    <input name="country" value={model.country} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div className="col-span-2">
                    <label className="block text-sm">Address</label>
                    <textarea name="address" value={model.address} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label className="block text-sm">Postal Code</label>
                    <input name="postalCode" value={model.postalCode} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label className="block text-sm">Manager Id</label>
                    <input name="managerId" value={model.managerId ?? ''} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
            </div>
            <div className="mt-4 flex gap-2">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
                <button type="button" onClick={onCancel} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
            </div>
        </form>
    );
}
