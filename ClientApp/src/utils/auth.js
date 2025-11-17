import { AUTH_CONFIG, JWT_CLAIM_TYPES } from '../config/constants';

export const setToken = (token) => {
    localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
};

export const getToken = () => {
    return localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
};

export const removeToken = () => {
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
};

export const decodeToken = (token) => {
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};

// Robust role extraction - handle different claim names and arrays
export const getUserRole = (token) => {
    const raw = token || getToken();
    const payload = decodeToken(raw);
    if (!payload) return null;

    // Try several common claim names
    let role = payload[JWT_CLAIM_TYPES.ROLE] || payload.role || payload.Role || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'] || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'.toLowerCase()];

    // If role is an array, take first
    if (Array.isArray(role)) role = role[0];

    return role || null;
};

export const getUserName = (token) => {
    const raw = token || getToken();
    const payload = decodeToken(raw);
    if (!payload) return null;

    return payload[JWT_CLAIM_TYPES.NAME] || payload.name || payload.unique_name || null;
};

export const isTokenExpired = (token) => {
    const raw = token || getToken();
    const payload = decodeToken(raw);
    if (!payload || !payload.exp) return true;

    return Date.now() >= payload.exp * 1000;
};

export const isAuthenticated = () => {
    const token = getToken();
    if (!token) return false;

    return !isTokenExpired(token);
};

export const hasRole = (token, allowedRoles) => {
    const userRole = getUserRole(token);
    if (!userRole) return false;

    // Admin has access to everything
    if (userRole === 'Admin') return true;

    return allowedRoles.includes(userRole);
};