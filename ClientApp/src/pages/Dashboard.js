import React, { useEffect, useState } from 'react';
import api from '../api';

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const normalize = (raw) => {
        if (!raw) return null;
        const r = raw;
        // helper to read either PascalCase or camelCase
        const pick = (obj, pascal, camel) => {
            if (!obj) return undefined;
            if (obj[pascal] !== undefined) return obj[pascal];
            if (obj[camel] !== undefined) return obj[camel];
            return undefined;
        };

        const Products = pick(r, 'Products', 'products') || {};
        const Warehouses = pick(r, 'Warehouses', 'warehouses') || {};
        const PurchaseRequests = pick(r, 'PurchaseRequests', 'purchaseRequests') || pick(r, 'PurchaseRequests', 'purchaserequests') || {};
        const PurchaseOrders = pick(r, 'PurchaseOrders', 'purchaseOrders') || pick(r, 'PurchaseOrders', 'purchaseorders') || {};
        const GoodsReceipts = pick(r, 'GoodsReceipts', 'goodsReceipts') || {};
        const SalesOrders = pick(r, 'SalesOrders', 'salesOrders') || pick(r, 'SalesOrders', 'salesorders') || {};
        const RecentAudit = pick(r, 'RecentAudit', 'recentAudit') || pick(r, 'RecentAudit', 'recentaudit') || [];

        // normalize nested fields
        const norm = {
            Products: {
                Total: Products.Total ?? Products.total ?? 0,
                Active: Products.Active ?? Products.active ?? 0
            },
            Warehouses: {
                Total: Warehouses.Total ?? Warehouses.total ?? 0,
                Active: Warehouses.Active ?? Warehouses.active ?? 0
            },
            PurchaseRequests: {
                PendingApproval: PurchaseRequests.PendingApproval ?? PurchaseRequests.pendingApproval ?? PurchaseRequests.pendingapproval ?? 0
            },
            PurchaseOrders: {
                Draft: PurchaseOrders.Draft ?? PurchaseOrders.draft ?? 0,
                Approved: PurchaseOrders.Approved ?? PurchaseOrders.approved ?? 0,
                StatusCounts: PurchaseOrders.StatusCounts ?? PurchaseOrders.statusCounts ?? PurchaseOrders.statuscounts ?? []
            },
            GoodsReceipts: {
                Pending: GoodsReceipts.Pending ?? GoodsReceipts.pending ?? 0
            },
            SalesOrders: {
                Total: SalesOrders.Total ?? SalesOrders.total ?? 0,
                Trend: SalesOrders.Trend ?? SalesOrders.trend ?? []
            },
            RecentAudit: RecentAudit
        };

        return norm;
    };

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get('/Analytics');
            const normalized = normalize(res.data);
            setData(normalized);
        } catch (err) {
            // Prefer server problem details when available
            console.error('Error loading analytics', err);
            const serverData = err.response?.data;
            console.error('Server response data:', serverData);
            const serverMsg = serverData?.detail || serverData?.message || serverData?.errors || null;
            setError(serverMsg ?? err.message ?? 'Failed to load analytics');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-gray-500">Loading dashboard...</div>
        </div>
    );

    if (error) return (
        <div className="p-4 bg-red-100 text-red-700 rounded">
            <div className="mb-2 font-semibold">Failed to load analytics</div>
            <div className="mb-3 whitespace-pre-wrap">{typeof error === 'object' ? JSON.stringify(error, null, 2) : error}</div>
            <div>
                <button onClick={fetchAnalytics} className="bg-blue-600 text-white px-3 py-1 rounded">Retry</button>
            </div>
        </div>
    );

    if (!data) return (
        <div className="p-4">
            <div className="mb-2">No analytics data available.</div>
            <button onClick={fetchAnalytics} className="bg-blue-600 text-white px-3 py-1 rounded">Reload</button>
        </div>
    );

    const productsTotal = data?.Products?.Total ?? 0;
    const productsActive = data?.Products?.Active ?? 0;
    const warehousesTotal = data?.Warehouses?.Total ?? 0;
    const warehousesActive = data?.Warehouses?.Active ?? 0;
    const prsPending = data?.PurchaseRequests?.PendingApproval ?? 0;
    const poDraft = data?.PurchaseOrders?.Draft ?? 0;
    const poApproved = data?.PurchaseOrders?.Approved ?? 0;
    const salesTrend = data?.SalesOrders?.Trend ?? [];
    const poStatusCounts = data?.PurchaseOrders?.StatusCounts ?? [];
    const recentAudit = data?.RecentAudit ?? [];

    const maxTrendCount = Math.max(...(salesTrend.map(x => x.count) || [0]), 1);

    return (
        <div>
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded shadow">
                    <div className="text-sm text-gray-500">Products</div>
                    <div className="text-2xl font-bold">{productsTotal}</div>
                    <div className="text-sm text-green-600">Active: {productsActive}</div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                    <div className="text-sm text-gray-500">Warehouses</div>
                    <div className="text-2xl font-bold">{warehousesTotal}</div>
                    <div className="text-sm text-green-600">Active: {warehousesActive}</div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                    <div className="text-sm text-gray-500">Purchase Requests</div>
                    <div className="text-2xl font-bold">{prsPending}</div>
                    <div className="text-sm text-gray-500">Pending Approval</div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                    <div className="text-sm text-gray-500">Purchase Orders</div>
                    <div className="text-2xl font-bold">{poDraft}</div>
                    <div className="text-sm text-gray-500">Draft / Approved: {poApproved}</div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-white p-4 rounded shadow">
                    <h3 className="font-semibold mb-2">Sales Trend (Last 6 months)</h3>
                    <div className="flex items-end gap-2 h-40">
                        {salesTrend.map(t => (
                            <div key={t.month} className="flex-1 flex flex-col items-center">
                                <div className="bg-indigo-500 w-full rounded-t" style={{ height: `${Math.max(4, (t.count / maxTrendCount) * 100)}%` }} />
                                <div className="text-xs mt-2">{t.month}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-4 rounded shadow">
                    <h3 className="font-semibold mb-2">PO Status</h3>
                    <ul className="text-sm">
                        {poStatusCounts.map(s => (
                            <li key={s.status} className="flex justify-between py-1 border-b">
                                <span>{s.status}</span>
                                <span className="font-medium">{s.count}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white p-4 rounded shadow">
                    <h3 className="font-semibold mb-2">Recent Audit Logs</h3>
                    <div className="overflow-auto max-h-64">
                        <table className="min-w-full text-left text-sm">
                            <thead className="text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="px-2 py-1">Time</th>
                                    <th className="px-2 py-1">User</th>
                                    <th className="px-2 py-1">Action</th>
                                    <th className="px-2 py-1">Entity</th>
                                    <th className="px-2 py-1">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentAudit.map(a => (
                                    <tr key={a.Id || a.id} className="border-t">
                                        <td className="px-2 py-1">{new Date(a.CreatedDate || a.createdDate).toLocaleString()}</td>
                                        <td className="px-2 py-1">{a.UserId || a.userId}</td>
                                        <td className="px-2 py-1">{a.Action || a.action}</td>
                                        <td className="px-2 py-1">{(a.Entity || a.entity)}#{a.EntityId || a.entityId}</td>
                                        <td className="px-2 py-1">{a.Details || a.details}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white p-4 rounded shadow">
                    <h3 className="font-semibold mb-2">Quick Charts</h3>
                    <div className="text-sm text-gray-500 mb-2">(Simple charts shown as bars)</div>
                    <div className="grid grid-cols-1 gap-2">
                        <div className="w-full bg-gray-100 rounded p-2">
                            <div className="text-xs text-gray-600">Products Active / Total</div>
                            <div className="relative h-6 bg-white rounded mt-2">
                                <div style={{ width: `${(productsActive / Math.max(1, productsTotal)) * 100}%` }} className="absolute left-0 top-0 h-full bg-green-500 rounded"></div>
                                <div className="absolute left-2 top-0 text-xs text-gray-800">{productsActive} / {productsTotal}</div>
                            </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded p-2">
                            <div className="text-xs text-gray-600">Warehouses Active / Total</div>
                            <div className="relative h-6 bg-white rounded mt-2">
                                <div style={{ width: `${(warehousesActive / Math.max(1, warehousesTotal)) * 100}%` }} className="absolute left-0 top-0 h-full bg-blue-500 rounded"></div>
                                <div className="absolute left-2 top-0 text-xs text-gray-800">{warehousesActive} / {warehousesTotal}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}