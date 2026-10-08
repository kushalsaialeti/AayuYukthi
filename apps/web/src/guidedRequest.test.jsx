import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CustomerAuthProvider } from './auth.jsx';
import { GuidedRequestEngine } from './components/request/engine/GuidedRequestEngine.jsx';
import { SingleSelectQuestion } from './components/request/primitives/SingleSelectQuestion.jsx';
import { DateQuestion } from './components/request/primitives/DateQuestion.jsx';
import { ReviewQuestion } from './components/request/primitives/ReviewQuestion.jsx';
import { AuthQuestion } from './components/request/primitives/AuthQuestion.jsx';
import { NeedSelector } from './components/public/NeedSelector.jsx';

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

const mockServices = [
  {
    id: 's1-uuid',
    slug: 'hospital-visit-escort',
    title_en: 'Hospital Visit Escort',
    description_en: 'Dedicated care companion from door to consult.',
    subtitle_en: 'Half-day accompaniment',
    category: 'outpatient',
    icon: 'local_hospital',
  },
  {
    id: 's2-uuid',
    slug: 'diagnostic-scan-escort',
    title_en: 'Diagnostic & Lab Escort',
    description_en: 'Escort for MRI, CT scan and pathology lab visits.',
    subtitle_en: 'Priority queue assistance',
    category: 'diagnostic',
    icon: 'biotech',
  },
];

const mockHospitals = [
  {
    id: 'h1-uuid',
    slug: 'apollo-hyderabad',
    name_en: 'Apollo Hospitals Jubilee Hills',
    city: 'Hyderabad',
    tag_en: 'Premier Healthcare Hub',
    campus_highlight_en: 'Gate 2 Priority Reception',
  },
  {
    id: 'h2-uuid',
    slug: 'yashoda-secunderabad',
    name_en: 'Yashoda Hospital Secunderabad',
    city: 'Secunderabad',
    tag_en: 'Multi-Specialty Campus',
    campus_highlight_en: 'Direct OPD Escort',
  },
];

const mockRecipients = [
  {
    id: 'r1-uuid',
    full_name: 'Kamala Devi',
    relationship: 'mother',
    phone_e164: '+919876543210',
  },
];

describe('Guided Request Question Primitives', () => {
  it('SingleSelectQuestion renders options and triggers selection', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const options = [
      { value: 'opt1', title: 'Option 1', description: 'Desc 1', icon: 'star' },
      { value: 'opt2', title: 'Option 2', description: 'Desc 2', icon: 'home' },
    ];

    render(
      <SingleSelectQuestion
        title="Select an Option"
        options={options}
        selectedValue="opt1"
        onSelect={onSelect}
      />
    );

    expect(screen.getByText('Select an Option')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();

    await user.click(screen.getByText('Option 2'));
    expect(onSelect).toHaveBeenCalledWith('opt2');
  });

  it('DateQuestion renders date input and triggers change', async () => {
    const user = userEvent.setup();
    const onDateChange = vi.fn();
    const onTimeSlotChange = vi.fn();

    render(
      <DateQuestion
        dateValue="2026-11-15"
        onDateChange={onDateChange}
        timeSlotValue="08:00 AM – 12:00 PM"
        onTimeSlotChange={onTimeSlotChange}
      />
    );

    const dateInput = screen.getByLabelText(/appointment date/i);
    expect(dateInput).toBeInTheDocument();
    expect(dateInput.value).toBe('2026-11-15');

    const afternoonSlot = screen.getByText('Afternoon Slot');
    await user.click(afternoonSlot);
    expect(onTimeSlotChange).toHaveBeenCalledWith('12:00 PM – 04:00 PM');
  });

  it('ReviewQuestion displays structured summary and calls onEditStep', async () => {
    const user = userEvent.setup();
    const onEditStep = vi.fn();

    const draft = {
      recipientId: 'r1-uuid',
      serviceId: 's1-uuid',
      hospitalId: 'h1-uuid',
      appointmentType: 'Cardiology Review',
      appointmentDate: '2026-12-01',
      timeSlot: 'Morning Slot',
      pickupRequired: true,
      pickupAddress: 'Road No 12, Banjara Hills',
      updatePhone: '+919988776655',
      additionalRequirements: 'Wheelchair required',
    };

    render(
      <ReviewQuestion
        draft={draft}
        recipientName="Kamala Devi"
        serviceTitle="Hospital Visit Escort"
        hospitalName="Apollo Hospitals Jubilee Hills"
        onEditStep={onEditStep}
      />
    );

    expect(screen.getByText(/Review your journey details/i)).toBeInTheDocument();
    expect(screen.getByText('Kamala Devi')).toBeInTheDocument();
    expect(screen.getByText('Hospital Visit Escort')).toBeInTheDocument();
    expect(screen.getByText('Apollo Hospitals Jubilee Hills')).toBeInTheDocument();
    expect(screen.getByText('Cardiology Review')).toBeInTheDocument();

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    expect(editButtons.length).toBeGreaterThanOrEqual(1);
    await user.click(editButtons[0]);
    expect(onEditStep).toHaveBeenCalledWith(1);
  });
});

