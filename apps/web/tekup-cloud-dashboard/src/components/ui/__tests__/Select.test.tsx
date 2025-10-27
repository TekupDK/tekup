import { render, screen } from '@testing-library/react';
import { Select } from '../Select';

describe('Select', () => {
  it('renders placeholder and options', () => {
    render(
      <Select
        label="Status"
        placeholder="Choose one"
        options={[
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ]}
      />
    );
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Choose one')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });
});

