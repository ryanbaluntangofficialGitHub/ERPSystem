// Centralized configuration for the entire React app
export const API_CONFIG = {
    BASE_URL: process.env.REACT_APP_API_URL || 'https://localhost:7273/api',
    TIMEOUT: 30000, // 30 seconds
};

export const AUTH_CONFIG = {
    TOKEN_KEY: process.env.REACT_APP_TOKEN_KEY || 'erp_token',
    TOKEN_EXPIRATION_HOURS: parseInt(process.env.REACT_APP_TOKEN_EXPIRATION_HOURS || '3'),
};

export const ROLE_ROUTES = {
    Admin: '/',
    Sales: '/sales',
    Purchase: '/purchases',
    HR: '/hr',
    Accounting: '/accounting',
    Production: '/production',
};

export const SIDEBAR_LINKS = [
    {
        to: '/',
        label: 'Dashboard',
        icon: '📊',
        roles: ['Admin', 'Sales', 'Purchase', 'HR', 'Accounting', 'Production']
    },
    {
        to: '/sales',
        label: 'Sales',
        icon: '💰',
        roles: ['Admin', 'Sales']
    },
    {
        to: '/purchases',
        label: 'Purchasing',
        icon: '🛒',
        roles: ['Admin', 'Purchase']
    },
    {
        to: '/hr',
        label: 'Human Resources',
        icon: '👥',
        roles: ['Admin', 'HR']
    },
    {
        to: '/accounting',
        label: 'Accounting',
        icon: '📈',
        roles: ['Admin', 'Accounting']
    },
    {
        to: '/production',
        label: 'Production',
        icon: '🏭',
        roles: ['Admin', 'Production']
    },
];

export const JWT_CLAIM_TYPES = {
    ROLE: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
    NAME: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
};