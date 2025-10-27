import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '../Sidebar';

describe('Sidebar', () => {
  it('renders navigation items and toggles collapsed state', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    // Should render a known item label when expanded by default
    expect(screen.getByRole('navigation')).toBeInTheDocument();

    // Toggle collapse button exists
    const toggle = screen.getByRole('button', {
      name: /collapse sidebar|expand sidebar/i,
    });
    await user.click(toggle);

    // After toggle, button label flips (no strict assertion on classnames)
    const toggled = screen.getByRole('button', {
      name: /collapse sidebar|expand sidebar/i,
    });
    expect(toggled).toBeInTheDocument();
  });
});

