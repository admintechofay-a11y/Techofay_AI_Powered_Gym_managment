import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestStore {
  tenantId?: string;
  userId?: string;
  role?: string;
  branchId?: string;
  correlationId?: string;
  isSuperAdmin?: boolean;
}

export const requestContext = new AsyncLocalStorage<RequestStore>();

export function getRequestContext(): RequestStore | undefined {
  return requestContext.getStore();
}

export function getTenantId(): string | undefined {
  return requestContext.getStore()?.tenantId;
}

export function isSuperAdminContext(): boolean {
  return Boolean(requestContext.getStore()?.isSuperAdmin);
}

export function runInContext<R>(store: RequestStore, callback: () => R): R {
  return requestContext.run(store, callback);
}
