import React from 'react';

export default function Dashboard() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow">Total Sales: <strong>₱0.00</strong></div>
        <div className="p-4 bg-white rounded shadow">Open POs: <strong>0</strong></div>
        <div className="p-4 bg-white rounded shadow">Active Employees: <strong>0</strong></div>
      </div>
    </div>
  );
}
