import React, { useEffect, useState } from 'react';
import api from '../api';
import PurchaseRequestForm from './PurchaseRequestForm';

export default function PurchaseRequests() {
    const [prs, setPrs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editing, setEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => { fetchPRs(); }, []);

    const fetchPRs = async () => {
        try { setLoading(true); const res = await api.get('/PurchaseRequest'); setPrs(res.data || []); setError(null); } catch (err) { console.error(err); setError('Failed to load'); } finally { setLoading(false); }
    };

    const handleCreate = () => { setEditing(null); setShowForm(true); };
    const handleEdit = (p) => { setEditing(p); setShowForm(true); };
    const handleSubmitPR = async (id) => { try { await api.post(`/PurchaseRequest/${id}/submit`); await fetchPRs(); } catch (err) { alert('Submit failed'); } };

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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {prs.length === 0 ? <tr><td colSpan="4" className="p-4 text-center text-gray-500">No PRs</td></tr> : prs.map(pr => (
                            <tr key={pr.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">{pr.requestNumber}</td>
                                <td className="px-6 py-4">{new Date(pr.requestDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4">{pr.status}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleEdit(pr)} className="text-blue-600 mr-2">Edit</button>
                                    {pr.status === 'Draft' && <button onClick={() => handleSubmitPR(pr.id)} className="text-green-600">Submit</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
