import React, { useEffect, useState } from 'react';
import api from '../api';
import { useToast } from '../components/ToastProvider';
import SupplierSelect from '../components/SupplierSelect';
import ProductSelect from '../components/ProductSelect';

export default function CanvassingForm({ canvassing, onSaved, onCancel }) {
    const toast = useToast();
    const [model, setModel] = useState({
        companyId: 1,
        purchaseRequestId: null,
        canvassingDate: new Date().toISOString().slice(0,10),
        status: 'InProgress',
        notes: '',
        items: [ { supplierId: null, supplierLabel:'', productId: null, productLabel:'', quantity: 1, unitPrice: 0, totalPrice: 0, deliveryDays: null, paymentTerms: null, notes: '', isSelected: false } ]
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (canvassing) {
            setModel(prevModel => ({
                ...prevModel,
                companyId: canvassing.companyId || 1,
                purchaseRequestId: canvassing.purchaseRequestId || null,
                canvassingDate: canvassing.canvassingDate ? canvassing.canvassingDate.split('T')[0] : new Date().toISOString().slice(0,10),
                status: canvassing.status || 'InProgress',
                notes: canvassing.notes || '',
                items: canvassing.items && canvassing.items.length ? canvassing.items.map(i => ({ supplierId: i.supplierId, supplierLabel: i.supplier?.supplierName || '', productId: i.productId, productLabel: i.product?.name || '', quantity: i.quantity, unitPrice: i.unitPrice, totalPrice: i.totalPrice, deliveryDays: i.deliveryDays, paymentTerms: i.paymentTerms, notes: i.notes, isSelected: i.isSelected })) : prevModel.items
            }));
        }
    }, [canvassing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setModel(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: undefined }));
    };

    const handleItemChange = (idx, field, value) => {
        const items = [...model.items];
        items[idx][field] = (field === 'quantity' || field === 'unitPrice' || field === 'totalPrice') ? (value === '' ? '' : Number(value)) : value;
        // if quantity or unitPrice changed, update totalPrice
        if (field === 'quantity' || field === 'unitPrice') {
            const q = Number(items[idx].quantity || 0);
            const p = Number(items[idx].unitPrice || 0);
            items[idx].totalPrice = q * p;
        }
        setModel(prev => ({ ...prev, items }));
        setErrors(prev => ({ ...prev, items: undefined }));
    };

    const addItem = () => setModel(prev => ({ ...prev, items: [...prev.items, { supplierId: null, supplierLabel:'', productId: null, productLabel:'', quantity: 1, unitPrice: 0, totalPrice: 0, deliveryDays: null, paymentTerms: null, notes: '', isSelected: false }] }));
    const removeItem = (i) => setModel(prev => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }));

    function validate() {
        const e = {};
        if (!model.purchaseRequestId) e.purchaseRequestId = 'Purchase request is required';
        if (!model.items || model.items.length === 0) e.items = 'At least one quote item is required';
        model.items?.forEach((it, idx) => {
            if (!it.supplierId) e[`items.${idx}.supplierId`] = 'Supplier is required';
            if (!it.unitPrice || Number(it.unitPrice) <= 0) e[`items.${idx}.unitPrice`] = 'Unit price must be > 0';
        });
        return e;
    }

    function mapServerErrors(serverErrors) {
        // serverErrors is either an object like { "Items[0].SupplierId": [".."] } or validation problem details { errors: { ... } }
        const out = {};
        if (!serverErrors) return out;

        const entries = Object.entries(serverErrors);
        for (const [rawKey, messages] of entries) {
            const msg = Array.isArray(messages) ? messages.join(' ') : (typeof messages === 'string' ? messages : JSON.stringify(messages));

            // Normalize key: Items[0].SupplierId -> items.0.supplierId
            let key = rawKey.replace(/\]/g, '').replace(/\[/g, '.');
            // remove any leading 'errors.' or 'ModelState.'
            key = key.replace(/^errors\./i, '').replace(/^modelstate\./i, '').replace(/^ModelState\./, '');

            const parts = key.split('.').map(p => {
                if (/^\d+$/.test(p)) return p; // numeric index stays
                // convert PascalCase to camelCase for property names
                return p.charAt(0).toLowerCase() + p.slice(1);
            });

            const normKey = parts.join('.');
            out[normKey] = msg;
        }

        return out;
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
            if (canvassing) {
                await api.put(`/Canvassing/${canvassing.id}`, { ...model, id: canvassing.id });
                toast.success('Canvassing updated');
            } else {
                await api.post('/Canvassing', model);
                toast.success('Canvassing created');
            }
            setErrors({});
            onSaved();
        } catch (err) {
            console.error('Save failed', err);
            const data = err.response?.data;
            // ValidationProblemDetails shape: { errors: { "Items[0].SupplierId": ["..."] } }
            const errorsSource = data?.errors || data;
            if (errorsSource && typeof errorsSource === 'object') {
                const mapped = mapServerErrors(errorsSource);
                setErrors(prev => ({ ...prev, ...mapped }));
                toast.error('Validation errors - please review the form');
            } else {
                const msg = err.response?.data?.message || err.message || 'Save failed';
                toast.error(msg);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm">Purchase Request Id</label>
                    <input name="purchaseRequestId" value={model.purchaseRequestId ?? ''} onChange={e => setModel(prev => ({ ...prev, purchaseRequestId: e.target.value ? Number(e.target.value) : null }))} className="w-full border p-2 rounded" />
                    {errors.purchaseRequestId && <div className="text-red-600 text-sm">{errors.purchaseRequestId}</div>}
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
                    {errors.items && <div className="text-red-600 text-sm mb-2">{errors.items}</div>}
                    {model.items.map((it, idx) => (
                        <div key={idx} className="grid grid-cols-8 gap-2 items-end mb-2">
                            <div className="col-span-2">
                                <label className="text-sm">Supplier</label>
                                <SupplierSelect value={it.supplierId} onChange={v => handleItemChange(idx, 'supplierId', v)} className="w-full" />
                                {errors[`items.${idx}.supplierId`] && <div className="text-red-600 text-sm">{errors[`items.${idx}.supplierId`]}</div>}
                            </div>
                            <div>
                                <label className="text-sm">Product</label>
                                <ProductSelect value={it.productId ? { value: it.productId, label: it.productLabel } : null} onChange={opt => { handleItemChange(idx, 'productId', opt?.value ?? null); handleItemChange(idx, 'productLabel', opt?.label ?? ''); }} />
                            </div>
                            <div>
                                <label className="text-sm">Qty</label>
                                <input type="number" className="w-full border p-2 rounded" value={it.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} />
                                {errors[`items.${idx}.quantity`] && <div className="text-red-600 text-sm">{errors[`items.${idx}.quantity`]}</div>}
                            </div>
                            <div>
                                <label className="text-sm">Unit Price</label>
                                <input type="number" step="0.01" className="w-full border p-2 rounded" value={it.unitPrice} onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)} />
                                {errors[`items.${idx}.unitPrice`] && <div className="text-red-600 text-sm">{errors[`items.${idx}.unitPrice`]}</div>}
                            </div>
                            <div>
                                <label className="text-sm">Total</label>
                                <input type="number" step="0.01" className="w-full border p-2 rounded" value={it.totalPrice} onChange={e => handleItemChange(idx, 'totalPrice', e.target.value)} />
                                {errors[`items.${idx}.totalPrice`] && <div className="text-red-600 text-sm">{errors[`items.${idx}.totalPrice`]}</div>}
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
