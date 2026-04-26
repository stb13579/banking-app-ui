import { useEffect, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Landmark, ChevronRight, PlusCircle } from 'lucide-react';
import { listLoans, applyForLoan } from '../api/loans';
import { listAccounts } from '../api/accounts';
import type { Account, Loan } from '../types';

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-blue-100 text-blue-800',
  paid_off: 'bg-emerald-100 text-emerald-800',
};

export default function Loans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ account_id: '', principal: '', interest_rate: '0.05', term_months: '36' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([listLoans(), listAccounts()]).then(([l, a]) => { setLoans(l); setAccounts(a); });
  }, []);

  async function handleApply(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loan = await applyForLoan(
        form.account_id,
        parseFloat(form.principal),
        parseFloat(form.interest_rate),
        parseInt(form.term_months),
      );
      setLoans(l => [...l, loan]);
      setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Application failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Loans</h1>
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
          <PlusCircle size={14} /> Apply for Loan
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-100 rounded-xl p-5 mb-5">
          <h3 className="font-semibold text-slate-900 mb-4">Loan Application</h3>
          <form onSubmit={handleApply} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Disburse to account</label>
              <select required value={form.account_id} onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="">Select account…</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.nickname || a.type} · {a.account_number}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { field: 'principal', label: 'Principal ($)', type: 'number', step: '100' },
                { field: 'interest_rate', label: 'Interest Rate', type: 'number', step: '0.001' },
                { field: 'term_months', label: 'Term (months)', type: 'number', step: '1' },
              ].map(({ field, label, ...rest }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                  <input {...rest} required value={form[field as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              ))}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">
                {loading ? 'Submitting…' : 'Submit Application'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="border border-slate-200 text-sm px-4 py-2 rounded-lg">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loans.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-xl p-10 text-center">
          <Landmark size={32} className="text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No loans yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-xl divide-y divide-slate-50">
          {loans.map(loan => (
            <Link key={loan.id} to={`/loans/${loan.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[loan.status]}`}>
                    {loan.status.replace('_', ' ')}
                  </span>
                  {loan.term_months && <span className="text-xs text-slate-400">{loan.term_months} months</span>}
                </div>
                <p className="text-sm font-mono text-slate-500 mt-1">
                  {(Number(loan.interest_rate) * 100).toFixed(2)}% APR
                </p>
                {loan.next_payment_date && (
                  <p className="text-xs text-slate-400">Next payment: {fmtDate(loan.next_payment_date)}</p>
                )}
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <p className="text-sm font-mono font-bold text-slate-900">{fmtCurrency(Number(loan.outstanding_balance))}</p>
                  <p className="text-xs text-slate-400">of {fmtCurrency(Number(loan.principal))}</p>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
