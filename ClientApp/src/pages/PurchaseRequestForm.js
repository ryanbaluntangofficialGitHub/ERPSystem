import React, { useEffect, useState } from 'react';
import api from '../api';
import { useToast } from '../components/ToastProvider';

export default function PurchaseRequestForm({ pr, onSaved, onCancel }) {
    const toast = useToast();
    const [model, setModel] = useState({
        id: null,
        companyId: 1,
        requestNumber: '',
        departmentId: null,
        priority: 'Normal',
        requiredDate: null,
        notes: '',
        items: [{ productId: null, description: '', quantity: 1, estimatedPrice: 0, unitOfMeasure: 'pcs', purpose: '' }]
    });

    const [products, setProducts] = useState([]);
    const [errors, setErrors] = useState({});

    // Modal state for editing/adding an item
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [editingItemIndex, setEditingItemIndex] = useState(null);
    const [itemModalModel, setItemModalModel] = useState({ productId: null, description: '', quantity: 1, estimatedPrice: 0, unitOfMeasure: 'pcs', purpose: '' });

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (pr) {
            setModel({
                id: pr.id ?? pr.Id ?? null,
                companyId: pr.companyId || 1,
                requestNumber: pr.requestNumber || pr.requestNumber || '',
                departmentId: pr.departmentId || null,
                priority: pr.priority || 'Normal',
                requiredDate: pr.requiredDate ? pr.requiredDate.split('T')[0] : null,
                notes: pr.notes || '',
                items: pr.items && pr.items.length ? pr.items.map(i => ({ productId: i.productId, description: i.description, quantity: i.quantity, estimatedPrice: i.estimatedPrice, unitOfMeasure: i.unitOfMeasure, purpose: i.purpose })) : [{ productId: null, description: '', quantity: 1, estimatedPrice: 0, unitOfMeasure: 'pcs', purpose: '' }]
            });
        } else {
            // fetch next PR number for display (server will generate authoritative one on save)
            (async () => {
                try {
                    const res = await api.get('/Utils/next-code?prefix=PR&totalLength=14');
                    setModel(prev => ({ ...prev, requestNumber: res.data.code }));
                } catch (err) {
                    console.error('Failed to get next PR number', err);
                }
            })();
        }
    }, [pr]);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/Product');
            const data = res.data && (res.data.items || res.data.Items) ? (res.data.items || res.data.Items) : res.data;
            setProducts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load products', err);
            setProducts([]);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setModel(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: undefined }));
    };

    function validate() {
        const e = {};
        if (!model.companyId) e.companyId = 'Company is required';
        if (!model.items || model.items.length === 0) e.items = 'At least one item is required';
        model.items?.forEach((it, idx) => {
            if (!it.productId) {
                e[`items.${idx}.productId`] = 'Product is required';
            }
            if (!it.description || it.description.trim() === '') {
                e[`items.${idx}.description`] = 'Description is required';
            }
            if (!it.quantity || Number(it.quantity) <= 0) {
                e[`items.${idx}.quantity`] = 'Quantity must be greater than zero';
            }
        });
        return e;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validation = validate();
        if (Object.keys(validation).length > 0) {
            setErrors(validation);
            toast.error('Please fix validation errors');
            return;
        }

        try {
            if (pr) {
                // Include id in payload to satisfy PUT id check on server
                await api.put(`/PurchaseRequest/${pr.id}`, { ...model, id: pr.id });
                toast.success('Purchase request updated');
            } else {
                // For create, remove client-side requestNumber so server assigns authoritative number
                const payload = { ...model };
                delete payload.id;
                delete payload.requestNumber;
                await api.post('/PurchaseRequest', payload);
                toast.success('Purchase request created');
            }
            onSaved();
        } catch (err) {
            console.error('Save failed', err);
            const msg = err.response?.data?.message || err.response?.data || err.message || 'Save failed';
            toast.error(msg);
        }
    };

    // Item modal handlers
    const openItemModal = (index = null) => {
        if (index === null) {
            setItemModalModel({ productId: products.length > 0 ? products[0].id : null, description: '', quantity: 1, estimatedPrice: 0, unitOfMeasure: 'pcs', purpose: '' });
            setEditingItemIndex(null);
        } else {
            const it = model.items[index];
            setItemModalModel({ productId: it.productId ?? null, description: it.description ?? '', quantity: it.quantity ?? 1, estimatedPrice: it.estimatedPrice ?? 0, unitOfMeasure: it.unitOfMeasure ?? 'pcs', purpose: it.purpose ?? '' });
            setEditingItemIndex(index);
        }
        setIsItemModalOpen(true);
    };

    const closeItemModal = () => {
        setIsItemModalOpen(false);
        setEditingItemIndex(null);
    };

    const handleItemModalChange = (field, value) => {
        setItemModalModel(prev => ({ ...prev, [field]: value }));
    };

    const saveItemModal = () => {
        // validate item
        if (!itemModalModel.productId) { toast.error('Please select a product'); return; }
        if (!itemModalModel.description || itemModalModel.description.trim() === '') { toast.error('Description required'); return; }
        if (!itemModalModel.quantity || Number(itemModalModel.quantity) <= 0) { toast.error('Quantity must be > 0'); return; }

        setModel(prev => {
            const items = [...(prev.items || [])];
            const item = { productId: itemModalModel.productId, description: itemModalModel.description, quantity: Number(itemModalModel.quantity), estimatedPrice: Number(itemModalModel.estimatedPrice), unitOfMeasure: itemModalModel.unitOfMeasure, purpose: itemModalModel.purpose };
            if (editingItemIndex === null) {
                items.push(item);
            } else {
                items[editingItemIndex] = item;
            }
            return { ...prev, items };
        });

        closeItemModal();
    };

    const removeItem = (i) => setModel(prev => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }));

    return (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm">PR#</label>
                    <input name="requestNumber" value={model.requestNumber} readOnly className="w-full border p-2 rounded bg-gray-100" />
                </div>
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
                    {errors.items && <div className="text-red-600 text-sm mb-2">{errors.items}</div>}

                    <div className="space-y-2">
                        {(model.items || []).map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                    <div className="font-medium">{products.find(p => p.id === it.productId)?.name || products.find(p => p.id === it.productId)?.productCode || it.description}</div>
                                    <div className="text-sm text-gray-600">Qty: {it.quantity} • Est. Price: {it.estimatedPrice}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => openItemModal(idx)} className="text-blue-600">Edit</button>
                                    <button type="button" onClick={() => removeItem(idx)} className="text-red-600">Remove</button>
                                </div>
                            </div>
                        ))}

                        <div>
                            <button type="button" onClick={() => openItemModal(null)} className="text-blue-600">Add item</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 flex gap-2">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
                <button type="button" onClick={onCancel} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
            </div>

            {/* Item modal */}
            {isItemModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white p-4 rounded shadow-lg w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-2">Item</h3>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm">Product</label>
                                <select value={itemModalModel.productId ?? ''} onChange={e => handleItemModalChange('productId', Number(e.target.value))} className="w-full border p-2 rounded">
                                    <option value="">-- select product --</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.productCode ? `${p.productCode} - ${p.name}` : p.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm">Description</label>
                                <input className="w-full border p-2 rounded" value={itemModalModel.description} onChange={e => handleItemModalChange('description', e.target.value)} />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="text-sm">Qty</label>
                                    <input type="number" className="w-full border p-2 rounded" value={itemModalModel.quantity} onChange={e => handleItemModalChange('quantity', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-sm">Est. Price</label>
                                    <input type="number" step="0.01" className="w-full border p-2 rounded" value={itemModalModel.estimatedPrice} onChange={e => handleItemModalChange('estimatedPrice', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-sm">UoM</label>
                                    <input className="w-full border p-2 rounded" value={itemModalModel.unitOfMeasure} onChange={e => handleItemModalChange('unitOfMeasure', e.target.value)} />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm">Purpose</label>
                                <input className="w-full border p-2 rounded" value={itemModalModel.purpose} onChange={e => handleItemModalChange('purpose', e.target.value)} />
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            <button type="button" onClick={saveItemModal} className="bg-blue-600 text-white px-3 py-1 rounded">Save item</button>
                            <button type="button" onClick={closeItemModal} className="bg-gray-200 px-3 py-1 rounded">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
}
