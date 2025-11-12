import api from '../api';

export default {
    products: {
        list: (params) => api.get('/Product', { params }),
        get: (id) => api.get(`/Product/${id}`),
        create: (data) => api.post('/Product', data),
        update: (id, data) => api.put(`/Product/${id}`, data),
        delete: (id) => api.delete(`/Product/${id}`),
        adjust: (id, adjustment) => api.post(`/Product/${id}/adjust`, { adjustment })
    },
    warehouses: {
        list: () => api.get('/Warehouse'),
        get: (id) => api.get(`/Warehouse/${id}`),
        create: (data) => api.post('/Warehouse', data),
        update: (id, data) => api.put(`/Warehouse/${id}`, data),
        delete: (id) => api.delete(`/Warehouse/${id}`)
    },
    purchaseRequests: {
        list: () => api.get('/PurchaseRequest'),
        get: (id) => api.get(`/PurchaseRequest/${id}`),
        create: (data) => api.post('/PurchaseRequest', data),
        update: (id, data) => api.put(`/PurchaseRequest/${id}`, data),
        submit: (id) => api.post(`/PurchaseRequest/${id}/submit`)
    },
    canvassing: {
        list: () => api.get('/Canvassing'),
        get: (id) => api.get(`/Canvassing/${id}`),
        create: (data) => api.post('/Canvassing', data),
        selectSupplier: (id, supplierId) => api.post(`/Canvassing/${id}/select-supplier`, { supplierId }),
        convertToPO: (id) => api.post(`/Canvassing/${id}/convert-to-po`)
    },
    purchaseOrders: {
        list: (params) => api.get('/PurchaseOrder', { params }),
        get: (id) => api.get(`/PurchaseOrder/${id}`),
        create: (data) => api.post('/PurchaseOrder', data),
        approve: (id) => api.post(`/PurchaseOrder/${id}/approve`),
        send: (id) => api.post(`/PurchaseOrder/${id}/send`),
        confirm: (id, data) => api.post(`/PurchaseOrder/${id}/confirm`, data)
    },
    goodsReceipts: {
        list: () => api.get('/GoodsReceipt'),
        get: (id) => api.get(`/GoodsReceipt/${id}`),
        byPo: (poId) => api.get(`/GoodsReceipt/by-po/${poId}`),
        create: (data) => api.post('/GoodsReceipt', data),
        approve: (id) => api.post(`/GoodsReceipt/${id}/approve`)
    }
};
