jest.mock('../api');

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Canvassings from '../pages/Canvassings';
import api from '../api';

describe('Canvassings page', () => {
  beforeEach(() => jest.resetAllMocks());

  it('loads canvassings and allows creating one', async () => {
    const list = [
      { id: 1, canvassingNumber: 'CNV1', canvassingDate: new Date().toISOString(), status: 'InProgress' }
    ];

    api.get.mockResolvedValue({ data: list });

    render(<Canvassings />);
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/Canvassing'));

    expect(await screen.findByText(/CNV1/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/New/i));
    expect(screen.getByText(/Items/i)).toBeInTheDocument();

    api.post.mockResolvedValueOnce({ data: { id: 5 } });
    fireEvent.click(screen.getByText(/Save/i));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/Canvassing', expect.any(Object)));
  });
});
