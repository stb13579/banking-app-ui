export interface User {
  id: string;
  username?: string;
  email: string;
  role?: string;
  is_verified?: boolean;
  mfa_enabled?: boolean;
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  account_number: string;
  routing_number: string;
  type: 'checking' | 'savings' | 'money_market' | 'cd';
  balance: number;
  currency: string;
  status: 'active' | 'frozen' | 'closed';
  nickname: string | null;
  interest_rate: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  from_account_id: string | null;
  to_account_id: string | null;
  amount: number;
  type: string;
  status: string;
  description: string | null;
  reference_number: string | null;
  category: string | null;
  created_at: string;
}

export interface Loan {
  id: string;
  account_id: string;
  user_id: string;
  principal: number;
  interest_rate: number;
  outstanding_balance: number;
  term_months: number | null;
  monthly_payment: number | null;
  next_payment_date: string | null;
  status: 'active' | 'paid_off';
  created_at: string;
}

export interface AmortizationEntry {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'pending_customer' | 'resolved' | 'closed';
  assigned_to: string | null;
  sla_deadline: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  messages?: TicketMessage[];
  attachments?: Attachment[];
  rating?: TicketRating | null;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  author_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface Attachment {
  id: string;
  ticket_id: string;
  original_name: string;
  stored_name: string;
  size: number;
  mime_type: string;
  created_at: string;
}

export interface TicketRating {
  id: string;
  ticket_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  type: string;
  description: string;
  apr: number;
  min_amount: number | null;
  max_amount: number | null;
  credit_limit: number | null;
  term_months: string | null;
  min_income_required: number;
  min_credit_score: number;
  status: string;
}

export interface Application {
  id: string;
  user_id: string;
  product_type: string;
  amount: number | null;
  term_months: number | null;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'DECLINED';
  details: string;
  created_at: string;
  amortization_schedule?: AmortizationEntry[];
}

export interface TokenPayload {
  sub: string;
  email?: string;
  username?: string;
  role?: string;
  exp?: number;
}
