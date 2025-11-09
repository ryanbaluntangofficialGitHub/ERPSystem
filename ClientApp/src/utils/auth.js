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
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};

export const getUserRole = (token) => {
    const payload = decodeToken(token);
    return payload ? payload[JWT_CLAIM_TYPES.ROLE] : null;
};

export const getUserName = (token) => {
    const payload = decodeToken(token);
    return payload ? payload[JWT_CLAIM_TYPES.NAME] : null;
};

export const isTokenExpired = (token) => {
    const payload = decodeToken(token);
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