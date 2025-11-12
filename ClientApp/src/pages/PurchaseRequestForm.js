import React, { useEffect, useState } from 'react';
import api from '../api';

export default function PurchaseRequestForm({ pr, onSaved, onCancel }) {
    const [model, setModel] = useState({
        companyId: 1,
        departmentId: null,
        priority: 'Normal',
        requiredDate: null,
        notes: '',
        items: [{ productId: null, description: '', quantity: 1, estimatedPrice: 0, unitOfMeasure: 'pcs', purpose: '' }]
    });

    useEffect(() => {
        if (pr) {
            setModel({
                companyId: pr.companyId || 1,
                departmentId: pr.departmentId || null,
                priority: pr.priority || 'Normal',
                requiredDate: pr.requiredDate ? pr.requiredDate.split('T')[0] : null,
                notes: pr.notes || '',
                items: pr.items && pr.items.length ? pr.items.map(i => ({ productId: i.productId, description: i.description, quantity: i.quantity, estimatedPrice: i.estimatedPrice, unitOfMeasure: i.unitOfMeasure, purpose: i.purpose })) : [{ productId: null, description: '', quantity: 1, estimatedPrice: 0, unitOfMeasure: 'pcs', purpose: '' }]
            });
        }
    }, [pr]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setModel(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (index, field, value) => {
        const items = [...model.items];
        items[index][field] = field === 'quantity' || field === 'estimatedPrice' ? Number(value) : value;
        setModel(prev => ({ ...prev, items }));
    };

    const addItem = () => setModel(prev => ({ ...prev, items: [...prev.items, { productId: null, description: '', quantity: 1, estimatedPrice: 0, unitOfMeasure: 'pcs', purpose: '' }] }));
    const removeItem = (i) => setModel(prev => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (pr) {
                await api.put(`/PurchaseRequest/${pr.id}`, { ...model, id: pr.id });
            } else {
                await api.post('/PurchaseRequest', model);
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
                    <label className="block text-sm">Priority</label>
                    <select name="priority" value={model.priority} onChange={handleChange} className="w-full border p-2 rounded">
                        <option>Low</option>
                        <option>Normal</option>
                        <option>High</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm">Required Date</label>
                    <input type="date" name="requiredDate" value={model.requiredDate || ''} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div className="col-span-2">
                    <label className="block text-sm">Notes</label>
                    <textarea name="notes" value={model.notes} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>

                <div className="col-span-2">
                    <h4 className="font-semibold mb-2">Items</h4>
                    {model.items.map((it, idx) => (
                        <div key={idx} className="grid grid-cols-6 gap-2 items-end mb-2">
                            <div className="col-span-2">
                                <label className="text-sm">Description</label>
                                <input className="w-full border p-2 rounded" value={it.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm">Qty</label>
                                <input type="number" className="w-full border p-2 rounded" value={it.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm">Est. Price</label>
                                <input type="number" step="0.01" className="w-full border p-2 rounded" value={it.estimatedPrice} onChange={e => handleItemChange(idx, 'estimatedPrice', e.target.value)} />
                            </div>
                            <div className="col-span-1 text-right">
                                <button type="button" onClick={() => removeItem(idx)} className="text-red-600">Remove</button>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addItem} className="text-blue-600">Add item</button>
                </div>
            </div>
            <div className="mt-4 flex gap-2">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
                <button type="button" onClick={onCancel} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
            </div>
        </form>
    );
}
