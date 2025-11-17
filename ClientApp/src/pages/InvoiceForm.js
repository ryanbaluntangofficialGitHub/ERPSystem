import React, { useEffect, useState } from 'react';
import api from '../api';
import { useToast } from '../components/ToastProvider';
import ProductSelect from '../components/ProductSelect';
import SupplierSelect from '../components/SupplierSelect';
import POSelect from '../components/POSelect';

export default function InvoiceForm({ invoice, onSaved, onCancel }) {
    const toast = useToast();
    const [model, setModel] = useState({ companyId:1, purchaseOrderId:null, supplierId:null, invoiceNumber:'', invoiceDate:null, totalAmount:0, items:[] });
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    // item modal
    const [isItemOpen, setIsItemOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [itemModel, setItemModel] = useState({ productId:null, productLabel:'', quantity:1, unitPrice:0, lineTotal:0 });

    useEffect(() => { fetchLookups(); if (invoice) setModel({ companyId:invoice.companyId || 1, purchaseOrderId:invoice.purchaseOrderId, supplierId:invoice.supplierId, invoiceNumber:invoice.invoiceNumber, invoiceDate:invoice.invoiceDate ? invoice.invoiceDate.split('T')[0] : null, totalAmount:invoice.totalAmount, items:(invoice.items||[]).map(i=>({ productId:i.productId, productLabel:i.product?.name || '', quantity:i.quantity, unitPrice:i.unitPrice, lineTotal:i.lineTotal })) }); }, [invoice]);

    const fetchLookups = async () => {
        try {
            const [poRes, sRes] = await Promise.all([api.get('/PurchaseOrder'), api.get('/Supplier')]);
            setPurchaseOrders(poRes.data || []);
            setSuppliers(sRes.data || []);
        } catch (err) {
            console.error('Lookup load failed', err);
            toast.error('Failed to load lookups');
        }
    };

    const onSelectPo = async (poId) => {
        if (!poId) { setModel(prev=>({ ...prev, purchaseOrderId:null, items:[], supplierId:null })); return; }
        try {
            const res = await api.get(`/PurchaseOrder/${poId}`);
            const po = res.data;
            const items = (po.items||[]).map(i=>({ productId:i.productId, productLabel:i.product?.name || '', quantity:i.quantity, unitPrice:i.unitPrice, lineTotal:i.lineTotal }));
            setModel(prev=>({ ...prev, purchaseOrderId:poId, items, supplierId:po.supplierId, totalAmount: po.totalAmount }));
        } catch (err) {
            console.error('Load PO failed', err);
            toast.error('Failed to load PO');
        }
    };

    const openItem = (index=null) => {
        if (index === null) {
            setItemModel({ productId:null, productLabel:'', quantity:1, unitPrice:0, lineTotal:0 });
            setEditingIndex(null);
        } else {
            const it = model.items[index];
            setItemModel({ productId: it.productId, productLabel: it.productLabel || '', quantity: it.quantity, unitPrice: it.unitPrice, lineTotal: it.lineTotal });
            setEditingIndex(index);
        }
        setIsItemOpen(true);
    };

    const saveItem = () => {
        if (!itemModel.productId) { toast.error('Please select a product'); return; }
        if (!itemModel.quantity || Number(itemModel.quantity) <= 0) { toast.error('Quantity must be > 0'); return; }
        const items = [...(model.items||[])];
        const it = { productId: itemModel.productId, productLabel: itemModel.productLabel, quantity: Number(itemModel.quantity), unitPrice: Number(itemModel.unitPrice), lineTotal: Number(itemModel.quantity) * Number(itemModel.unitPrice) };
        if (editingIndex === null) items.push(it); else items[editingIndex] = it;
        setModel(prev => ({ ...prev, items }));
        setIsItemOpen(false);
    };

    const removeItem = (i) => setModel(prev => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }));

    const handleChange = (e) => { const { name, value } = e.target; setModel(prev=>({ ...prev, [name]: value })); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (invoice) {
                await api.put(`/Invoice/${invoice.id ?? invoice.Id}`, { ...model, id: invoice.id ?? invoice.Id });
                toast.success('Invoice updated');
            } else {
                await api.post('/Invoice', model);
                toast.success('Invoice created');
            }
            onSaved();
        } catch (err) {
            console.error('Save invoice failed', err);
            const msg = err.response?.data?.message || err.response?.data || err.message || 'Save failed';
            toast.error(msg);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm">Purchase Order</label>
                    <POSelect value={model.purchaseOrderId} onChange={onSelectPo} />
                </div>
                <div>
                    <label className="block text-sm">Supplier</label>
                    <SupplierSelect value={model.supplierId} onChange={(v) => setModel(prev => ({ ...prev, supplierId: v }))} />
                </div>
                <div>
                    <label className="block text-sm">Invoice Number</label>
                    <input name="invoiceNumber" value={model.invoiceNumber} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label className="block text-sm">Invoice Date</label>
                    <input type="date" name="invoiceDate" value={model.invoiceDate ?? ''} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div className="col-span-2">
                    <label className="block text-sm">Items</label>
                    {(model.items||[]).map((it, idx) => (
                        <div key={idx} className="grid grid-cols-4 gap-2 mb-2">
                            <div>{it.productLabel || it.productId}</div>
                            <div>{it.quantity}</div>
                            <div>{it.unitPrice}</div>
                            <div>{it.lineTotal}</div>
                            <div className="col-span-4 text-right">
                                <button type="button" onClick={() => openItem(idx)} className="text-blue-600 mr-2">Edit</button>
                                <button type="button" onClick={() => removeItem(idx)} className="text-red-600">Remove</button>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={() => openItem(null)} className="text-blue-600">Add item</button>
                </div>
            </div>

            <div className="mt-4 flex gap-2">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
                <button type="button" onClick={onCancel} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
            </div>

            {isItemOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white p-4 rounded shadow-lg w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-2">Invoice Item</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm">Product</label>
                                <ProductSelect value={itemModel.productId ? { value: itemModel.productId, label: itemModel.productLabel } : null} onChange={(opt) => setItemModel(prev => ({ ...prev, productId: opt?.value ?? null, productLabel: opt?.label ?? '' }))} />
                            </div>
                            <div>
                                <label className="block text-sm">Quantity</label>
                                <input type="number" value={itemModel.quantity} onChange={e => setItemModel(prev => ({ ...prev, quantity: Number(e.target.value) }))} className="w-full border p-2 rounded" />
                            </div>
                            <div>
                                <label className="block text-sm">Unit Price</label>
                                <input type="number" step="0.01" value={itemModel.unitPrice} onChange={e => setItemModel(prev => ({ ...prev, unitPrice: Number(e.target.value) }))} className="w-full border p-2 rounded" />
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button type="button" onClick={saveItem} className="bg-blue-600 text-white px-3 py-1 rounded">Save item</button>
                            <button type="button" onClick={() => setIsItemOpen(false)} className="bg-gray-200 px-3 py-1 rounded">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
}
