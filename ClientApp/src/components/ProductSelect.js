import React from 'react';
import AsyncSelect from 'react-select/async';
import api from '../api';
import debounce from 'lodash/debounce';

export default function ProductSelect({ value, onChange, placeholder = 'Search product...' }) {
    const load = async (inputValue, callback) => {
        try {
            const res = await api.get('/Product', { params: { query: inputValue } });
            const data = res.data && (res.data.items || res.data.Items) ? (res.data.items || res.data.Items) : res.data || [];
            const options = (Array.isArray(data) ? data : []).map(p => ({ value: p.id ?? p.Id, label: p.productCode ? `${p.productCode} - ${p.name}` : p.name }));
            callback(options);
        } catch (err) {
            console.error('Product search failed', err);
            callback([]);
        }
    };

    // debounce to reduce API calls
    const debouncedLoad = React.useMemo(() => debounce(load, 300), []);

    React.useEffect(() => () => debouncedLoad.cancel(), [debouncedLoad]);

    return (
        <AsyncSelect
            cacheOptions
            defaultOptions
            loadOptions={debouncedLoad}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            isClearable
        />
    );
}
