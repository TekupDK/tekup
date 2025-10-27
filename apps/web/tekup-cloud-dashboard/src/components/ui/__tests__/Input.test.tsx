import { render, screen } from '@testing-library/react';
import { Input } from '../Input';

describe('Input', () => {
  it('renders label and helper text', () => {
    render(<Input label="Email" helperText="We keep it private" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('We keep it private')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<Input label="Email" error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });
});

