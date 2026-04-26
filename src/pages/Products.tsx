import { useEffect, useState, FormEvent } from 'react';
import { ShoppingBag, CheckCircle, XCircle } from 'lucide-react';
import { listProducts, listApplications, applyCreditCard, applyLoan } from '../api/products';
import type { Application, Product } from '../types';

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

const STATUS_STYLE: Record<string, string> = {
  APPROVED: 'bg-emerald-100 text-emerald-800',
  DECLINED: 'bg-red-100 text-red-800',
  PENDING: 'bg-amber-100 text-amber-800',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800',
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [applying, setApplying] = useState<string | null>(null);
  const [ccForm, setCcForm] = useState({ income: '', employment: 'employed' });
  const [loanForm, setLoanForm] = useState({ amount: '', purpose: '', income: '', term: '36' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([listProducts(), listApplications()])
      .then(([p, a]) => { setProducts(p); setApplications(a); });
  }, []);

  async function handleCcApply(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await applyCreditCard(parseFloat(ccForm.income), ccForm.employment);
      const apps = await listApplications();
      setApplications(apps);
      setApplying(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Application failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleLoanApply(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await applyLoan(parseFloat(loanForm.amount), loanForm.purpose, parseFloat(loanForm.income), parseInt(loanForm.term));
      const apps = await listApplications();
      setApplications(apps);
      setApplying(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Application failed');
    } finally {
      setLoading(false);
    }
  }

  const cards = products.filter(p => p.type === 'CREDIT_CARD');
  const loans = products.filter(p => p.type !== 'CREDIT_CARD');

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Products</h1>

      {/* Credit Cards */}
      <h2 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wider">Credit Cards</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {cards.map(p => (
          <div key={p.id} className="bg-white border border-slate-100 rounded-xl p-5">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-slate-900">{p.name}</h3>
              <ShoppingBag size={16} className="text-slate-400" />
            </div>
            <p className="text-sm text-slate-500 mb-3">{p.description}</p>
            <div className="flex gap-4 text-sm mb-4">
              <div><p className="text-xs text-slate-400">APR</p><p className="font-medium">{Number(p.apr).toFixed(2)}%</p></div>
              {p.credit_limit && <div><p className="text-xs text-slate-400">Credit Limit</p><p className="font-medium">{fmtCurrency(Number(p.credit_limit))}</p></div>}
              <div><p className="text-xs text-slate-400">Min Score</p><p className="font-medium">{p.min_credit_score || '—'}</p></div>
            </div>
            <button onClick={() => setApplying(`cc-${p.id}`)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg">Apply Now</button>
            {applying === `cc-${p.id}` && (
              <form onSubmit={handleCcApply} className="mt-3 space-y-2">
                <input required type="number" placeholder="Annual income ($)" value={ccForm.income}
                  onChange={e => setCcForm(f => ({ ...f, income: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                <select value={ccForm.employment} onChange={e => setCcForm(f => ({ ...f, employment: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                  {['employed', 'self_employed', 'unemployed', 'retired'].map(v => <option key={v} value={v}>{v.replace('_', ' ')}</option>)}
                </select>
                {error && <p className="text-xs text-red-600">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full bg-slate-800 text-white text-sm py-2 rounded-lg">
                  {loading ? 'Submitting…' : 'Submit Application'}
                </button>
              </form>
            )}
          </div>
        ))}
      </div>

      {/* Loans */}
      <h2 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wider">Loans & Deposits</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {loans.map(p => (
          <div key={p.id} className="bg-white border border-slate-100 rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 mb-1">{p.name}</h3>
            <p className="text-sm text-slate-500 mb-3">{p.description}</p>
            <div className="flex gap-4 text-sm mb-4">
              <div><p className="text-xs text-slate-400">APR/APY</p><p className="font-medium">{Number(p.apr).toFixed(2)}%</p></div>
              {p.max_amount && <div><p className="text-xs text-slate-400">Max</p><p className="font-medium">{fmtCurrency(Number(p.max_amount))}</p></div>}
            </div>
            {p.type !== 'CD' && (
              <>
                <button onClick={() => setApplying(`loan-${p.id}`)}
                  className="w-full border border-blue-200 text-blue-600 hover:bg-blue-50 text-sm py-2 rounded-lg">Apply</button>
                {applying === `loan-${p.id}` && (
                  <form onSubmit={handleLoanApply} className="mt-3 space-y-2">
                    <input required type="number" placeholder="Amount ($)" value={loanForm.amount}
                      onChange={e => setLoanForm(f => ({ ...f, amount: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                    <input required placeholder="Purpose" value={loanForm.purpose}
                      onChange={e => setLoanForm(f => ({ ...f, purpose: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                    <input required type="number" placeholder="Annual income ($)" value={loanForm.income}
                      onChange={e => setLoanForm(f => ({ ...f, income: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                    <input required type="number" placeholder="Term (months)" value={loanForm.term}
                      onChange={e => setLoanForm(f => ({ ...f, term: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                    {error && <p className="text-xs text-red-600">{error}</p>}
                    <button type="submit" disabled={loading}
                      className="w-full bg-slate-800 text-white text-sm py-2 rounded-lg">
                      {loading ? '…' : 'Submit'}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Applications */}
      {applications.length > 0 && (
        <div>
          <h2 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wider">Your Applications</h2>
          <div className="bg-white border border-slate-100 rounded-xl divide-y divide-slate-50">
            {applications.map(app => (
              <div key={app.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{app.product_type.replace('_', ' ')}</p>
                  {app.amount && <p className="text-xs text-slate-400">{fmtCurrency(Number(app.amount))}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {app.status === 'APPROVED' ? <CheckCircle size={14} className="text-emerald-600" /> : app.status === 'DECLINED' ? <XCircle size={14} className="text-red-500" /> : null}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[app.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {app.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
