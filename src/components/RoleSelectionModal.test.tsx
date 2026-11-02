import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render as rtlRender, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { MemoryRouter } from 'react-router';
const render = (ui: React.ReactElement) => rtlRender(<MemoryRouter>{ui}</MemoryRouter>);
import RoleSelectionModal from './RoleSelectionModal';
import RoleScopeTabs, { type RoleScope } from './RoleScopeTabs';
import { useAppStore } from '@/store/useAppStore';
import { filterByRole, roleMatchesCategory } from '@/utils/roleFilter';

const setRole = (r: any) =>
  useAppStore.setState((s) => ({ prefs: { ...s.prefs, selectedRole: r } }));

describe('RoleSelectionModal', () => {
  beforeEach(() => setRole(null));

  it('se muestra en el primer arranque y guarda el rol elegido', () => {
    render(<RoleSelectionModal />);
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: /Limpieza/ }));
    expect(useAppStore.getState().prefs.selectedRole).toBe('limpieza');
    expect(useAppStore.getState().prefs.preferredRole).toBe('limpieza');
  });

  it('no se muestra si ya hay rol', () => {
    setRole('bar');
    render(<RoleSelectionModal />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('desde Ajustes permite cambiar el rol y cierra', () => {
    setRole('bar');
    const onClose = vi.fn();
    render(<RoleSelectionModal open onClose={onClose} />);
    fireEvent.click(screen.getByRole('radio', { name: /Mantenimiento/ }));
    expect(useAppStore.getState().prefs.selectedRole).toBe('mantenimiento');
    expect(onClose).toHaveBeenCalled();
  });

  it('general no altera preferredRole de retos', () => {
    useAppStore.getState().setSelectedRole('bar');
    useAppStore.getState().setSelectedRole('general');
    expect(useAppStore.getState().prefs.selectedRole).toBe('general');
    expect(useAppStore.getState().prefs.preferredRole).toBe('bar');
  });
});

describe('roleFilter', () => {
  const items = [
    { id: 1, categoria: 'Bar' },
    { id: 2, categoria: 'Recepción' },
    { id: 3, categoria: 'General' },
    { id: 4, categoria: 'Limpieza' },
    { id: 5, categoria: 'Room Service' },
  ];
  it('filtra por departamento incluyendo General', () => {
    expect(filterByRole(items, 'bar').map((i) => i.id)).toEqual([1, 3]);
    expect(filterByRole(items, 'restaurante').map((i) => i.id)).toEqual([3, 5]);
  });
  it('general o sin rol no filtra', () => {
    expect(filterByRole(items, 'general')).toHaveLength(5);
    expect(filterByRole(items, null)).toHaveLength(5);
    expect(roleMatchesCategory('recepcion', 'Harrera')).toBe(true);
  });
});

describe('RoleScopeTabs', () => {
  const Wrapper = ({ role }: { role: any }) => {
    const [scope, setScope] = useState<RoleScope>('role');
    return <RoleScopeTabs role={role} scope={scope} onChange={setScope} />;
  };
  it('alterna entre mi departamento y todo', () => {
    render(<Wrapper role="bar" />);
    expect(screen.getByRole('tab', { name: 'Bar' }).getAttribute('aria-selected')).toBe('true');
    fireEvent.click(screen.getByRole('tab', { name: 'Todo' }));
    expect(screen.getByRole('tab', { name: 'Todo' }).getAttribute('aria-selected')).toBe('true');
  });
  it('se oculta con rol general', () => {
    render(<Wrapper role="general" />);
    expect(screen.queryByRole('tablist')).toBeNull();
  });
});
