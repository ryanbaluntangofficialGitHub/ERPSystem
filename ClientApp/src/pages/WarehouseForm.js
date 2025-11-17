import React, { useEffect, useState } from 'react';
import api from '../api';
import { useToast } from '../components/ToastProvider';
import EmployeeQuickForm from '../components/EmployeeQuickForm';

export default function WarehouseForm({ warehouse, onSaved, onCancel }) {
    const toast = useToast();

    const [model, setModel] = useState({
        companyId: 1,
        warehouseCode: '',
        warehouseName: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        managerId: null,
        isActive: true
    });

    const [errors, setErrors] = useState({});
    const [employees, setEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [showAddManager, setShowAddManager] = useState(false);

    useEffect(() => {
        if (warehouse) {
            setModel({
                companyId: warehouse.companyId || warehouse.companyid || 1,
                warehouseCode: warehouse.warehouseCode || warehouse.warehousecode || '',
                warehouseName: warehouse.warehouseName || warehouse.warehousename || '',
                address: warehouse.address || '',
                city: warehouse.city || '',
                state: warehouse.state || '',
                country: warehouse.country || '',
                postalCode: warehouse.postalCode || warehouse.postalcode || '',
                managerId: warehouse.managerId || warehouse.managerid || null,
                isActive: warehouse.isActive ?? true
            });
        }

        // load employees for manager dropdown
        fetchEmployees();
    }, [warehouse]);

    const normalizeEmployeeArray = (data) => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.Items)) return data.Items;
        if (Array.isArray(data.items)) return data.items;
        // sometimes API returns object with root properties, try to map single object
        return [];
    };

    const fetchEmployees = async () => {
        try {
            setLoadingEmployees(true);
            // load a reasonable number - adjust API if needed
            const res = await api.get('/Employee?page=1&pageSize=200');
            const items = normalizeEmployeeArray(res.data);
            setEmployees(items);
        } catch (err) {
            console.error('Failed to load employees', err);
            setEmployees([]);
        } finally {
            setLoadingEmployees(false);
        }
    };

    const handleCreatedManager = (emp) => {
        if (!emp) return;
        const newEmp = emp?.data || emp;
        setEmployees(prev => [newEmp, ...prev]);
        setModel(prev => ({ ...prev, managerId: newEmp.Id ?? newEmp.id }));
        setShowAddManager(false);
        toast.success('Manager created and selected');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        // coerce managerId to number or null
        if (name === 'managerId') {
            const v = value === '' ? null : Number(value);
            setModel(prev => ({ ...prev, managerId: v }));
            setErrors(prev => ({ ...prev, managerId: undefined }));
            return;
        }

        setModel(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: undefined }));
    };

    function validate() {
        const e = {};
        if (!model.companyId) e.companyId = 'Company is required';
        if (!model.warehouseCode || model.warehouseCode.trim().length === 0) e.warehouseCode = 'Code is required';
        if (!model.warehouseName || model.warehouseName.trim().length === 0) e.warehouseName = 'Name is required';
        // if managerId is set, ensure it's a number
        if (model.managerId !== null && model.managerId !== undefined && Number.isNaN(Number(model.managerId))) {
            e.managerId = 'Manager selection is invalid';
        }
        return e;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validation = validate();
        if (Object.keys(validation).length > 0) {
            setErrors(validation);
            toast.error('Please fix validation errors');
            return;
        }

        // Prepare payload: ensure managerId is numeric or omitted
        const payload = { ...model };
        if (payload.managerId === null || payload.managerId === undefined || payload.managerId === '') delete payload.managerId;
        else payload.managerId = Number(payload.managerId);

        try {
            if (warehouse) {
                await api.put(`/Warehouse/${warehouse.id}`, payload);
                toast.success('Warehouse updated');
            } else {
                await api.post('/Warehouse', payload);
                toast.success('Warehouse created');
            }
            onSaved();
        } catch (err) {
            console.error('Save failed', err);
            const msg = err.response?.data?.message || err.response?.data || err.message || 'Save failed';
            toast.error(msg);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm">Code</label>
                        <input name="warehouseCode" value={model.warehouseCode} onChange={handleChange} className="w-full border p-2 rounded" />
                        {errors.warehouseCode && <div className="text-red-600 text-sm mt-1">{errors.warehouseCode}</div>}
                    </div>
                    <div>
                        <label className="block text-sm">Name</label>
                        <input name="warehouseName" value={model.warehouseName} onChange={handleChange} className="w-full border p-2 rounded" />
                        {errors.warehouseName && <div className="text-red-600 text-sm mt-1">{errors.warehouseName}</div>}
                    </div>
                    <div>
                        <label className="block text-sm">City</label>
                        <input name="city" value={model.city} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label className="block text-sm">Country</label>
                        <input name="country" value={model.country} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm">Address</label>
                        <textarea name="address" value={model.address} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label className="block text-sm">Postal Code</label>
                        <input name="postalCode" value={model.postalCode} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label className="block text-sm">Manager</label>
                        <div className="flex gap-2">
                            <select name="managerId" value={model.managerId ?? ''} onChange={handleChange} className="flex-1 border p-2 rounded">
                                <option value="">-- No manager --</option>
                                {loadingEmployees ? <option>Loading...</option> : (Array.isArray(employees) ? employees.map(emp => (
                                    <option key={emp.Id ?? emp.id} value={emp.Id ?? emp.id}>{emp.Name ?? emp.name} ({emp.Id ?? emp.id})</option>
                                )) : null)}
                            </select>
                            <button type="button" onClick={() => setShowAddManager(true)} className="px-3 py-1 bg-green-600 text-white rounded">Add</button>
                        </div>
                        {errors.managerId && <div className="text-red-600 text-sm mt-1">{errors.managerId}</div>}
                    </div>
                </div>
                <div className="mt-4 flex gap-2">
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
                    <button type="button" onClick={onCancel} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
                </div>
            </form>

            {showAddManager && <EmployeeQuickForm defaultCompanyId={model.companyId} onCreated={handleCreatedManager} onCancel={() => setShowAddManager(false)} />}
        </>
    );
}
