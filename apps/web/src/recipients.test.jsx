import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { CareRecipientAddForm, parseRecipientNotes, serializeRecipientNotes } from './components/recipients/CareRecipientAddForm.jsx';

afterEach(() => {
  cleanup();
});

describe('CareRecipientAddForm', () => {
  it('parses and serializes recipient notes properly', () => {
    const values = {
      homeAddress: '123 Main St',
      cityMetro: 'Bengaluru',
      pincode: '560001',
      hospital: 'Manipal Hospital',
      uhid: 'MH-1234',
      mobility: ['wheelchair'],
      wheelchairType: 'hospital',
      languages: ['Kannada', 'English'],
      careDirectives: 'Needs quiet seating',
      isPrimaryContact: true,
      secName: 'Dr. Rao',
      secRel: 'Brother',
      secPhone: '9876543210',
    };

    const serialized = serializeRecipientNotes(values);
    const parsed = parseRecipientNotes(serialized);

    expect(parsed.homeAddress).toBe('123 Main St');
    expect(parsed.cityMetro).toBe('Bengaluru');
    expect(parsed.pincode).toBe('560001');
    expect(parsed.hospital).toBe('Manipal Hospital');
    expect(parsed.mobility).toContain('wheelchair');
    expect(parsed.secContact.name).toBe('Dr. Rao');
  });

  it('renders all sections and inputs correctly', () => {
    render(
      <BrowserRouter>
        <CareRecipientAddForm
          user={{ full_name: 'Anand Murthy', phone_e164: '+919876543210' }}
          onSuccess={vi.fn()}
          onCancel={vi.fn()}
        />
      </BrowserRouter>
    );

    // Section 01: Basic Information
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Legal Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Relationship to You/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date of Birth/i)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Female/i })).toBeInTheDocument();

    // Section 02: Coordinates
    expect(screen.getByText(/Residential & Hospital Coordinates/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Home Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/City \/ Operational Metro/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Pincode/i)).toBeInTheDocument();

    // Section 03: Mobility
    expect(screen.getByText(/Mobility & On-Ground Escort/i)).toBeInTheDocument();
    expect(screen.getByText('Wheelchair Required')).toBeInTheDocument();

    // Section 04: Communication
    expect(screen.getByText(/Communication & Directives/i)).toBeInTheDocument();
    expect(screen.getByText('Telugu')).toBeInTheDocument();

    // Section 05: Emergency Contact
    expect(screen.getByText(/Emergency Escalation Contact/i)).toBeInTheDocument();
    expect(screen.getByText(/I am the primary emergency contact/i)).toBeInTheDocument();

    // Aside Preview
    expect(screen.getByText(/Profile Preview/i)).toBeInTheDocument();
    expect(screen.getByText(/Draft Profile/i)).toBeInTheDocument();
  });
});

import { RecipientDirectoryStats } from './components/recipients/RecipientDirectoryStats.jsx';
import { RecipientCard } from './components/recipients/RecipientCard.jsx';
import { RecipientGuaranteeBanner } from './components/recipients/RecipientGuaranteeBanner.jsx';

describe('RecipientDirectoryComponents', () => {
  it('shows zero counts and empty state copy when 0 recipients exist', () => {
    render(
      <BrowserRouter>
        <RecipientDirectoryStats recipients={[]} upcomingVisit={null} />
      </BrowserRouter>
    );

    expect(screen.getByText('0 Active')).toBeInTheDocument();
    expect(screen.getByText('No recipients configured yet')).toBeInTheDocument();
    expect(screen.getByText('None Scheduled')).toBeInTheDocument();
    expect(screen.getByText('0 Configured')).toBeInTheDocument();
  });

  it('renders live recipient card with real data dynamically', () => {
    const mockRecipient = {
      id: 'rec-1',
      full_name: 'Lakshmi Rao',
      relationship: 'Mother',
      date_of_birth: '1955-04-12',
      gender: 'female',
      phone_e164: '+919876543210',
      notes: JSON.stringify({
        homeAddress: '42 Orchid Lane',
        cityMetro: 'Bengaluru',
        pincode: '560038',
        hospital: 'Manipal Hospital, Old Airport Road',
        mobility: ['wheelchair', 'slow_walker'],
        languages: ['Kannada', 'English'],
        isPrimaryContact: true,
      }),
    };

    render(
      <BrowserRouter>
        <RecipientCard
          recipient={mockRecipient}
          index={0}
          upcomingVisit={null}
          currentUser={{ full_name: 'Anand Murthy', phone_e164: '+919876543210' }}
          onEdit={vi.fn()}
          onRemove={vi.fn()}
          onRequestCare={vi.fn()}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Lakshmi Rao')).toBeInTheDocument();
    expect(screen.getAllByText(/Mother/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Bengaluru \(560038\)/)).toBeInTheDocument();
    expect(screen.getByText('Wheelchair Required')).toBeInTheDocument();
    expect(screen.getByText('Slow Walker / Arm Support')).toBeInTheDocument();
  });

  it('renders guarantee banner with helpline', () => {
    render(<RecipientGuaranteeBanner />);
    expect(screen.getByText(/Empathetic Companion Matching/i)).toBeInTheDocument();
    expect(screen.getByText('1800-AAYU-CARE')).toBeInTheDocument();
  });
});

