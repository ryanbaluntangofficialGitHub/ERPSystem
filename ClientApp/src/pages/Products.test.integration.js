// Simple integration-like test to simulate product create -> list
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Products from './Products';
import api from '../api';
import { ToastProvider } from '../components/ToastProvider';

jest.mock('../api');

test('create product flow', async () => {
    const products = [];
    api.get.mockResolvedValue({ data: products });
    api.post.mockResolvedValue({ data: { id: 101 } });

    render(
        <ToastProvider>
            <Products />
        </ToastProvider>
    );

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/Product'));

    fireEvent.click(screen.getByText(/New Product/i));
    fireEvent.change(screen.getByLabelText(/Code/i), { target: { value: 'PX1' } });
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'PX One' } });
    fireEvent.change(screen.getByLabelText(/Price/i), { target: { value: '9.99' } });
    fireEvent.change(screen.getByLabelText(/Quantity/i), { target: { value: '10' } });

    fireEvent.click(screen.getByText(/Save/i));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/Product', expect.any(Object)));
});
