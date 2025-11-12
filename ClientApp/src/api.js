const baseURL = 'https://localhost:7273/api';
const timeoutMs = 30000;

function buildHeaders(customHeaders = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...customHeaders
    };

    try {
        const token = localStorage.getItem('erp_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            // console.log('Request with token');
        }
    } catch (e) {
        // localStorage not available in some test environments
    }

    return headers;
}

async function request(method, url, options = {}) {
    const controller = new AbortController();
    const signal = controller.signal;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const init = {
        method,
        headers: buildHeaders(options.headers),
        signal
    };

    if (options.data) {
        init.body = JSON.stringify(options.data);
    }

    try {
        const res = await fetch(baseURL + url, init);
        clearTimeout(timer);

        const contentType = res.headers.get('content-type') || '';
        let data = null;
        if (contentType.includes('application/json')) {
            data = await res.json();
        } else {
            data = await res.text();
        }

        if (!res.ok) {
            const error = new Error('Request failed');
            error.response = { status: res.status, data };
            throw error;
        }

        return { data, status: res.status, headers: res.headers };
    } catch (err) {
        clearTimeout(timer);
        // Normalize fetch abort
        if (err.name === 'AbortError') {
            const error = new Error('Timeout');
            error.response = { status: 408 };
            throw error;
        }
        throw err;
    }
}

export default {
    get: (url, config) => request('GET', url + (config && config.params ? '?' + new URLSearchParams(config.params).toString() : ''), {}),
    post: (url, data) => request('POST', url, { data }),
    put: (url, data) => request('PUT', url, { data }),
    delete: (url) => request('DELETE', url),
    // simple interceptor placeholders to keep compatibility
    interceptors: {
        request: { use: () => {} },
        response: { use: () => {} }
    }
};