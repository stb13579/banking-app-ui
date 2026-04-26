import { apiFetch } from './client';
import type { AmortizationEntry, Loan } from '../types';

export const listLoans = () => apiFetch<Loan[]>('/loans');

export const getLoan = (id: string) => apiFetch<Loan>(`/loans/${id}`);

export const applyForLoan = (
  account_id: string,
  principal: number,
  interest_rate: number,
  term_months: number
) =>
  apiFetch<Loan>('/loans', {
    method: 'POST',
    body: JSON.stringify({ account_id, principal, interest_rate, term_months }),
  });

export const getLoanSchedule = (id: string) =>
  apiFetch<AmortizationEntry[]>(`/loans/${id}/schedule`);

export const repayLoan = (loan_id: string, account_id: string, amount: number) =>
  apiFetch<Loan>(`/loans/${loan_id}/repay`, {
    method: 'POST',
    body: JSON.stringify({ account_id, amount }),
  });
