jest.mock('../api');

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PurchaseOrders from '../pages/PurchaseOrders';
import api from '../api';

describe('PurchaseOrders page', () => {
  beforeEach(() => jest.resetAllMocks());

  it('loads POs and performs approve/send/confirm actions', async () => {
    const orders = [
      { id: 1, PONumber: 'PO1', supplier: { supplierName: 'Sup A' }, orderDate: new Date().toISOString(), status: 'Draft' },
      { id: 2, PONumber: 'PO2', supplier: { supplierName: 'Sup B' }, orderDate: new Date().toISOString(), status: 'Approved' }
    ];

    api.get.mockResolvedValue({ data: orders });

    render(<PurchaseOrders />);

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/PurchaseOrder'));

    expect(await screen.findByText(/PO1/i)).toBeInTheDocument();
    expect(screen.getByText(/Sup A/i)).toBeInTheDocument();

    // mock confirm to allow action
    window.confirm = jest.fn().mockReturnValue(true);

    // Approve action for Draft
    api.post.mockResolvedValueOnce({});
    fireEvent.click(screen.getAllByText(/Approve/i)[0]);
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/PurchaseOrder/1/approve'));

    // Send action for Approved
    api.post.mockResolvedValueOnce({});
    fireEvent.click(screen.getAllByText(/Send/i)[0]);
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/PurchaseOrder/2/send'));
  });
});
