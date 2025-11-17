import React, { useEffect, useState } from 'react';
import api from '../api';
import { useToast } from '../components/ToastProvider';

export default function GoodsReceiptForm({ gr, onSaved, onCancel }) {
    const toast = useToast();
    const [model, setModel] = useState({
        companyId: 1,
        purchaseOrderId: null,
        warehouseId: null,
        deliveryNote: '',
        items: []
    });
    const [availablePOs, setAvailablePOs] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loadingPOs, setLoadingPOs] = useState(true);

    useEffect(() => {
        fetchPOs();
        fetchWarehouses();
    }, []);

    const fetchWarehouses = async () => {
        try {
            const res = await api.get('/Warehouse');
            const data = res.data && (res.data.items || res.data.Items) ? (res.data.items || res.data.Items) : res.data;
            setWarehouses(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching warehouses', err);
            setWarehouses([]);
        }
    };

    const fetchPOs = async () => {
        try {
            setLoadingPOs(true);
            const res = await api.get('/PurchaseOrder', { params: { status: 'Confirmed' } });
            const data = res.data && (res.data.items || res.data.Items) ? (res.data.items || res.data.Items) : res.data;
            setAvailablePOs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching POs', err);
            toast.error(err.response?.data?.message || err.message || 'Failed to load purchase orders');
            setAvailablePOs([]);
        } finally {
            setLoadingPOs(false);
        }
    };

    const onSelectPo = async (poId) => {
        if (!poId) {
            setModel(prev => ({ ...prev, purchaseOrderId: null, items: [] }));
            return;
        }
        try {
            const res = await api.get(`/PurchaseOrder/${poId}`);
            const po = res.data;
            const items = (po.items || []).map(i => ({
                purchaseOrderItemId: i.id,
                productId: i.productId,
                productLabel: i.product?.name || i.Product?.Name || i.productName || i.ProductName || i.description || '',
                orderedQuantity: i.quantity,
                receivedQuantity: i.quantity,
                rejectedQuantity: 0,
                unitPrice: i.unitPrice
            }));
            setModel(prev => ({ ...prev, purchaseOrderId: poId, items }));
        } catch (err) {
            console.error('Error loading PO', err);
            toast.error(err.response?.data?.message || err.message || 'Failed to load purchase order items');
        }
    };

    const handleItemChange = (idx, field, value) => {
        const items = [...model.items];
        const numericFields = ['receivedQuantity', 'rejectedQuantity', 'unitPrice', 'orderedQuantity'];
        items[idx][field] = numericFields.includes(field) ? (value === '' ? '' : Number(value)) : value;
        setModel(prev => ({ ...prev, items }));
    };

    function validate() {
        if (!model.purchaseOrderId) return 'Select purchase order';
        if (!model.warehouseId) return 'Warehouse is required';
        if (!model.items || model.items.length === 0) return 'No items to receive';
        for (const it of model.items) {
            if (it.receivedQuantity == null || Number(it.receivedQuantity) < 0) return 'Received quantity must be zero or greater';
            if (Number(it.receivedQuantity) > Number(it.orderedQuantity)) return `Received cannot exceed ordered for product ${it.productLabel || it.productId}`;
        }
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const v = validate();
        if (v) {
            toast.error(v);
            return;
        }

        try {
            const payload = {
                companyId: model.companyId,
                purchaseOrderId: model.purchaseOrderId,
                warehouseId: model.warehouseId,
                deliveryNote: model.deliveryNote,
                items: model.items.map(i => ({ purchaseOrderItemId: i.purchaseOrderItemId, productId: i.productId, orderedQuantity: Number(i.orderedQuantity), receivedQuantity: Number(i.receivedQuantity), rejectedQuantity: Number(i.rejectedQuantity), unitPrice: Number(i.unitPrice) }))
            };

            await api.post('/GoodsReceipt', payload);
            toast.success('Goods receipt created');
            onSaved();
        } catch (err) {
            console.error('Create GR failed', err);
            const msg = err.response?.data?.message || err.response?.data || err.message || 'Create GR failed';
            toast.error(msg);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm">Purchase Order</label>
                    <select className="w-full border p-2 rounded" value={model.purchaseOrderId ?? ''} onChange={e => onSelectPo(e.target.value ? Number(e.target.value) : null)}>
                        <option value="">-- Select PO --</option>
                        {availablePOs.map(po => (
                            <option key={po.id} value={po.id}>{(po.poNumber || po.PONumber || `PO-${po.id}`)} - {(po.supplier?.supplierName || po.supplier?.suppliername || po.supplierId)}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm">Warehouse</label>
                    <select className="w-full border p-2 rounded" value={model.warehouseId ?? ''} onChange={e => setModel(prev => ({ ...prev, warehouseId: e.target.value ? Number(e.target.value) : null }))}>
                        <option value="">-- Select Warehouse --</option>
                        {warehouses.map(w => <option key={w.id ?? w.Id} value={w.id ?? w.Id}>{w.name || w.Name || w.warehouseName || w.WarehouseName}</option>)}
                    </select>
                </div>
                <div className="col-span-2">
                    <label className="block text-sm">Delivery Note</label>
                    <input className="w-full border p-2 rounded" value={model.deliveryNote} onChange={e => setModel(prev => ({ ...prev, deliveryNote: e.target.value }))} />
                </div>

                <div className="col-span-2">
                    <h4 className="font-semibold mb-2">Items</h4>
                    {model.items.length === 0 && <div className="text-sm text-gray-500">Select a PO to load items</div>}
                    {model.items.map((it, idx) => (
                        <div key={idx} className="grid grid-cols-6 gap-2 items-end mb-2">
                            <div className="col-span-2">
                                <label className="text-sm">Product</label>
                                <div className="border p-2 rounded">{it.productLabel || it.productId}</div>
                            </div>
                            <div>
                                <label className="text-sm">Ordered</label>
                                <input type="number" className="w-full border p-2 rounded" value={it.orderedQuantity} onChange={e => handleItemChange(idx, 'orderedQuantity', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm">Received</label>
                                <input type="number" min="0" className="w-full border p-2 rounded" value={it.receivedQuantity} onChange={e => handleItemChange(idx, 'receivedQuantity', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm">Rejected</label>
                                <input type="number" min="0" className="w-full border p-2 rounded" value={it.rejectedQuantity} onChange={e => handleItemChange(idx, 'rejectedQuantity', e.target.value)} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-4 flex gap-2">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Create GR</button>
                <button type="button" onClick={onCancel} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
            </div>
        </form>
    );
}
