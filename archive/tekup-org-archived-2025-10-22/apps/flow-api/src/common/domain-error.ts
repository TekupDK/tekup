export class DomainError extends Error {
  constructor(public code: string, message?: string) {
    super(message || code);
  }
}

export class InvalidStatusTransitionError extends DomainError {
  constructor(message?: string) { super('invalid_status_transition', message); }
}
