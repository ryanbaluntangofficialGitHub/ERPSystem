import React, { useEffect, useState } from 'react';
import api from '../api';

export default function GoodsReceiptForm({ gr, onSaved, onCancel }) {
    const [model, setModel] = useState({
        companyId: 1,
        purchaseOrderId: null,
        warehouseId: null,
        deliveryNote: '',
        items: []
    });
    const [availablePOs, setAvailablePOs] = useState([]);
    const [loadingPOs, setLoadingPOs] = useState(true);

    useEffect(() => {
        fetchPOs();
    }, []);

    const fetchPOs = async () => {
        try {
            setLoadingPOs(true);
            const res = await api.get('/PurchaseOrder', { params: { status: 'Confirmed' } });
            setAvailablePOs(res.data || []);
        } catch (err) {
            console.error('Error fetching POs', err);
            setAvailablePOs([]);
        } finally {
            setLoadingPOs(false);
        }
    };

    const onSelectPo = async (poId) => {
        if (!poId) return;
        try {
            const res = await api.get(`/PurchaseOrder/${poId}`);
            const po = res.data;
            const items = (po.items || []).map(i => ({
                purchaseOrderItemId: i.id,
                productId: i.productId,
                orderedQuantity: i.quantity,
                receivedQuantity: i.quantity,
                rejectedQuantity: 0,
                unitPrice: i.unitPrice
            }));
            setModel(prev => ({ ...prev, purchaseOrderId: poId, items }));
        } catch (err) {
            console.error('Error loading PO', err);
            alert('Failed to load purchase order items');
        }
    };

    const handleItemChange = (idx, field, value) => {
        const items = [...model.items];
        items[idx][field] = field === 'receivedQuantity' || field === 'rejectedQuantity' || field === 'unitPrice' || field === 'orderedQuantity' ? Number(value) : value;
        setModel(prev => ({ ...prev, items }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Basic validation
            if (!model.purchaseOrderId) return alert('Select purchase order');
            if (!model.items || model.items.length === 0) return alert('No items');

            const payload = {
                companyId: model.companyId,
                purchaseOrderId: model.purchaseOrderId,
                warehouseId: model.warehouseId,
                deliveryNote: model.deliveryNote,
                items: model.items.map(i => ({ purchaseOrderItemId: i.purchaseOrderItemId, productId: i.productId, orderedQuantity: i.orderedQuantity, receivedQuantity: i.receivedQuantity, rejectedQuantity: i.rejectedQuantity, unitPrice: i.unitPrice }))
            };

            await api.post('/GoodsReceipt', payload);
            onSaved();
        } catch (err) {
            console.error('Create GR failed', err);
            alert('Create GR failed');
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
                            <option key={po.id} value={po.id}>{po.ponumber || po.PONumber || `PO-${po.id}`} - {po.supplier?.supplierName || po.supplier?.suppliername || po.supplierId}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm">Warehouse Id</label>
                    <input className="w-full border p-2 rounded" value={model.warehouseId ?? ''} onChange={e => setModel(prev => ({ ...prev, warehouseId: e.target.value ? Number(e.target.value) : null }))} />
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
                                <div className="border p-2 rounded">{it.productId}</div>
                            </div>
                            <div>
                                <label className="text-sm">Ordered</label>
                                <input className="w-full border p-2 rounded" value={it.orderedQuantity} onChange={e => handleItemChange(idx, 'orderedQuantity', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm">Received</label>
                                <input className="w-full border p-2 rounded" value={it.receivedQuantity} onChange={e => handleItemChange(idx, 'receivedQuantity', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm">Rejected</label>
                                <input className="w-full border p-2 rounded" value={it.rejectedQuantity} onChange={e => handleItemChange(idx, 'rejectedQuantity', e.target.value)} />
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
