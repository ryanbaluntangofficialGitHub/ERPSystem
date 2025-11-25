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
        <div className="space-y-8">
            {/* Dashboard Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
                        <p className="text-blue-100">Welcome back! Here's your business at a glance.</p>
                    </div>
                    <div className="hidden md:flex items-center space-x-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold">{new Date().toLocaleDateString()}</div>
                            <div className="text-sm text-blue-200">Today</div>
                        </div>
                        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <span className="text-3xl">📊</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Products</div>
                            <div className="text-3xl font-bold text-gray-900">{productsTotal}</div>
                            <div className="text-sm text-green-600 font-medium">Active: {productsActive}</div>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📦</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Warehouses</div>
                            <div className="text-3xl font-bold text-gray-900">{warehousesTotal}</div>
                            <div className="text-sm text-blue-600 font-medium">Active: {warehousesActive}</div>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">🏭</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Purchase Requests</div>
                            <div className="text-3xl font-bold text-gray-900">{prsPending}</div>
                            <div className="text-sm text-yellow-600 font-medium">Pending Approval</div>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📝</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Purchase Orders</div>
                            <div className="text-3xl font-bold text-gray-900">{poDraft}</div>
                            <div className="text-sm text-purple-600 font-medium">Draft / Approved: {poApproved}</div>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">🛒</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analytics & Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                            <span className="text-2xl mr-2">📈</span>
                            Sales Trend (Last 6 months)
                        </h3>
                        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                            View Details →
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <div className="flex items-end gap-3 h-48 min-w-max">
                            {salesTrend.map(t => (
                                <div key={t.month} className="flex-1 flex flex-col items-center min-w-16 group">
                                    <div
                                        className="bg-gradient-to-t from-indigo-500 to-indigo-400 w-full rounded-t-lg shadow-sm group-hover:from-indigo-600 group-hover:to-indigo-500 transition-colors duration-200"
                                        style={{ height: `${Math.max(8, (t.count / maxTrendCount) * 100)}%` }}
                                        title={`${t.month}: ${t.count} sales`}
                                    />
                                    <div className="text-xs mt-3 font-medium text-gray-600">{t.month}</div>
                                    <div className="text-xs text-gray-500">{t.count}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                            <span className="text-2xl mr-2">📋</span>
                            Purchase Order Status
                        </h3>
                        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                            View All →
                        </button>
                    </div>
                    <div className="space-y-3">
                        {poStatusCounts.map(s => (
                            <div key={s.status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex items-center">
                                    <div className={`w-3 h-3 rounded-full mr-3 ${
                                        s.status === 'Draft' ? 'bg-yellow-400' :
                                        s.status === 'Approved' ? 'bg-green-400' :
                                        s.status === 'Pending' ? 'bg-blue-400' :
                                        'bg-gray-400'
                                    }`}></div>
                                    <span className="font-medium text-gray-700">{s.status}</span>
                                </div>
                                <span className="text-lg font-bold text-gray-900">{s.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="text-2xl mr-2">⚡</span>
                    Quick Actions
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group">
                        <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📦</span>
                        <span className="text-sm font-medium text-blue-700">New Product</span>
                    </button>
                    <button className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group">
                        <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">🛒</span>
                        <span className="text-sm font-medium text-green-700">Purchase Request</span>
                    </button>
                    <button className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group">
                        <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">👥</span>
                        <span className="text-sm font-medium text-purple-700">Add Employee</span>
                    </button>
                    <button className="flex flex-col items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group">
                        <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📊</span>
                        <span className="text-sm font-medium text-orange-700">View Reports</span>
                    </button>
                </div>
            </div>

            {/* Activity & Insights Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                            <span className="text-2xl mr-2">📋</span>
                            Recent Activity
                        </h3>
                        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                            View All →
                        </button>
                    </div>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {recentAudit.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <span className="text-4xl mb-2 block">📭</span>
                                No recent activity
                            </div>
                        ) : (
                            recentAudit.slice(0, 5).map(a => (
                                <div key={a.Id || a.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                        (a.Action || a.action) === 'CREATE' ? 'bg-green-400' :
                                        (a.Action || a.action) === 'UPDATE' ? 'bg-blue-400' :
                                        (a.Action || a.action) === 'DELETE' ? 'bg-red-400' :
                                        'bg-gray-400'
                                    }`}></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 truncate">
                                            {(a.Entity || a.entity)} #{a.EntityId || a.entityId}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                            {a.Action || a.action} by {a.UserId || a.userId}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(a.CreatedDate || a.createdDate).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                            <span className="text-2xl mr-2">📊</span>
                            Key Metrics
                        </h3>
                        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                            View Details →
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-green-800">Product Utilization</span>
                                <span className="text-lg font-bold text-green-700">{Math.round((productsActive / Math.max(1, productsTotal)) * 100)}%</span>
                            </div>
                            <div className="w-full bg-green-200 rounded-full h-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${(productsActive / Math.max(1, productsTotal)) * 100}%` }}
                                ></div>
                            </div>
                            <div className="text-xs text-green-600 mt-1">{productsActive} of {productsTotal} products active</div>
                        </div>

                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-blue-800">Warehouse Capacity</span>
                                <span className="text-lg font-bold text-blue-700">{Math.round((warehousesActive / Math.max(1, warehousesTotal)) * 100)}%</span>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-2">
                                <div
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${(warehousesActive / Math.max(1, warehousesTotal)) * 100}%` }}
                                ></div>
                            </div>
                            <div className="text-xs text-blue-600 mt-1">{warehousesActive} of {warehousesTotal} warehouses active</div>
                        </div>

                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-purple-800">Order Fulfillment</span>
                                <span className="text-lg font-bold text-purple-700">
                                    {poApproved > 0 ? Math.round((poApproved / (poDraft + poApproved)) * 100) : 0}%
                                </span>
                            </div>
                            <div className="w-full bg-purple-200 rounded-full h-2">
                                <div
                                    className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${poApproved > 0 ? (poApproved / (poDraft + poApproved)) * 100 : 0}%` }}
                                ></div>
                            </div>
                            <div className="text-xs text-purple-600 mt-1">{poApproved} approved of {poDraft + poApproved} total orders</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
