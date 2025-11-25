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

    // Calculate stats
    const totalReceipts = list.length;
    const draftCount = list.filter(g => g.status === 'Draft').length;
    const approvedCount = list.filter(g => g.status === 'Approved').length;
    const pendingCount = list.filter(g => g.status === 'Pending').length;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-orange-600 to-amber-800 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center">
                            <span className="text-4xl mr-3">📥</span>
                            Goods Receipts
                        </h1>
                        <p className="text-orange-100">Record and manage received goods</p>
                    </div>
                    <div className="hidden md:flex items-center space-x-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold">{totalReceipts}</div>
                            <div className="text-sm text-orange-200">Total Receipts</div>
                        </div>
                        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <span className="text-3xl">📦</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-4 rounded-xl shadow-md">
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center font-medium"
                    >
                        <span className="text-lg mr-2">+</span>
                        New Goods Receipt
                    </button>
                    <button
                        onClick={fetchList}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center font-medium"
                    >
                        <span className="text-lg mr-2">🔄</span>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div className="flex items-center">
                                <span className="text-2xl mr-3">📥</span>
                                <h2 className="text-xl font-semibold text-gray-800">Create New Goods Receipt</h2>
                            </div>
                            <button
                                onClick={() => setShowForm(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <GoodsReceiptForm
                                onSaved={() => { setShowForm(false); fetchList(); }}
                                onCancel={() => setShowForm(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Draft Receipts</div>
                            <div className="text-3xl font-bold text-gray-900">{draftCount}</div>
                            <div className="text-sm text-yellow-600 font-medium">Awaiting approval</div>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📝</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Approved</div>
                            <div className="text-3xl font-bold text-gray-900">{approvedCount}</div>
                            <div className="text-sm text-green-600 font-medium">Processed receipts</div>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">✅</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Total Receipts</div>
                            <div className="text-3xl font-bold text-gray-900">{totalReceipts}</div>
                            <div className="text-sm text-blue-600 font-medium">All goods receipts</div>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📦</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Goods Receipts Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <span className="text-2xl mr-2">📥</span>
                        Goods Receipts
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    GR Number
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    PO Reference
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Receipt Date
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {list.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-4 sm:px-6 py-12 text-center">
                                        <div className="text-6xl mb-4">📦</div>
                                        <div className="text-xl font-medium text-gray-900 mb-2">No goods receipts found</div>
                                        <div className="text-gray-500 mb-4">
                                            Goods receipts will appear here once recorded
                                        </div>
                                        <button
                                            onClick={() => setShowForm(true)}
                                            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                                        >
                                            Create First Receipt
                                        </button>
                                    </td>
                                </tr>
                            ) : list.map(g => (
                                <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {g.grNumber || g.GRNumber || `GR-${g.id}`}
                                        </div>
                                        <div className="text-xs text-gray-500">Receipt ID</div>
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {g.purchaseOrder?.poNumber || g.purchaseOrderId || 'N/A'}
                                        </div>
                                        <div className="text-xs text-gray-500">Purchase Order</div>
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {g.receiptDate ? new Date(g.receiptDate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            }) : 'N/A'}
                                        </div>
                                        <div className="text-xs text-gray-500">Receipt date</div>
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            g.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                                            g.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                            g.status === 'Pending' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                                g.status === 'Draft' ? 'bg-yellow-400' :
                                                g.status === 'Approved' ? 'bg-green-400' :
                                                g.status === 'Pending' ? 'bg-blue-400' :
                                                'bg-gray-400'
                                            }`}></span>
                                            {g.status}
                                        </span>
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-wrap gap-2">
                                            {g.status === 'Draft' && (
                                                <button
                                                    onClick={() => approve(g.id)}
                                                    className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                                                >
                                                    Approve
                                                </button>
                                            )}
                                            <button className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors">
                                                View Details
                                            </button>
                                            <button className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                                                Edit
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
