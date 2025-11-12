import React, { useEffect, useState } from 'react';
import api from '../api';
import GoodsReceiptForm from './GoodsReceiptForm';

export default function GoodsReceipts() {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => { fetchList(); }, []);
    const fetchList = async () => { try { setLoading(true); const res = await api.get('/GoodsReceipt'); setList(res.data || []); } catch (err) { console.error(err); } finally { setLoading(false); } };

    const approve = async (id) => { if (!window.confirm('Approve this GR?')) return; try { await api.post(`/GoodsReceipt/${id}/approve`); await fetchList(); } catch (err) { alert('Approve failed'); } };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold">Goods Receipts</h2>
                    <p className="text-gray-600">Record received goods</p>
                </div>
                <div>
                    <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded">New GR</button>
                </div>
            </div>

            {showForm && <div className="mb-6"><GoodsReceiptForm onSaved={() => { setShowForm(false); fetchList(); }} onCancel={() => setShowForm(false)} /></div>}

            <div className="bg-white rounded-lg shadow overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">GR#</th>
                            <th className="px-6 py-3">PO#</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.length === 0 ? <tr><td colSpan="5" className="p-4 text-center">No GRs</td></tr> : list.map(g => (
                            <tr key={g.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">{g.grNumber || g.GRNumber || `GR-${g.id}`}</td>
                                <td className="px-6 py-4">{g.purchaseOrder?.poNumber || g.purchaseOrderId}</td>
                                <td className="px-6 py-4">{g.receiptDate ? new Date(g.receiptDate).toLocaleDateString() : ''}</td>
                                <td className="px-6 py-4">{g.status}</td>
                                <td className="px-6 py-4 text-right">
                                    {g.status === 'Draft' && <button onClick={() => approve(g.id)} className="text-green-600">Approve</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
