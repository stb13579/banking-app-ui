import { useEffect, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { HeadphonesIcon, ChevronRight, PlusCircle } from 'lucide-react';
import { listTickets, createTicket } from '../api/tickets';
import type { Ticket } from '../types';

const PRIORITY_BADGE: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const STATUS_BADGE: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-violet-100 text-violet-800',
  pending_customer: 'bg-amber-100 text-amber-800',
  resolved: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-slate-100 text-slate-600',
};

const CATEGORIES = ['billing', 'fraud_dispute', 'account_access', 'card_issue', 'transfer_issue', 'technical', 'general'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export default function Support() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: '', category: 'general', priority: 'medium' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { listTickets().then(setTickets); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const ticket = await createTicket(form.subject, form.category, form.priority);
      setTickets(t => [ticket, ...t]);
      setShowForm(false);
      setForm({ subject: '', category: 'general', priority: 'medium' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Support</h1>
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
          <PlusCircle size={14} /> New Ticket
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-100 rounded-xl p-5 mb-5">
          <h3 className="font-semibold text-slate-900 mb-4">Create Support Ticket</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <input required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="Subject"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm">
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm">
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">
                {loading ? 'Creating…' : 'Create Ticket'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="border border-slate-200 text-sm px-4 py-2 rounded-lg">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-xl p-10 text-center">
          <HeadphonesIcon size={32} className="text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No tickets yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-xl divide-y divide-slate-50">
          {tickets.map(t => (
            <Link key={t.id} to={`/support/${t.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{t.subject}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[t.status] ?? ''}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_BADGE[t.priority] ?? ''}`}>
                    {t.priority}
                  </span>
                  <span className="text-xs text-slate-400">{t.category.replace('_', ' ')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-3">
                {t.assigned_to && (
                  <span className="text-xs text-slate-400 hidden sm:block">{t.assigned_to.replace('agent_', '')}</span>
                )}
                <ChevronRight size={14} className="text-slate-300" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
