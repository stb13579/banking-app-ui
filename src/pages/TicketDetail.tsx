import { useEffect, useState, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Star } from 'lucide-react';
import { getTicket, updateTicketStatus, postMessage, rateTicket } from '../api/tickets';
import type { Ticket } from '../types';

const STATUS_OPTIONS = ['open', 'in_progress', 'pending_customer', 'resolved', 'closed'];

function fmtDateTime(s: string) {
  return new Date(s).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messageBody, setMessageBody] = useState('');
  const [sending, setSending] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) getTicket(id).then(setTicket).catch(console.error);
  }, [id]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!id || !messageBody.trim()) return;
    setSending(true);
    try {
      await postMessage(id, messageBody);
      const updated = await getTicket(id);
      setTicket(updated);
      setMessageBody('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setSending(false);
    }
  }

  async function handleStatusChange(status: string) {
    if (!id) return;
    const updated = await updateTicketStatus(id, status);
    setTicket(updated);
  }

  async function handleRate(e: FormEvent) {
    e.preventDefault();
    if (!id || !rating) return;
    await rateTicket(id, rating, ratingComment || undefined);
    setRatingSubmitted(true);
    const updated = await getTicket(id);
    setTicket(updated);
  }

  if (!ticket) return <div className="p-6 text-slate-400 text-sm">Loading…</div>;

  return (
    <div className="p-6 max-w-2xl">
      <button onClick={() => navigate('/support')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-4">
        <ArrowLeft size={14} /> Back to Support
      </button>

      {/* Ticket header */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 mb-5">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="font-bold text-slate-900">{ticket.subject}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {ticket.category.replace('_', ' ')} · {ticket.priority} priority
              {ticket.assigned_to && ` · Assigned: ${ticket.assigned_to.replace('agent_', '')}`}
            </p>
          </div>
          <select value={ticket.status} onChange={e => handleStatusChange(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 flex-shrink-0">
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
        {ticket.sla_deadline && (
          <p className="text-xs text-amber-600 mt-2">
            SLA deadline: {fmtDateTime(ticket.sla_deadline)}
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="space-y-3 mb-5">
        {(ticket.messages ?? []).length === 0 ? (
          <p className="text-sm text-slate-400">No messages yet. Add the first one below.</p>
        ) : (
          (ticket.messages ?? []).map(msg => (
            <div key={msg.id} className="bg-white border border-slate-100 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-mono text-slate-400">{msg.author_id.slice(0, 8)}…</span>
                <span className="text-xs text-slate-400">{fmtDateTime(msg.created_at)}</span>
              </div>
              {/*
                VULNERABILITY (DOM-based XSS): Message body is rendered via
                dangerouslySetInnerHTML without any sanitization.

                Combined with the stored XSS vulnerability in the support service
                backend (POST /tickets/:id/messages stores the body without escaping),
                any script tag submitted as a message will execute here in the
                viewer's browser session.

                Demo: post a message with body:
                  <script>alert('XSS: ' + document.cookie)</script>
                Then open this ticket to trigger execution.

                Fix: sanitize with DOMPurify before rendering, or render as plain text
                with <p>{msg.body}</p>.
              */}
              <div
                className="text-sm text-slate-700 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: msg.body }}
              />
            </div>
          ))
        )}
      </div>

      {/* Reply form */}
      {!['resolved', 'closed'].includes(ticket.status) && (
        <form onSubmit={handleSend} className="flex gap-2 mb-6">
          <textarea value={messageBody} onChange={e => setMessageBody(e.target.value)}
            placeholder="Type your message… (try <script>alert(1)</script> for XSS demo)"
            rows={2}
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="submit" disabled={sending || !messageBody.trim()}
            className="self-end bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2.5 rounded-xl">
            <Send size={16} />
          </button>
        </form>
      )}
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {/* CSAT Rating */}
      {['resolved', 'closed'].includes(ticket.status) && !ratingSubmitted && !ticket.rating && (
        <div className="bg-white border border-slate-100 rounded-xl p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Rate your experience</h3>
          <form onSubmit={handleRate} className="space-y-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setRating(n)}
                  className={`p-1 transition-colors ${n <= rating ? 'text-amber-400' : 'text-slate-200 hover:text-amber-200'}`}>
                  <Star size={24} fill={n <= rating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
            <input value={ratingComment} onChange={e => setRatingComment(e.target.value)}
              placeholder="Optional comment…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            <button type="submit" disabled={!rating}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">
              Submit Rating
            </button>
          </form>
        </div>
      )}

      {(ticket.rating || ratingSubmitted) && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-sm text-emerald-800">
          Rating submitted — thanks for your feedback!
        </div>
      )}
    </div>
  );
}
