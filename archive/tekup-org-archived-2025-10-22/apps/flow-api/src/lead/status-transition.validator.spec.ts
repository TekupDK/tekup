import { validateStatusTransition, allowedNextStatuses } from './status-transition.validator.js';
import { InvalidStatusTransitionError } from '../common/domain-error.js';

describe('status-transition.validator', () => {
  it('allows NEW -> CONTACTED', () => {
    expect(() => validateStatusTransition('NEW', 'CONTACTED')).not.toThrow();
  });

  it('rejects NEW -> NEW', () => {
    expect(() => validateStatusTransition('NEW', 'NEW')).toThrow(InvalidStatusTransitionError);
  });

  it('rejects CONTACTED -> NEW', () => {
    expect(() => validateStatusTransition('CONTACTED', 'NEW')).toThrow(InvalidStatusTransitionError);
  });

  it('allowedNextStatuses returns correct array', () => {
    expect(allowedNextStatuses('NEW')).toEqual(['CONTACTED']);
    expect(allowedNextStatuses('CONTACTED')).toEqual([]);
  });
});