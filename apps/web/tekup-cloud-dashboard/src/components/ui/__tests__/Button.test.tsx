import { render, screen } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies variant and size classes', () => {
    const { container } = render(
      <Button variant="secondary" size="lg">Action</Button>
    );
    const btn = container.querySelector('button');
    expect(btn).toHaveTextContent('Action');
  });
});

