import React, { useEffect, useState } from 'react';
import api from '../api';

export default function Accounting() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const response = await api.get('/Accounting');
            setExpenses(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching expenses:', err);
            setError('Failed to load expenses');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-600">Loading expenses...</div>
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

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const averageExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;
    const recentExpenses = expenses.filter(exp => {
        const expenseDate = new Date(exp.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return expenseDate >= thirtyDaysAgo;
    }).length;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-green-800 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center">
                            <span className="text-4xl mr-3">💰</span>
                            Accounting
                        </h1>
                        <p className="text-emerald-100">Financial records and expense management</p>
                    </div>
                    <div className="hidden md:flex items-center space-x-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold">{expenses.length}</div>
                            <div className="text-sm text-emerald-200">Total Expenses</div>
                        </div>
                        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <span className="text-3xl">📊</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-emerald-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Total Expenses</div>
                            <div className="text-3xl font-bold text-gray-900">
                                ₱{totalExpenses.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-sm text-emerald-600 font-medium">All time spending</div>
                        </div>
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">💰</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Average Expense</div>
                            <div className="text-3xl font-bold text-gray-900">
                                ₱{averageExpense.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-sm text-blue-600 font-medium">Per transaction</div>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📈</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">Recent Expenses</div>
                            <div className="text-3xl font-bold text-gray-900">{recentExpenses}</div>
                            <div className="text-sm text-orange-600 font-medium">Last 30 days</div>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📅</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expenses Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <span className="text-2xl mr-2">💰</span>
                        Expense Records
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Expense ID
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Category
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {expenses.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-4 sm:px-6 py-12 text-center">
                                        <div className="text-6xl mb-4">💰</div>
                                        <div className="text-xl font-medium text-gray-900 mb-2">No expenses found</div>
                                        <div className="text-gray-500 mb-4">
                                            Expense records will appear here once added
                                        </div>
                                        <button
                                            onClick={fetchExpenses}
                                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                                        >
                                            Refresh Data
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                expenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">EXP-{expense.id}</div>
                                            <div className="text-xs text-gray-500">Expense ID</div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                                {expense.description || 'N/A'}
                                            </div>
                                            <div className="text-xs text-gray-500">Description</div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {new Date(expense.date).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                            <div className="text-xs text-gray-500">Expense date</div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-lg font-bold text-emerald-600">
                                                ₱{expense.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                            </div>
                                            <div className="text-xs text-gray-500">Amount</div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-1.5"></span>
                                                Business
                                            </span>
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
