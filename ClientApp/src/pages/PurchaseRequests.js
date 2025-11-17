import React, { useEffect, useState } from 'react';
import api from '../api';
import PurchaseRequestForm from './PurchaseRequestForm';
import { useToast } from '../components/ToastProvider';
import { getUserRole } from '../utils/auth';

export default function PurchaseRequests() {
    const toast = useToast();
    const [prs, setPrs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editing, setEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [suppliers, setSuppliers] = useState([]);
    const [convertingPrId, setConvertingPrId] = useState(null);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    const role = getUserRole(localStorage.getItem('erp_token'));
    const canApprove = role === 'Purchase' || role === 'Admin';

    useEffect(() => { fetchPRs(); fetchSuppliers(); }, []);

    const fetchPRs = async () => {
        try { setLoading(true); const res = await api.get('/PurchaseRequest'); setPrs(res.data || []); setError(null); } catch (err) { console.error(err); setError('Failed to load'); toast.error(err.response?.data?.message || err.message || 'Failed to load PRs'); } finally { setLoading(false); }
    };

    const fetchSuppliers = async () => {
        try {
            const res = await api.get('/Supplier');
            const data = res.data && (res.data.items || res.data.Items) ? (res.data.items || res.data.Items) : res.data;
            setSuppliers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load suppliers', err);
            setSuppliers([]);
        }
    };

    const handleCreate = () => { setEditing(null); setShowForm(true); };
    const handleEdit = (p) => { setEditing(p); setShowForm(true); };
    const handleSubmitPR = async (id) => { try { await api.post(`/PurchaseRequest/${id}/submit`); toast.success('Purchase request submitted'); await fetchPRs(); } catch (err) { toast.error(err.response?.data?.message || err.message || 'Submit failed'); } };

    const handleApprove = async (id) => {
        if (!canApprove) { toast.error('You are not authorized to approve'); return; }
        try {
            await api.post(`/PurchaseRequest/${id}/approve`, {});
            toast.success('Purchase request approved');
            await fetchPRs();
        } catch (err) {
            console.error('Approve failed', err);
            toast.error(err.response?.data?.message || err.message || 'Approve failed');
        }
    };

    const handleReject = async (id) => {
        if (!canApprove) { toast.error('You are not authorized to reject'); return; }
        const reason = window.prompt('Enter rejection reason');
        if (!reason) return;
        try {
            await api.post(`/PurchaseRequest/${id}/reject`, { reason, notes: '' });
            toast.success('Purchase request rejected');
            await fetchPRs();
        } catch (err) {
            console.error('Reject failed', err);
            toast.error(err.response?.data?.message || err.message || 'Reject failed');
        }
    };

    // New: start convert UI
    const startConvert = (pr) => {
        setConvertingPrId(pr.id);
        setSelectedSupplier(pr.supplierId ?? (suppliers.length > 0 ? suppliers[0].id : null));
    };

    const cancelConvert = () => {
        setConvertingPrId(null);
        setSelectedSupplier(null);
    };

    const confirmConvert = async (pr) => {
        if (!selectedSupplier) { toast.error('Please select a supplier'); return; }
        // map items and validate productId presence
        const items = (pr.items || []).map(it => ({ productId: it.productId, quantity: it.quantity, unitPrice: it.estimatedPrice || 0 }));

        // Validate on client: every item must have a productId
        const invalidIndex = items.findIndex(i => !i.productId || i.productId <= 0);
        if (invalidIndex !== -1) {
            toast.error(`PR item #${invalidIndex + 1} is missing a valid product. Please edit the PR and select a product for that item.`);
            return;
        }

        const payload = { supplierId: Number(selectedSupplier), items };

        try {
            const res = await api.post(`/PurchaseRequest/${pr.id}/convert-to-po`, payload);
            toast.success('Converted to PO');
            setConvertingPrId(null);
            setSelectedSupplier(null);
            await fetchPRs();
            window.location.href = '/purchase-orders';
        } catch (err) {
            console.error('Convert to PO failed', err);
            // Prefer detailed server validation messages
            const resp = err.response?.data;
            if (err.response?.status === 400) {
                // Handle ValidationProblemDetails structure
                if (resp?.errors) {
                    // collect messages
                    const messages = [];
                    for (const key in resp.errors) {
                        messages.push(`${key}: ${resp.errors[key].join ? resp.errors[key].join(', ') : resp.errors[key]}`);
                    }
                    toast.error(messages.join('; '));
                } else if (resp?.message) {
                    toast.error(resp.message);
                } else {
                    toast.error('Validation failed. Please check the data.');
                }
            } else {
                toast.error(resp?.message || err.message || 'Convert to PO failed');
            }
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700">{error}</div>;

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold">Purchase Requests</h2>
                    <p className="text-gray-600">Create and manage PRs</p>
                </div>
                <div>
                    <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded">New PR</button>
                </div>
            </div>

            {showForm && <div className="mb-6"><PurchaseRequestForm pr={editing} onSaved={() => { setShowForm(false); fetchPRs(); }} onCancel={() => setShowForm(false)} /></div>}

            <div className="bg-white rounded-lg shadow overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PR#</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {prs.length === 0 ? <tr><td colSpan="5" className="p-4 text-center text-gray-500">No PRs</td></tr> : prs.map(pr => (
                            <tr key={pr.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">{pr.requestNumber}</td>
                                <td className="px-6 py-4">{new Date(pr.requestDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4 break-words max-w-md">{pr.notes}</td>
                                <td className="px-6 py-4">{pr.status}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleEdit(pr)} className="text-blue-600 mr-2">Edit</button>
                                    {pr.status === 'Draft' && <button onClick={() => handleSubmitPR(pr.id)} className="text-green-600 mr-2">Submit</button>}
                                    {pr.status === 'PendingApproval' && canApprove && (
                                        <>
                                            <button onClick={() => handleApprove(pr.id)} className="text-indigo-600 mr-2">Approve</button>
                                            <button onClick={() => handleReject(pr.id)} className="text-red-600 mr-2">Reject</button>
                                        </>
                                    )}
                                    {pr.status === 'Approved' && canApprove && (
                                        convertingPrId === pr.id ? (
                                            <span className="inline-flex items-center gap-2">
                                                <select value={selectedSupplier ?? ''} onChange={e => setSelectedSupplier(Number(e.target.value))} className="border p-1 rounded">
                                                    <option value="">Select supplier</option>
                                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplierName || s.supplierName}</option>)}
                                                </select>
                                                <button onClick={() => confirmConvert(pr)} className="text-purple-600 mr-2">Confirm</button>
                                                <button onClick={cancelConvert} className="text-gray-600">Cancel</button>
                                            </span>
                                        ) : (
                                            <button onClick={() => startConvert(pr)} className="text-purple-600 mr-2">Convert to PO</button>
                                        )
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
