import React, { useEffect, useState } from 'react';
import api from '../api';

export default function Production() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/Production');
            setProducts(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-600">Loading products...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
            </div>
        );
    }

    const totalInventoryValue = products.reduce((sum, prod) => sum + (prod.quantity * prod.price), 0);

    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.quantity < 10).length;
    const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-slate-600 to-gray-800 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center">
                            <span className="text-4xl mr-3">🏭</span>
                            Production
                        </h1>
                        <p className="text-slate-100">Product inventory and manufacturing management</p>
                    </div>
                    <div className="hidden md:flex items-center space-x-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold">{totalProducts}</div>
                            <div className="text-sm text-slate-200">Total Products</div>
                        </div>
                        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <span className="text-3xl">⚙️</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-slate-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Total Products</div>
                            <div className="text-3xl font-bold text-gray-900">{totalProducts}</div>
                            <div className="text-sm text-slate-600 font-medium">In inventory</div>
                        </div>
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📦</span>
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
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-4 rounded-xl shadow-md">
                <div className="flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex flex-wrap gap-3">
                        <button className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center font-medium">
                            <span className="text-lg mr-2">+</span>
                            Add Product
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
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <span className="text-2xl mr-2">🏭</span>
                        Product Inventory
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product ID
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
                                    Total Value
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
                                        <div className="text-6xl mb-4">🏭</div>
                                        <div className="text-xl font-medium text-gray-900 mb-2">No products found</div>
                                        <div className="text-gray-500 mb-4">
                                            Products will appear here once added to inventory
                                        </div>
                                        <button
                                            onClick={fetchProducts}
                                            className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
                                        >
                                            Refresh Data
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">PROD-{product.id}</div>
                                            <div className="text-xs text-gray-500">Product ID</div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                            <div className="text-xs text-gray-500">Product name</div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className={`text-lg font-bold ${product.quantity < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                                                {product.quantity}
                                            </div>
                                            <div className="text-xs text-gray-500">units in stock</div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-lg font-bold text-blue-600">
                                                ₱{product.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                            </div>
                                            <div className="text-xs text-gray-500">per unit</div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-lg font-bold text-green-600">
                                                ₱{(product.quantity * product.price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                            </div>
                                            <div className="text-xs text-gray-500">inventory value</div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            {product.quantity < 10 ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-1.5"></span>
                                                    Low Stock
                                                </span>
                                            ) : product.quantity < 50 ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-1.5"></span>
                                                    Medium
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></span>
                                                    Good
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-wrap gap-2">
                                                <button className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors">
                                                    View
                                                </button>
                                                <button className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                                                    Edit
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
