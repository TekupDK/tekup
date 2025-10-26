import { AsyncLocalStorage } from 'node:async_hooks';

interface ContextStore {
  traceId?: string;
  tenantId?: string;
  requestId?: string;
}

const als = new AsyncLocalStorage<ContextStore>();

export function runWithContext<T>(values: ContextStore, fn: () => T): T {
  return als.run(values, fn);
}

export function getContext(): ContextStore {
  return als.getStore() || {};
}

export function setContext(values: Partial<ContextStore>) {
  const store = als.getStore();
  if (store) Object.assign(store, values);
}

export function getTenantId(): string | undefined { return getContext().tenantId; }
export function getTraceId(): string | undefined { return getContext().traceId; }
export function getRequestId(): string | undefined { return getContext().requestId; }
