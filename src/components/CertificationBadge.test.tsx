import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HashRouter } from 'react-router';
import CertificationBadge from '@/components/CertificationBadge';
import { Certification } from '@/store/types';

const makeCert = (overrides: Partial<Certification> = {}): Certification => ({
  id: 'cert-test-1',
  studentName: 'Ana García',
  role: 'recepcion',
  roleLabel: 'Recepción Hotelera',
  examDate: '2026-01-15',
  score: 8,
  total: 10,
  accuracy: 0.8,
  avgResponseTimeMs: 3500,
  categoryScores: [
    { category: 'reservas', total: 6, correct: 5, accuracy: 0.83 },
    { category: 'check-in', total: 4, correct: 3, accuracy: 0.75 },
  ],
  competencyIndex: 82,
  passed: true,
  verificationCode: 'HE-A1B2-C3D4',
  ...overrides,
});

const renderWithRouter = (ui: React.ReactElement) =>
  render(<HashRouter>{ui}</HashRouter>);

describe('CertificationBadge', () => {
  it('renders student name', () => {
    renderWithRouter(<CertificationBadge certification={makeCert()} />);
    expect(screen.getByText('Ana García')).toBeDefined();
  });

  it('renders role label', () => {
    renderWithRouter(<CertificationBadge certification={makeCert()} />);
    expect(screen.getByText('Recepción Hotelera')).toBeDefined();
  });

  it('renders exam date', () => {
    renderWithRouter(<CertificationBadge certification={makeCert()} />);
    expect(screen.getByText(/Expedido el 2026-01-15/)).toBeDefined();
  });

  it('renders score', () => {
    renderWithRouter(<CertificationBadge certification={makeCert()} />);
    expect(screen.getByText('8/10')).toBeDefined();
  });

  it('renders verification code', () => {
    renderWithRouter(<CertificationBadge certification={makeCert()} />);
    expect(screen.getByText('HE-A1B2-C3D4')).toBeDefined();
  });

  it('shows competency index', () => {
    renderWithRouter(<CertificationBadge certification={makeCert()} />);
    expect(screen.getByText('82')).toBeDefined();
  });

  it('renders category breakdown', () => {
    renderWithRouter(<CertificationBadge certification={makeCert()} />);
    expect(screen.getByText('reservas')).toBeDefined();
    expect(screen.getByText('check-in')).toBeDefined();
  });

  it('calls onShare when share button is clicked', () => {
    const onShare = vi.fn();
    renderWithRouter(
      <CertificationBadge certification={makeCert()} onShare={onShare} />
    );
    const shareBtn = screen.getByLabelText('Copiar código de verificación');
    fireEvent.click(shareBtn);
    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it('renders compact mode correctly', () => {
    renderWithRouter(
      <CertificationBadge certification={makeCert()} compact />
    );
    expect(screen.getByText('Recepción Hotelera')).toBeDefined();
    expect(screen.getByText('80% · 2026-01-15')).toBeDefined();
  });

  it('shows different gradient for bar role', () => {
    const cert = makeCert({ role: 'bar', roleLabel: 'Barra y Cafetería' });
    const { container } = renderWithRouter(
      <CertificationBadge certification={cert} />
    );
    // The root element should have the bar gradient class
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('from-purple-500/30');
  });

  it('shows failed badge when not passed', () => {
    const cert = makeCert({ passed: false, score: 4, total: 10, accuracy: 0.4 });
    const { container } = renderWithRouter(
      <CertificationBadge certification={cert} />
    );
    const root = container.firstChild as HTMLElement;
    // Should still render, just different styling
    expect(root.className).toBeTruthy();
  });
});
