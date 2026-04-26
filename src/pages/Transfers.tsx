import { useEffect, useState, FormEvent } from 'react';
import { ArrowLeftRight, CheckCircle } from 'lucide-react';
import { listAccounts } from '../api/accounts';
import { transfer } from '../api/transfers';
import type { Account, Transaction } from '../types';

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export default function Transfers() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState({ from: '', to: '', amount: '', description: '', webhookUrl: '' });
  const [result, setResult] = useState<Transaction | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { listAccounts().then(setAccounts); }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const txn = await transfer(
        form.from, form.to, parseFloat(form.amount),
        form.description || undefined,
        form.webhookUrl || undefined,
      );
      setResult(txn);
      setForm(f => ({ ...f, amount: '', description: '', webhookUrl: '' }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Transfer Funds</h1>

      {result && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-5 flex items-start gap-3">
          <CheckCircle size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-900">Transfer complete</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              {fmtCurrency(Number(result.amount))} · Ref: {result.reference_number}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-100 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">From account</label>
            <select required value={form.from} onChange={e => setForm(f => ({ ...f, from: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm">
              <option value="">Select account…</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.nickname || a.type} · {a.account_number} · {fmtCurrency(Number(a.balance))}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">To account ID</label>
            <input required value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
              placeholder="Destination account UUID"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (USD)</label>
            <input required type="text" inputMode="decimal" pattern="^\d+(\.\d{1,2})?$" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              placeholder="0.00"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description (optional)</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="e.g. Rent payment"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
          </div>

          {/* SSRF demo field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Webhook URL{' '}
              <span className="text-amber-600 text-xs font-normal">[VULN: SSRF — fetched server-side]</span>
            </label>
            <input value={form.webhookUrl} onChange={e => setForm(f => ({ ...f, webhookUrl: e.target.value }))}
              placeholder="https://example.com/webhook or http://169.254.169.254/..."
              className="w-full border border-amber-200 bg-amber-50 rounded-lg px-3 py-2.5 text-sm font-mono" />
            <p className="text-xs text-slate-400 mt-1">
              The backend fetches this URL server-side. Try internal IPs for the SSRF demo.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 text-sm text-red-700">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm flex items-center justify-center gap-2">
            <ArrowLeftRight size={16} />
            {loading ? 'Processing…' : 'Send Transfer'}
          </button>
        </form>
      </div>
    </div>
  );
}
