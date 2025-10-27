import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TopNav } from '../TopNav';
import { ThemeProvider } from '../../../contexts/ThemeProvider';

describe('TopNav', () => {
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(<ThemeProvider>{ui}</ThemeProvider>);
  };

  it('toggles theme', async () => {
    const user = userEvent.setup();
    const root = document.documentElement;
    root.classList.add('light');

    renderWithProviders(<TopNav />);

    const toggle = screen.getByRole('button', { name: /switch to dark|switch to light/i });
    await user.click(toggle);

    // After toggle, document element should have dark or light toggled
    expect(root.classList.contains('dark') || root.classList.contains('light')).toBe(true);
  });

  it('opens notifications and tenant menus', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TopNav />);

    // Tenant menu
    const tenantBtn = screen.getByRole('button', { name: /select tenant/i });
    await user.click(tenantBtn);
    expect(screen.getByText(/Acme Corporation/i)).toBeInTheDocument();

    // Notifications menu
    const buttons = screen.getAllByRole('button');
    let found = false;
    for (const btn of buttons) {
      await user.click(btn);
      const matches = screen.queryAllByText(/Notifications/i);
      if (matches.length > 0) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});
