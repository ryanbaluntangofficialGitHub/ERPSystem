import React, { useEffect, useState } from 'react';
import api from '../api';
import ProductForm from './ProductForm';

export default function Products() {
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
            await fetchProducts();
        } catch (err) {
            console.error('Delete failed', err);
            alert('Delete failed');
        }
    };

    const handleAdjust = async (id) => {
        const adj = parseInt(prompt('Enter stock adjustment (positive or negative):', '0') || '0', 10);
        if (isNaN(adj)) return alert('Invalid number');
        try {
            await api.post(`/Product/${id}/adjust`, { adjustment: adj });
            await fetchProducts();
        } catch (err) {
            console.error('Adjust failed', err);
            alert('Adjust failed');
        }
    };

    const onSaved = async () => {
        setShowForm(false);
        setEditing(null);
        await fetchProducts();
    };

    if (loading) return <div className="flex justify-center items-center h-64">Loading products...</div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700">{error}</div>;

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold">Products</h2>
                    <p className="text-gray-600">Manage product catalog and inventory</p>
                </div>
                <div>
                    <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded">New Product</button>
                </div>
            </div>

            {showForm && (
                <div className="mb-6">
                    <ProductForm product={editing} onSaved={onSaved} onCancel={() => { setShowForm(false); setEditing(null); }} />
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {products.length === 0 ? (
                            <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">No products found</td></tr>
                        ) : (
                            products.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium">{p.id}</td>
                                    <td className="px-6 py-4 text-sm">{p.productCode || p.productcode}</td>
                                    <td className="px-6 py-4 text-sm">{p.name}</td>
                                    <td className="px-6 py-4 text-sm">{p.quantity}</td>
                                    <td className="px-6 py-4 text-sm">?{(p.price || p.price).toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleEdit(p)} className="text-blue-600 mr-2">Edit</button>
                                        <button onClick={() => handleAdjust(p.id)} className="text-green-600 mr-2">Adjust</button>
                                        <button onClick={() => handleDelete(p.id)} className="text-red-600">Delete</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
