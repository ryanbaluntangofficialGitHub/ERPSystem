import React, { useEffect, useState } from 'react';
import AsyncSelect from 'react-select/async';
import api from '../api';
import { useToast } from '../components/ToastProvider';
import SupplierSelect from '../components/SupplierSelect';

export default function PurchaseOrderForm({ order, onSaved, onCancel }) {
    const toast = useToast();
    const [model, setModel] = useState({ companyId: 1, supplierId: null, requiredDate: null, shippingAddress: '', notes: '', items: [{ productId: null, productLabel: '', quantity: 1, unitPrice: 0, lineTotal: 0 }] });
    const [loadingLookups, setLoadingLookups] = useState(true);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchLookups();
        if (order) {
            setModel({
                companyId: order.companyId || 1,
                supplierId: order.supplierId || order.SupplierId || null,
                requiredDate: order.requiredDate ? order.requiredDate.split('T')[0] : null,
                shippingAddress: order.shippingAddress || order.ShippingAddress || '',
                notes: order.notes || order.Notes || '',
                items: (order.items || order.Items || []).map(i => ({ productId: i.productId || i.ProductId, productLabel: i.product?.name || i.Product?.Name || i.description || '', quantity: i.quantity || i.Quantity, unitPrice: i.unitPrice || i.UnitPrice, lineTotal: i.lineTotal || i.LineTotal }))
            });
        }
    }, [order]);

    const fetchLookups = async () => {
        try {
            setLoadingLookups(true);
            // suppliers fetched via SupplierSelect
        } catch (err) {
            console.error('Lookup load failed', err);
            toast.error('Failed to load lookups');
        } finally { setLoadingLookups(false); }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setModel(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: undefined }));
    };

    const handleItemChange = (idx, field, value) => {
        const items = [...model.items];
        if (field === 'quantity' || field === 'unitPrice') {
            items[idx][field] = Number(value);
        } else {
            items[idx][field] = value;
        }
        items[idx].lineTotal = Number(items[idx].quantity || 0) * Number(items[idx].unitPrice || 0);
        setModel(prev => ({ ...prev, items }));
    };

    const setProductForItem = (idx, option) => {
        const items = [...model.items];
        if (option) {
            items[idx].productId = option.value;
            items[idx].productLabel = option.label;
        } else {
            items[idx].productId = null;
            items[idx].productLabel = '';
        }
        setModel(prev => ({ ...prev, items }));
    };

    const addItem = () => setModel(prev => ({ ...prev, items: [...prev.items, { productId: null, productLabel: '', quantity: 1, unitPrice: 0, lineTotal: 0 }] }));
    const removeItem = (i) => setModel(prev => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }));

    const loadProductOptions = async (inputValue, callback) => {
        try {
            const res = await api.get('/Product', { params: { query: inputValue } });
            const data = res.data && (res.data.items || res.data.Items) ? (res.data.items || res.data.Items) : res.data;
            const options = (Array.isArray(data) ? data : []).map(p => ({ value: p.id ?? p.Id, label: p.productCode ? `${p.productCode} - ${p.name}` : p.name }));
            callback(options);
        } catch (err) {
            console.error('Product search failed', err);
            callback([]);
        }
    };

    const validate = () => {
        const e = {};
        if (!model.supplierId) e.supplierId = 'Supplier is required';
        if (!model.items || model.items.length === 0) e.items = 'At least one item is required';
        model.items?.forEach((it, idx) => {
            if (!it.productId) e[`items.${idx}.productId`] = 'Product required';
            if (!it.quantity || Number(it.quantity) <= 0) e[`items.${idx}.quantity`] = 'Quantity > 0';
        });
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const v = validate();
        if (Object.keys(v).length > 0) { setErrors(v); toast.error('Fix validation errors'); return; }
        const payload = {
            companyId: model.companyId,
            supplierId: Number(model.supplierId),
            requiredDate: model.requiredDate || null,
            shippingAddress: model.shippingAddress,
            notes: model.notes,
            items: model.items.map(i => ({ productId: Number(i.productId), quantity: Number(i.quantity), unitPrice: Number(i.unitPrice), lineTotal: Number(i.lineTotal) }))
        };
        try {
            if (order) {
                await api.put(`/PurchaseOrder/${order.id ?? order.Id}`, { ...payload, id: order.id ?? order.Id });
                toast.success('Purchase order updated');
            } else {
                await api.post('/PurchaseOrder', payload);
                toast.success('Purchase order created');
            }
            onSaved();
        } catch (err) {
            console.error('Save PO failed', err);
            const msg = err.response?.data?.message || err.response?.data || err.message || 'Save failed';
            // map validationproblem
            if (err.response?.status === 400 && err.response?.data?.errors) {
                const apiErrors = err.response.data.errors;
                const mapped = {};
                for (const k in apiErrors) mapped[k] = apiErrors[k].join(', ');
                setErrors(mapped);
            }
            toast.error(msg);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm">Supplier</label>
                    <SupplierSelect value={model.supplierId} onChange={(v) => setModel(prev => ({ ...prev, supplierId: v }))} className="w-full border p-2 rounded" />
                    {errors.supplierId && <div className="text-red-600 text-sm">{errors.supplierId}</div>}
                </div>
                <div>
                    <label className="block text-sm">Required Date</label>
                    <input type="date" name="requiredDate" value={model.requiredDate || ''} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div className="col-span-2">
                    <label className="block text-sm">Shipping Address</label>
                    <input name="shippingAddress" value={model.shippingAddress} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>

                <div className="col-span-2">
                    <h4 className="font-semibold mb-2">Items</h4>
                    {errors.items && <div className="text-red-600 text-sm mb-2">{errors.items}</div>}
                    {model.items.map((it, idx) => (
                        <div key={idx} className="grid grid-cols-6 gap-2 items-end mb-2">
                            <div className="col-span-2">
                                <label className="text-sm">Product</label>
                                <AsyncSelect
                                    cacheOptions
                                    defaultOptions
                                    loadOptions={loadProductOptions}
                                    value={it.productId ? { value: it.productId, label: it.productLabel || '' } : null}
                                    onChange={(opt) => setProductForItem(idx, opt)}
                                    placeholder="Search product..."
                                />
                                {errors[`items.${idx}.productId`] && <div className="text-red-600 text-sm">{errors[`items.${idx}.productId`]}</div>}
                            </div>
                            <div>
                                <label className="text-sm">Qty</label>
                                <input type="number" value={it.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} className="w-full border p-2 rounded" />
                                {errors[`items.${idx}.quantity`] && <div className="text-red-600 text-sm">{errors[`items.${idx}.quantity`]}</div>}
                            </div>
                            <div>
                                <label className="text-sm">Unit Price</label>
                                <input type="number" step="0.01" value={it.unitPrice} onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)} className="w-full border p-2 rounded" />
                            </div>
                            <div>
                                <label className="text-sm">Line Total</label>
                                <div className="border p-2 rounded">{(it.lineTotal || 0).toFixed(2)}</div>
                            </div>
                            <div className="col-span-1 text-right">
                                <button type="button" onClick={() => removeItem(idx)} className="text-red-600">Remove</button>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addItem} className="text-blue-600">Add item</button>
                </div>

                <div className="col-span-2">
                    <label className="block text-sm">Notes</label>
                    <textarea name="notes" value={model.notes} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
            </div>
            <div className="mt-4 flex gap-2">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
                <button type="button" onClick={onCancel} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
            </div>
        </form>
    );
}
