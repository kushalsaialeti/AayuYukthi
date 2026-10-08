import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { OtpStep } from './pages/Auth.jsx';
import { LanguageSelector } from './i18n.jsx';

afterEach(() => cleanup());

describe('OtpStep', () => {
  it('enables Verify only at 6 digits and submits the code', async () => {
    const user = userEvent.setup();
    const onVerified = vi.fn();
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { accessToken: 'a', refreshToken: 'r', user: { id: 'u' } } }),
    });
    vi.stubGlobal('fetch', fetchSpy);

    render(
      <MemoryRouter>
        <OtpStep channel={{ email: 'a@example.com' }} purpose="signup" onVerified={onVerified} />
      </MemoryRouter>,
    );

    const input = screen.getByLabelText(/code/i);
    const button = screen.getByRole('button', { name: /verify/i });
    expect(button.disabled).toBe(true);

    await user.type(input, '12ab34cd');
    expect(input.value).toBe('1234');
    expect(button.disabled).toBe(true);

    await user.type(input, '56');
    expect(button.disabled).toBe(false);
    await user.click(button);

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [, opts] = fetchSpy.mock.calls[0];
    expect(JSON.parse(opts.body)).toMatchObject({ purpose: 'signup', code: '123456' });
    vi.unstubAllGlobals();
  });

  it('shows server errors without crashing', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ code: 'INVALID_OTP', message: 'This code is invalid or has expired' }),
    }));

    render(
      <MemoryRouter>
        <OtpStep channel={{ email: 'a@example.com' }} purpose="login" onVerified={() => {}} />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/code/i), '000000');
    await user.click(screen.getByRole('button', { name: /verify/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid/i);
    vi.unstubAllGlobals();
  });
});

describe('LanguageSelector', () => {
  it('switches locale and persists the choice', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LanguageSelector locale="en" onChange={onChange} />);
    await user.selectOptions(screen.getByLabelText(/language/i), 'te');
    expect(onChange).toHaveBeenCalledWith('te');
  });
});
