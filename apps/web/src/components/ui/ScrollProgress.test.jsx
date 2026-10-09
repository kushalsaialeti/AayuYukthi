import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ScrollProgress } from './ScrollProgress.jsx';

describe('ScrollProgress Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders a progressbar element with role progressbar', () => {
    render(<ScrollProgress />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveClass('magic-scroll-progress');
  });

  it('sets aria attributes and styles properly', () => {
    render(<ScrollProgress height={5} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar.style.height).toBe('5px');
    expect(bar.style.transform).toMatch(/scaleX/);
  });
});
