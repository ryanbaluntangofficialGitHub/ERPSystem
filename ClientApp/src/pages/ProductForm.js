import React, { useEffect, useState } from 'react';
import api from '../api';
import { useToast } from '../components/ToastProvider';

export default function ProductForm({ product, onSaved, onCancel }) {
    const toast = useToast();
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

    const [errors, setErrors] = useState({});

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
        } else {
            // fetch next product code
            (async () => {
                try {
                    const res = await api.get('/Utils/next-code?prefix=PD&totalLength=14');
                    setModel(prev => ({ ...prev, productCode: res.data.code }));
                } catch (err) {
                    console.error('Failed to get next product code', err);
                }
            })();
        }
    }, [product]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setModel(prev => ({ ...prev, [name]: name === 'price' || name === 'quantity' ? Number(value) : value }));
        setErrors(prev => ({ ...prev, [name]: undefined }));
    };

    function validate() {
        const e = {};
        if (!model.productCode || model.productCode.trim() === '') e.productCode = 'Code is required';
        if (!model.name || model.name.trim() === '') e.name = 'Name is required';
        if (model.price == null || Number(model.price) < 0) e.price = 'Price must be zero or greater';
        if (model.quantity == null || Number(model.quantity) < 0) e.quantity = 'Quantity must be zero or greater';
        return e;
    }

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        const validation = validate();
        if (Object.keys(validation).length > 0) {
            setErrors(validation);
            toast.error('Please fix validation errors');
            return;
        }

        try {
            if (product) {
                await api.put(`/Product/${product.id}`, model);
                toast.success('Product updated');
            } else {
                // ensure productCode is present
                const payload = { ...model };
                delete payload.id;
                await api.post('/Product', payload);
                toast.success('Product created');
            }
            onSaved();
        } catch (err) {
            console.error('Save failed', err);
            const msg = err.response?.data?.message || err.response?.data || err.message || 'Save failed';
            toast.error(msg);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="productCode" className="block text-sm">Code</label>
                    <input id="productCode" name="productCode" value={model.productCode} readOnly className="w-full border p-2 rounded bg-gray-100" />
                    {errors.productCode && <div className="text-red-600 text-sm mt-1">{errors.productCode}</div>}
                </div>
                <div>
                    <label htmlFor="name" className="block text-sm">Name</label>
                    <input id="name" name="name" value={model.name} onChange={handleChange} className="w-full border p-2 rounded" />
                    {errors.name && <div className="text-red-600 text-sm mt-1">{errors.name}</div>}
                </div>
                <div>
                    <label htmlFor="price" className="block text-sm">Price</label>
                    <input id="price" name="price" type="number" step="0.01" value={model.price} onChange={handleChange} className="w-full border p-2 rounded" />
                    {errors.price && <div className="text-red-600 text-sm mt-1">{errors.price}</div>}
                </div>
                <div>
                    <label htmlFor="quantity" className="block text-sm">Quantity</label>
                    <input id="quantity" name="quantity" type="number" value={model.quantity} onChange={handleChange} className="w-full border p-2 rounded" />
                    {errors.quantity && <div className="text-red-600 text-sm mt-1">{errors.quantity}</div>}
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
