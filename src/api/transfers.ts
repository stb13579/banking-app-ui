import { apiFetch } from './client';
import type { Transaction } from '../types';

export const transfer = (
  from_account_id: string,
  to_account_id: string,
  amount: number,
  description?: string,
  webhook_url?: string
) =>
  apiFetch<Transaction>('/transfers', {
    method: 'POST',
    body: JSON.stringify({ from_account_id, to_account_id, amount, description, webhook_url }),
  });
