import React, { useEffect, useState } from 'react';
import api from '../api';
import CanvassingForm from './CanvassingForm';

export default function Canvassings() {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => { fetchList(); }, []);
    const fetchList = async () => { try { setLoading(true); const res = await api.get('/Canvassing'); setList(res.data || []); } catch (err) { console.error(err); } finally { setLoading(false); } };

    if (loading) return <div className="flex justify-center items-center h-64">Loading canvassings...</div>;

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold">Canvassings</h2>
                    <p className="text-gray-600">Collect supplier quotes</p>
                </div>
                <div>
                    <button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-blue-600 text-white px-4 py-2 rounded">New</button>
                </div>
            </div>

            {showForm && <div className="mb-6"><CanvassingForm canvassing={editing} onSaved={() => { setShowForm(false); fetchList(); }} onCancel={() => setShowForm(false)} /></div>}

            <div className="bg-white rounded-lg shadow overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">CNV#</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.length === 0 ? <tr><td colSpan="4" className="p-4 text-center">No canvassings</td></tr> : list.map(c => (
                            <tr key={c.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">{c.canvassingNumber}</td>
                                <td className="px-6 py-4">{c.canvassingDate ? new Date(c.canvassingDate).toLocaleDateString() : ''}</td>
                                <td className="px-6 py-4">{c.status}</td>
                                <td className="px-6 py-4 text-right">
                                    {c.status === 'InProgress' && <button onClick={() => { setEditing(c); setShowForm(true); }} className="text-blue-600 mr-2">Edit</button>}
                                    {c.status === 'InProgress' && <button onClick={async () => { if (window.confirm('Mark completed?')) { await api.post(`/Canvassing/${c.id}/select-supplier`, { supplierId: c.selectedSupplierId || 0 }); await fetchList(); } }} className="text-green-600">Complete</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
