jest.mock('../api');

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PurchaseRequests from '../pages/PurchaseRequests';
import api from '../api';

describe('PurchaseRequests page', () => {
    beforeEach(() => jest.resetAllMocks());

    it('loads PRs and allows creating a new PR', async () => {
        api.get.mockResolvedValue({ data: [] });
        render(<PurchaseRequests />);

        await waitFor(() => expect(api.get).toHaveBeenCalledWith('/PurchaseRequest'));

        // wait for New PR button
        expect(await screen.findByText(/New PR/i)).toBeInTheDocument();

        // Create new PR
        fireEvent.click(screen.getByText(/New PR/i));
        expect(screen.getByText(/Items/i)).toBeInTheDocument();

        api.post.mockResolvedValueOnce({ data: { id: 10 } });

        // Click Save directly (form allows defaults)
        fireEvent.click(screen.getByText(/Save/i));

        await waitFor(() => expect(api.post).toHaveBeenCalledWith('/PurchaseRequest', expect.any(Object)));
    });
});
