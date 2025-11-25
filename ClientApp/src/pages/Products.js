import React, { useEffect, useState } from 'react';
import api from '../api';
import ProductForm from './ProductForm';
import { useToast } from '../components/ToastProvider';

export default function Products() {
    const toast = useToast();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editing, setEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await api.get('/Product');
            const data = res.data && (res.data.items || res.data.Items) ? (res.data.items || res.data.Items) : res.data;
            setProducts(data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching products', err);
            setError('Failed to load products');
            toast.error(err.response?.data?.message || err.message || 'Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditing(null);
        setShowForm(true);
    };

    const handleEdit = (p) => {
        setEditing(p);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this product?')) return;
        try {
            await api.delete(`/Product/${id}`);
            toast.success('Product deleted');
            await fetchProducts();
        } catch (err) {
            console.error('Delete failed', err);
            toast.error(err.response?.data?.message || err.message || 'Delete failed');
        }
    };

    const handleAdjust = async (id) => {
        const adj = parseInt(prompt('Enter stock adjustment (positive or negative):', '0') || '0', 10);
        if (isNaN(adj)) return toast.error('Invalid number');
        try {
            await api.post(`/Product/${id}/adjust`, { adjustment: adj });
            toast.success('Stock adjusted');
            await fetchProducts();
        } catch (err) {
            console.error('Adjust failed', err);
            toast.error(err.response?.data?.message || err.message || 'Adjust failed');
        }
    };

    const onSaved = async () => {
        setShowForm(false);
        setEditing(null);
        await fetchProducts();
    };

    if (loading) return <div className="flex justify-center items-center h-64">Loading products...</div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700">{error}</div>;

    // Calculate stats
    const totalProducts = products.length;
    const totalInventoryValue = products.reduce((sum, p) => sum + ((p.quantity || 0) * (p.price || 0)), 0);
    const lowStockProducts = products.filter(p => (p.quantity || 0) < 10).length;
    const outOfStockProducts = products.filter(p => (p.quantity || 0) === 0).length;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-violet-600 to-purple-800 text-white p-4 sm:p-6 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center">
                            <span className="text-3xl sm:text-4xl mr-3">🧩</span>
                            Products
                        </h1>
                        <p className="text-violet-100 text-sm sm:text-base">Manage product catalog and inventory levels</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold">{totalProducts}</div>
                            <div className="text-xs sm:text-sm text-violet-200">Total Products</div>
                        </div>
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <span className="text-2xl sm:text-3xl">📦</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-4 rounded-xl shadow-md">
                <div className="flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleCreate}
                            className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center font-medium"
                        >
                            <span className="text-lg mr-2">+</span>
                            New Product
                        </button>
                        <button
                            onClick={fetchProducts}
                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center font-medium"
                        >
                            <span className="text-lg mr-2">🔄</span>
                            Refresh
                        </button>
                        <button className="px-6 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center font-medium">
                            <span className="text-lg mr-2">📊</span>
                            Inventory Report
                        </button>
                    </div>
                    {showForm && (
                        <button
                            onClick={() => { setShowForm(false); setEditing(null); }}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                        >
                            Cancel Form
                        </button>
                    )}
                </div>
            </div>

            {/* Form Section */}
            {showForm && (
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-violet-500">
                    <ProductForm
                        product={editing}
                        onSaved={onSaved}
                        onCancel={() => { setShowForm(false); setEditing(null); }}
                    />
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-violet-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Total Products</div>
                            <div className="text-3xl font-bold text-gray-900">{totalProducts}</div>
                            <div className="text-sm text-violet-600 font-medium">In catalog</div>
                        </div>
                        <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">🧩</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Inventory Value</div>
                            <div className="text-3xl font-bold text-gray-900">
                                ₱{totalInventoryValue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-sm text-green-600 font-medium">Total worth</div>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">💰</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Low Stock Items</div>
                            <div className="text-3xl font-bold text-gray-900">{lowStockProducts}</div>
                            <div className="text-sm text-orange-600 font-medium">Need attention</div>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">⚠️</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Out of Stock</div>
                            <div className="text-3xl font-bold text-gray-900">{outOfStockProducts}</div>
                            <div className="text-sm text-red-600 font-medium">Critical items</div>
                        </div>
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">🚫</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <span className="text-2xl mr-2">🧩</span>
                        Product Catalog
                    </h3>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
                        <span className="ml-3 text-gray-600">Loading products...</span>
                    </div>
                ) : error ? (
                    <div className="p-6 text-center">
                        <div className="text-red-600 mb-4">{error}</div>
                        <button
                            onClick={fetchProducts}
                            className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product ID
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Code
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product Name
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Quantity
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Unit Price
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
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 sm:px-6 py-12 text-center">
                                            <div className="text-6xl mb-4">🧩</div>
                                            <div className="text-xl font-medium text-gray-900 mb-2">No products found</div>
                                            <div className="text-gray-500 mb-4">
                                                Start building your product catalog
                                            </div>
                                            <button
                                                onClick={handleCreate}
                                                className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors"
                                            >
                                                Add First Product
                                            </button>
                                        </td>
                                    </tr>
                                ) : (
                                    products.map(p => (
                                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">PROD-{p.id}</div>
                                                <div className="text-xs text-gray-500">Product ID</div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {p.productCode || p.productcode || 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-500">Product code</div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{p.name}</div>
                                                <div className="text-xs text-gray-500">Product name</div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <div className={`text-lg font-bold ${(p.quantity || 0) < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {p.quantity || 0}
                                                </div>
                                                <div className="text-xs text-gray-500">units in stock</div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <div className="text-lg font-bold text-blue-600">
                                                    ₱{(p.price || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                </div>
                                                <div className="text-xs text-gray-500">per unit</div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                {(p.quantity || 0) === 0 ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-1.5"></span>
                                                        Out of Stock
                                                    </span>
                                                ) : (p.quantity || 0) < 10 ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                        <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-1.5"></span>
                                                        Low Stock
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></span>
                                                        In Stock
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => handleEdit(p)}
                                                        className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleAdjust(p.id)}
                                                        className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                                                    >
                                                        Adjust Stock
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(p.id)}
                                                        className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
