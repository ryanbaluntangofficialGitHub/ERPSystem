import React, { useEffect, useState } from 'react';
import api from '../api';

export default function POSelect({ value, onChange, status = null, placeholder = '-- Select PO --', className = '' }) {
    const [pos, setPos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const res = await api.get('/PurchaseOrder', { params: status ? { status } : {} });
                const data = res.data && (res.data.items || res.data.Items) ? (res.data.items || res.data.Items) : res.data || [];
                if (mounted) setPos(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Failed to load POs', err);
                if (mounted) setPos([]);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [status]);

    return (
        <select className={className} value={value ?? ''} onChange={e => onChange && onChange(e.target.value ? Number(e.target.value) : null)}>
            <option value="">{placeholder}</option>
            {pos.map(p => (
                <option key={p.id ?? p.Id} value={p.id ?? p.Id}>{(p.poNumber || p.PONumber || `PO-${p.id ?? p.Id}`)} - {(p.supplier?.supplierName || p.supplierName || p.supplierId)}</option>
            ))}
        </select>
    );
}
