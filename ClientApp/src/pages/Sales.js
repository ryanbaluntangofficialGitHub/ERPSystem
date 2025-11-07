import React, {useEffect, useState} from 'react';
import api from '../api';

export default function Sales(){
  const [orders, setOrders] = useState([]);
  useEffect(()=>{
    api.get('/Sales').then(r=>setOrders(r.data)).catch(()=>{});
  },[]);
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Sales Orders</h2>
      <div className="bg-white rounded shadow overflow-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr><th className="p-2 text-left">Order #</th><th className="p-2 text-left">Customer</th><th className="p-2 text-left">Date</th><th className="p-2 text-left">Total</th></tr>
          </thead>
          <tbody>
            {orders.length===0 ? <tr><td colSpan="4" className="p-4 text-center">No orders</td></tr> : orders.map(o=>(
              <tr key={o.id}><td className="p-2">{o.id}</td><td className="p-2">{o.customer}</td><td className="p-2">{new Date(o.date).toLocaleString()}</td><td className="p-2">{o.total}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
