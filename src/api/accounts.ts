import { apiFetch } from './client';
import type { Account, Transaction } from '../types';

export const listAccounts = () => apiFetch<Account[]>('/accounts');

export const createAccount = (type: string, nickname?: string) =>
  apiFetch<Account>('/accounts', {
    method: 'POST',
    body: JSON.stringify({ type, nickname }),
  });

export const getAccount = (id: string) => apiFetch<Account>(`/accounts/${id}`);

export interface TxnFilters {
  limit?: number;
  offset?: number;
  from_date?: string;
  to_date?: string;
  type?: string;
}

export const listTransactions = (accountId: string, filters: TxnFilters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.append(k, String(v));
  });
  const qs = params.toString() ? `?${params}` : '';
  return apiFetch<Transaction[]>(`/accounts/${accountId}/transactions${qs}`);
};