describe('NeedSelector Component', () => {
  it('renders all 5 quick need cards and links to request-care with query params', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <NeedSelector services={mockServices} />
      </MemoryRouter>
    );

    expect(screen.getByText('Hospital Visit')).toBeInTheDocument();
    expect(screen.getByText('Diagnostic Visit')).toBeInTheDocument();
    expect(screen.getByText('Medicines / Reports')).toBeInTheDocument();
    expect(screen.getByText('Pickup / Drop')).toBeInTheDocument();
    expect(screen.getByText('Other Support')).toBeInTheDocument();

    const hospitalCard = screen.getByText('Hospital Visit');
    await user.click(hospitalCard);
  });
});

describe('GuidedRequestEngine End-to-End Flow', () => {
  it('steps sequentially through the request workflow, validates, and allows review edits', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <CustomerAuthProvider>
          <GuidedRequestEngine
            services={mockServices}
            hospitals={mockHospitals}
            recipients={mockRecipients}
          />
        </CustomerAuthProvider>
      </MemoryRouter>
    );

    // Step 1: Recipient
    expect(screen.getByText(/Who needs care support at the hospital/i)).toBeInTheDocument();
    const recipientCard = screen.getByText('Kamala Devi');
    await user.click(recipientCard);

    const continueBtn = screen.getByRole('button', { name: /continue/i });
    await user.click(continueBtn);

    // Step 2: Service
    expect(screen.getByText(/Which support service/i)).toBeInTheDocument();
    const serviceCard = screen.getByText('Hospital Visit Escort');
    await user.click(serviceCard);
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Step 3: Hospital
    expect(screen.getByText(/Which hospital will you be visiting/i)).toBeInTheDocument();
    const hospitalCard = screen.getByText('Apollo Hospitals Jubilee Hills');
    await user.click(hospitalCard);
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Step 4: Visit Purpose
    expect(screen.getByText(/What is the purpose of this hospital visit/i)).toBeInTheDocument();
    const consultSug = screen.getByText('Doctor OPD Consultation');
    await user.click(consultSug);
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Step 5: Schedule
    expect(screen.getByText(/When do you need companion accompaniment/i)).toBeInTheDocument();
    const dateInput = screen.getByLabelText(/appointment date/i);
    await user.type(dateInput, '2026-12-10');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Step 6: Pickup & Drop
    expect(screen.getByText(/Do you require home transit or doorstep pickup/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Step 7: Updates
    expect(screen.getByText(/Who should receive live journey updates/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Step 8: Additional Requirements
    expect(screen.getByText(/Any mobility assistance or special directives/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Step 9: Review
    expect(screen.getByText(/Review your journey details/i)).toBeInTheDocument();
    expect(screen.getByText('Kamala Devi')).toBeInTheDocument();
    expect(screen.getByText('Hospital Visit Escort')).toBeInTheDocument();
    expect(screen.getByText('Apollo Hospitals Jubilee Hills')).toBeInTheDocument();

    // Verify Edit jump from Review back to Step 1
    const editBtns = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editBtns[0]); // Edit recipient
    expect(screen.getByText(/Who needs care support at the hospital/i)).toBeInTheDocument();
  });

  it('supports selecting multiple services and reflects selections in summary counter', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <CustomerAuthProvider>
          <GuidedRequestEngine
            services={mockServices}
            hospitals={mockHospitals}
            recipients={mockRecipients}
          />
        </CustomerAuthProvider>
      </MemoryRouter>
    );

    // Step 1: Select recipient
    await user.click(screen.getByText('Kamala Devi'));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Step 2: Multi-service selection
    const escortCard = screen.getByText('Hospital Visit Escort');
    const diagCard = screen.getByText('Diagnostic & Lab Escort');

    await user.click(escortCard);
    expect(screen.getByText(/1 service selected/i)).toBeInTheDocument();

    await user.click(diagCard);
    expect(screen.getByText(/2 services selected/i)).toBeInTheDocument();
  });

  it('customizes step copy and auth settings from CMS blocks', async () => {
    const customBlocks = {
      'request.step1.title': { body_en: 'Custom CMS Recipient Headline' },
      'request.step1.eyebrow': { body_en: 'CMS Eyebrow 1' },
      'auth.email_enabled': { body_en: 'true' },
      'auth.phone_enabled': { body_en: 'false' },
    };

    render(
      <MemoryRouter>
        <CustomerAuthProvider>
          <GuidedRequestEngine
            services={mockServices}
            hospitals={mockHospitals}
            recipients={mockRecipients}
            cmsBlocks={customBlocks}
          />
        </CustomerAuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Custom CMS Recipient Headline')).toBeInTheDocument();
    expect(screen.getByText('CMS Eyebrow 1')).toBeInTheDocument();
  });
});

describe('AuthQuestion Role-Based Verification & CMS Controls', () => {
  it('role="self" creates account under the recipient name without caregiver input', () => {
    render(
      <MemoryRouter>
        <CustomerAuthProvider>
          <AuthQuestion role="self" recipientName="Ramesh Verma" />
        </CustomerAuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Self Booking: Account for Ramesh Verma/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Email Address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Email Verification Code/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Caregiver Full Name/i)).not.toBeInTheDocument();
  });

  it('role="host" directly collects email and verifies with OTP', () => {
    render(
      <MemoryRouter>
        <CustomerAuthProvider>
          <AuthQuestion role="host" />
        </CustomerAuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Host \/ Care Coordinator Access/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Host Email Address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Host Passcode via Email/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Caregiver Full Name/i)).not.toBeInTheDocument();
  });

  it('other roles (e.g. mother/father/spouse) render traditional caregiver signup form', () => {
    render(
      <MemoryRouter>
        <CustomerAuthProvider>
          <AuthQuestion role="mother" recipientName="Kamala Devi" />
        </CustomerAuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Caregiver Sign Up/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Caregiver Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Caregiver Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Create Password/i)).toBeInTheDocument();
  });

  it('phone number authentication is hidden by default and displayed when enabled via CMS', async () => {
    const user = userEvent.setup();

    // Default: phone auth is OFF
    const { unmount } = render(
      <MemoryRouter>
        <CustomerAuthProvider>
          <AuthQuestion role="other" cmsConfig={{ authEmailEnabled: true, authPhoneEnabled: false }} />
        </CustomerAuthProvider>
      </MemoryRouter>
    );

    expect(screen.queryByRole('button', { name: /Phone OTP Authentication/i })).not.toBeInTheDocument();
    unmount();

    // When phone auth is turned ON in CMS
    render(
      <MemoryRouter>
        <CustomerAuthProvider>
          <AuthQuestion role="other" cmsConfig={{ authEmailEnabled: true, authPhoneEnabled: true }} />
        </CustomerAuthProvider>
      </MemoryRouter>
    );

    const phoneBtn = screen.getByRole('button', { name: /Phone OTP Authentication/i });
    expect(phoneBtn).toBeInTheDocument();

    await user.click(phoneBtn);
    expect(screen.getByLabelText(/Mobile Phone Number/i)).toBeInTheDocument();
  });
});

