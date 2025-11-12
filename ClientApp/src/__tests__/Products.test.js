jest.mock('../api');

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Products from '../pages/Products';
import api from '../api';

describe('Products page', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('renders product list and handles create flow', async () => {
        const products = [
            { id: 1, productCode: 'P1', name: 'Prod 1', quantity: 10, price: 5 },
            { id: 2, productCode: 'P2', name: 'Prod 2', quantity: 0, price: 12 }
        ];

        // return same data for any get call during the test
        api.get.mockResolvedValue({ data: products });

        render(<Products />);

        expect(screen.getByText(/Loading products/i)).toBeInTheDocument();

        await waitFor(() => expect(api.get).toHaveBeenCalledWith('/Product'));

        // After load, product rows show
        expect(await screen.findByText('Prod 1')).toBeInTheDocument();
        expect(screen.getByText('Prod 2')).toBeInTheDocument();

        // Click new product -> shows form
        fireEvent.click(screen.getByText(/New Product/i));
        expect(screen.getByLabelText(/Code/i)).toBeInTheDocument();

        // Mock create API
        api.post.mockResolvedValueOnce({ data: { id: 3 } });

        fireEvent.change(screen.getByLabelText(/Code/i), { target: { value: 'P3' } });
        fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Prod 3' } });
        fireEvent.change(screen.getByLabelText(/Price/i), { target: { value: '20' } });
        fireEvent.change(screen.getByLabelText(/Quantity/i), { target: { value: '5' } });

        fireEvent.click(screen.getByText(/Save/i));

        await waitFor(() => expect(api.post).toHaveBeenCalledWith('/Product', expect.any(Object)));
    });
});
