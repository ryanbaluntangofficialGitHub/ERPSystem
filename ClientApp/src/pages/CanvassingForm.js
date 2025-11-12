import React, { useEffect, useState } from 'react';
import api from '../api';

export default function CanvassingForm({ canvassing, onSaved, onCancel }) {
    const [model, setModel] = useState({
        companyId: 1,
        purchaseRequestId: null,
        canvassingDate: new Date().toISOString().slice(0,10),
        status: 'InProgress',
        notes: '',
        items: [ { supplierId: null, productId: null, quantity: 1, unitPrice: 0, totalPrice: 0, deliveryDays: null, paymentTerms: null, notes: '', isSelected: false } ]
    });

    useEffect(() => {
        if (canvassing) {
            setModel({
                companyId: canvassing.companyId || 1,
                purchaseRequestId: canvassing.purchaseRequestId || null,
                canvassingDate: canvassing.canvassingDate ? canvassing.canvassingDate.split('T')[0] : new Date().toISOString().slice(0,10),
                status: canvassing.status || 'InProgress',
                notes: canvassing.notes || '',
                items: canvassing.items && canvassing.items.length ? canvassing.items.map(i => ({ supplierId: i.supplierId, productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, totalPrice: i.totalPrice, deliveryDays: i.deliveryDays, paymentTerms: i.paymentTerms, notes: i.notes, isSelected: i.isSelected })) : model.items
            });
        }
    }, [canvassing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setModel(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (idx, field, value) => {
        const items = [...model.items];
        items[idx][field] = field === 'quantity' || field === 'unitPrice' || field === 'totalPrice' ? Number(value) : value;
        setModel(prev => ({ ...prev, items }));
    };

    const addItem = () => setModel(prev => ({ ...prev, items: [...prev.items, { supplierId: null, productId: null, quantity: 1, unitPrice: 0, totalPrice: 0, deliveryDays: null, paymentTerms: null, notes: '', isSelected: false }] }));
    const removeItem = (i) => setModel(prev => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (canvassing) {
                await api.put(`/Canvassing/${canvassing.id}`, { ...model, id: canvassing.id });
            } else {
                await api.post('/Canvassing', model);
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
                    <label className="block text-sm">Purchase Request Id</label>
                    <input name="purchaseRequestId" value={model.purchaseRequestId ?? ''} onChange={e => setModel(prev => ({ ...prev, purchaseRequestId: e.target.value ? Number(e.target.value) : null }))} className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label className="block text-sm">Canvassing Date</label>
                    <input type="date" name="canvassingDate" value={model.canvassingDate} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div className="col-span-2">
                    <label className="block text-sm">Notes</label>
                    <textarea name="notes" value={model.notes} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>

                <div className="col-span-2">
                    <h4 className="font-semibold mb-2">Items</h4>
                    {model.items.map((it, idx) => (
                        <div key={idx} className="grid grid-cols-8 gap-2 items-end mb-2">
                            <div className="col-span-2">
                                <label className="text-sm">Supplier Id</label>
                                <input className="w-full border p-2 rounded" value={it.supplierId ?? ''} onChange={e => handleItemChange(idx, 'supplierId', e.target.value ? Number(e.target.value) : null)} />
                            </div>
                            <div>
                                <label className="text-sm">Product Id</label>
                                <input className="w-full border p-2 rounded" value={it.productId ?? ''} onChange={e => handleItemChange(idx, 'productId', e.target.value ? Number(e.target.value) : null)} />
                            </div>
                            <div>
                                <label className="text-sm">Qty</label>
                                <input type="number" className="w-full border p-2 rounded" value={it.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm">Unit Price</label>
                                <input type="number" step="0.01" className="w-full border p-2 rounded" value={it.unitPrice} onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm">Total</label>
                                <input type="number" step="0.01" className="w-full border p-2 rounded" value={it.totalPrice} onChange={e => handleItemChange(idx, 'totalPrice', e.target.value)} />
                            </div>
                            <div className="text-right">
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
