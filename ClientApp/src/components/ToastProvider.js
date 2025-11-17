import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const push = useCallback((message, type = 'info', ttl = 5000) => {
        const id = Date.now() + Math.random();
        // Coerce message to string to avoid React rendering objects directly
        const text = typeof message === 'object' ? JSON.stringify(message) : String(message);
        setToasts(prev => [...prev, { id, message: text, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, ttl);
    }, []);

    const value = {
        info: (msg, ttl) => push(msg, 'info', ttl),
        success: (msg, ttl) => push(msg, 'success', ttl),
        error: (msg, ttl) => push(msg, 'error', ttl)
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map(t => (
                    <div key={t.id} className={`max-w-sm w-full px-4 py-3 rounded shadow-md text-white ${t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}>
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
