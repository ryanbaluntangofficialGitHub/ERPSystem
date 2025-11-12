import React, { useEffect, useState } from 'react';
import api from '../api';

export default function ProductForm({ product, onSaved, onCancel }) {
    const [model, setModel] = useState({
        companyId: 1,
        productCode: '',
        name: '',
        description: '',
        unitOfMeasure: 'pcs',
        price: 0,
        quantity: 0,
        isActive: true
    });

    useEffect(() => {
        if (product) {
            setModel({
                companyId: product.companyId || product.companyid || 1,
                productCode: product.productCode || product.productcode || '',
                name: product.name || '',
                description: product.description || '',
                unitOfMeasure: product.unitOfMeasure || product.unitofmeasure || 'pcs',
                price: product.price || 0,
                quantity: product.quantity || 0,
                isActive: product.isActive ?? true
            });
        }
    }, [product]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setModel(prev => ({ ...prev, [name]: name === 'price' || name === 'quantity' ? Number(value) : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (product) {
                await api.put(`/Product/${product.id}`, model);
            } else {
                await api.post('/Product', model);
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
                    <label htmlFor="productCode" className="block text-sm">Code</label>
                    <input id="productCode" name="productCode" value={model.productCode} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label htmlFor="name" className="block text-sm">Name</label>
                    <input id="name" name="name" value={model.name} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label htmlFor="price" className="block text-sm">Price</label>
                    <input id="price" name="price" type="number" step="0.01" value={model.price} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label htmlFor="quantity" className="block text-sm">Quantity</label>
                    <input id="quantity" name="quantity" type="number" value={model.quantity} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div className="col-span-2">
                    <label htmlFor="description" className="block text-sm">Description</label>
                    <textarea id="description" name="description" value={model.description} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
            </div>
            <div className="mt-4 flex gap-2">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
                <button type="button" onClick={onCancel} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
            </div>
        </form>
    );
}
