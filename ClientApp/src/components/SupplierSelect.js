import React, { useEffect, useState } from 'react';
import api from '../api';

export default function SupplierSelect({ value, onChange, placeholder = '-- Select Supplier --', className = '' }) {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const res = await api.get('/Supplier');
                const data = res.data && (res.data.items || res.data.Items) ? (res.data.items || res.data.Items) : res.data || [];
                if (mounted) setSuppliers(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Failed to load suppliers', err);
                if (mounted) setSuppliers([]);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, []);

    return (
        <select
            className={className}
            value={value ?? ''}
            onChange={e => onChange && onChange(e.target.value ? Number(e.target.value) : null)}
        >
            <option value="">{placeholder}</option>
            {suppliers.map(s => (
                <option key={s.id ?? s.Id} value={s.id ?? s.Id}>{s.supplierName || s.SupplierName || s.name || s.Name}</option>
            ))}
        </select>
    );
}
