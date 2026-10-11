import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CareRequestConfirmation } from './pages/CareRequestConfirmation.jsx';
import { api } from './api.js';

vi.mock('./api.js', () => ({
  api: {
    authedReceipt: vi.fn(),
    authedGet: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('CareRequestConfirmation Page', () => {
  it('renders official receipt with order details, caretaker 1-hour note, and actions', async () => {
    api.authedReceipt.mockResolvedValueOnce({
      id: 'AY-REQ-12345',
      status: 'CONFIRMED',
      appointment_type: 'Doctor OPD Consultation',
      appointment_date: '2026-11-20',
      pickup_required: true,
      pickup_address: 'Flat 101, Jubilee Hills, Hyderabad',
      update_phone: '+91 98765 43210',
      recipient: {
        name: 'Kamala Devi',
        relationship: 'mother',
      },
      service: {
        title: 'Hospital Visit Escort',
      },
      hospital: {
        name: 'Apollo Hospitals Jubilee Hills',
        city: 'Hyderabad',
      },
    });

    render(
      <MemoryRouter initialEntries={['/request-care/confirmed/AY-REQ-12345']}>
        <Routes>
          <Route path="/request-care/confirmed/:id" element={<CareRequestConfirmation />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for content to load
    expect(await screen.findByText('Care Request Confirmed!')).toBeInTheDocument();
    expect(screen.getByText('AY-REQ-12345')).toBeInTheDocument();
    expect(screen.getByText(/Kamala Devi/i)).toBeInTheDocument();
    expect(screen.getByText('Hospital Visit Escort')).toBeInTheDocument();
    expect(screen.getByText(/Apollo Hospitals Jubilee Hills/i)).toBeInTheDocument();

    // Verify mandatory note stating caretaker details are shared 1 hour before
    expect(screen.getByText(/Dedicated care companion \/ caretaker details/i)).toBeInTheDocument();
    expect(screen.getByText('1 hour before')).toBeInTheDocument();

    // Verify user consent status displayed
    expect(screen.getByText(/Terms & Privacy Policy Accepted/i)).toBeInTheDocument();

    // Verify action links
    expect(screen.getByRole('link', { name: /Track Live Journey/i })).toHaveAttribute('href', '/app/requests/AY-REQ-12345');
    expect(screen.getByRole('link', { name: /Book Another Request/i })).toHaveAttribute('href', '/request-care');
  });
});
