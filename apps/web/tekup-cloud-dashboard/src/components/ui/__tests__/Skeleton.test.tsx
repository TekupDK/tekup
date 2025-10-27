import { render } from '@testing-library/react';
import { Skeleton, SkeletonText, SkeletonCard } from '../Skeleton';

describe('Skeleton', () => {
  it('renders basic skeleton', () => {
    const { container } = render(<Skeleton width={100} height={20} />);
    const el = container.querySelector('div');
    expect(el).toBeTruthy();
  });

  it('renders text and card variants', () => {
    const { getAllByText } = render(
      <div>
        <SkeletonText lines={2} />
        <SkeletonCard />
      </div>
    );
    // No direct text assertions; just ensure render didn't throw
    expect(getAllByText).toBeDefined();
  });
});

