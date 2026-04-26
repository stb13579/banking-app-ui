import { useEffect, useState, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { getLoan, getLoanSchedule, repayLoan } from '../api/loans';
import { listAccounts } from '../api/accounts';
import type { Account, AmortizationEntry, Loan } from '../types';

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export default function LoanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [schedule, setSchedule] = useState<AmortizationEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [repayForm, setRepayForm] = useState({ account_id: '', amount: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([getLoan(id), getLoanSchedule(id), listAccounts()])
      .then(([l, s, a]) => { setLoan(l); setSchedule(s); setAccounts(a); })
      .catch(console.error);
  }, [id]);

  async function handleRepay(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError('');
    setLoading(true);
    try {
      const updated = await repayLoan(id, repayForm.account_id, parseFloat(repayForm.amount));
      setLoan(updated);
      setSuccess(`Payment of ${fmtCurrency(parseFloat(repayForm.amount))} applied.`);
      setRepayForm(f => ({ ...f, amount: '' }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Repayment failed');
    } finally {
      setLoading(false);
    }
  }

  if (!loan) return <div className="p-6 text-slate-400 text-sm">Loading…</div>;

  return (
    <div className="p-6 max-w-3xl">
      <button onClick={() => navigate('/loans')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-5">
        <ArrowLeft size={14} /> Back to Loans
      </button>

      {/* Loan summary */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 mb-5">
        <div className="grid grid-cols-3 gap-4 text-sm">
          {[
            ['Principal', fmtCurrency(Number(loan.principal))],
            ['Outstanding', fmtCurrency(Number(loan.outstanding_balance))],
            ['APR', `${(Number(loan.interest_rate) * 100).toFixed(2)}%`],
            ['Term', loan.term_months ? `${loan.term_months} months` : '—'],
            ['Monthly Payment', loan.monthly_payment ? fmtCurrency(Number(loan.monthly_payment)) : '—'],
            ['Status', loan.status.replace('_', ' ')],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-slate-400">{label}</p>
              <p className="font-medium text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Repay form */}
      {loan.status === 'active' && (
        <div className="bg-white border border-slate-100 rounded-xl p-5 mb-5">
          <h3 className="font-semibold text-slate-900 mb-4">Make a Payment</h3>
          {success && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 rounded-lg px-3 py-2.5 text-sm mb-3">
              <CheckCircle size={14} /> {success}
            </div>
          )}
          <form onSubmit={handleRepay} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Pay from account</label>
              <select required value={repayForm.account_id}
                onChange={e => setRepayForm(f => ({ ...f, account_id: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="">Select…</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.nickname || a.type} · {a.account_number}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount ($)</label>
              <input required type="text" inputMode="decimal" pattern="^\d+(\.\d{1,2})?$" value={repayForm.amount}
                onChange={e => setRepayForm(f => ({ ...f, amount: e.target.value }))}
                placeholder={loan.monthly_payment ? String(Number(loan.monthly_payment).toFixed(2)) : '0.00'}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <button type="submit" disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg h-9">
              {loading ? '…' : 'Pay'}
            </button>
          </form>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
      )}

      {/* Amortization schedule */}
      {schedule.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-900 mb-3">Amortization Schedule</h3>
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Month', 'Payment', 'Principal', 'Interest', 'Balance'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {schedule.map(row => (
                    <tr key={row.month} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-slate-600">{row.month}</td>
                      <td className="px-4 py-2.5 font-mono">{fmtCurrency(Number(row.payment))}</td>
                      <td className="px-4 py-2.5 font-mono text-blue-600">{fmtCurrency(Number(row.principal))}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-500">{fmtCurrency(Number(row.interest))}</td>
                      <td className="px-4 py-2.5 font-mono">{fmtCurrency(Number(row.balance))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
