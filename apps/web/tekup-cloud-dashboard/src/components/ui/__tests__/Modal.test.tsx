import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../Modal';

describe('Modal', () => {
  it('renders when open and closes on backdrop click', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal isOpen title="Test" onClose={onClose}>
        Content
      </Modal>
    );
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();

    // Backdrop is the first div with role none; click the overlay by clicking near content wrapper background
    const backdrop = document.querySelector('.bg-black');
    if (backdrop) {
      await user.click(backdrop as HTMLElement);
    }
    expect(onClose).toHaveBeenCalled();
  });
});

