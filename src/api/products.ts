import { apiFetch } from './client';
import type { Application, Product } from '../types';

export const listProducts = (type?: string) => {
  const qs = type ? `?type=${type}` : '';
  return apiFetch<Product[]>(`/products${qs}`);
};

export const listApplications = () => apiFetch<Application[]>('/applications');

export const applyCreditCard = (annual_income: number, employment_status: string) =>
  apiFetch<Application>('/products/credit-card/apply', {
    method: 'POST',
    body: JSON.stringify({ annual_income, employment_status }),
  });

export const applyLoan = (amount: number, purpose: string, annual_income: number, term_months: number) =>
  apiFetch<{ application: Application; amortization_schedule: unknown[] }>(
    '/products/loan/apply',
    {
      method: 'POST',
      body: JSON.stringify({ amount, purpose, annual_income, term_months }),
    }
  );
