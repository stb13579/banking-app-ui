import { apiFetch } from './client';
import type { Ticket, TicketMessage } from '../types';

export const listTickets = (params?: { status?: string; category?: string; priority?: string }) => {
  const qs = params ? '?' + new URLSearchParams(Object.fromEntries(
    Object.entries(params).filter(([, v]) => v)
  )).toString() : '';
  return apiFetch<Ticket[]>(`/tickets${qs}`);
};

export const createTicket = (subject: string, category: string, priority: string) =>
  apiFetch<Ticket>('/tickets', {
    method: 'POST',
    body: JSON.stringify({ subject, category, priority }),
  });

export const getTicket = (id: string) => apiFetch<Ticket>(`/tickets/${id}`);

export const updateTicketStatus = (id: string, status: string) =>
  apiFetch<Ticket>(`/tickets/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

export const postMessage = (ticketId: string, body: string) =>
  apiFetch<TicketMessage>(`/tickets/${ticketId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });

export const rateTicket = (ticketId: string, rating: number, comment?: string) =>
  apiFetch(`/tickets/${ticketId}/rate`, {
    method: 'POST',
    body: JSON.stringify({ rating, comment }),
  });
