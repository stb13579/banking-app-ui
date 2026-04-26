import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ArrowLeftRight, Landmark, PlusCircle } from 'lucide-react';
import { listAccounts } from '../api/accounts';
import { listLoans } from '../api/loans';
import type { Account, Loan } from '../types';
import { getToken } from '../api/client';

function decodeJwt(token: string): { username?: string; email?: string; sub: string } {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    return { sub: '' };
  }
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function AccountCard({ account }: { account: Account }) {
  const typeColor: Record<string, string> = {
    checking: 'bg-blue-600',
    savings: 'bg-emerald-600',
    money_market: 'bg-violet-600',
    cd: 'bg-amber-600',
  };
  return (
    <Link to="/accounts" className="block">
      <div className={`${typeColor[account.type] ?? 'bg-slate-600'} rounded-xl p-5 text-white`}>
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-75">{account.type.replace('_', ' ')}</p>
            {account.nickname && <p className="text-sm font-medium mt-0.5">{account.nickname}</p>}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full border border-white/30 ${account.status === 'active' ? 'bg-white/20' : 'bg-red-500/30'}`}>
            {account.status}
          </span>
        </div>
        <p className="text-2xl font-bold font-mono">{fmtCurrency(account.balance)}</p>
        <p className="text-xs opacity-60 font-mono mt-1">•••• •••• {account.account_number.slice(-4)}</p>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  const token = getToken()!;
  const { username, email } = decodeJwt(token);
  const displayName = username || email || 'User';

  useEffect(() => {
    Promise.all([listAccounts(), listLoans()])
      .then(([a, l]) => { setAccounts(a); setLoans(l); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);
  const activeLoans = loans.filter(l => l.status === 'active');

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Good morning, {displayName}</h1>
        <p className="text-slate-500 text-sm mt-0.5">Here's your financial overview</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Balance', value: fmtCurrency(totalBalance), icon: TrendingUp, color: 'text-blue-600' },
          { label: 'Accounts', value: accounts.length, icon: ArrowLeftRight, color: 'text-emerald-600' },
          { label: 'Active Loans', value: activeLoans.length, icon: Landmark, color: 'text-amber-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-slate-50 ${color}`}><Icon size={18} /></div>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-lg font-bold text-slate-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Accounts */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-slate-900">Your Accounts</h2>
          <Link to="/accounts" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            <PlusCircle size={14} /> Open Account
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : accounts.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-slate-400 text-sm">No accounts yet.</p>
            <Link to="/accounts" className="mt-2 inline-block text-sm text-blue-600 hover:underline">Open your first account →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {accounts.slice(0, 4).map(a => <AccountCard key={a.id} account={a} />)}
          </div>
        )}
      </div>

      {/* Active loans */}
      {activeLoans.length > 0 && (
        <div>
          <h2 className="font-semibold text-slate-900 mb-3">Active Loans</h2>
          <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50">
            {activeLoans.map(loan => (
              <Link key={loan.id} to={`/loans/${loan.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-900">Loan</p>
                  <p className="text-xs text-slate-400">
                    {loan.term_months ? `${loan.term_months} months · ${(Number(loan.interest_rate) * 100).toFixed(2)}% APR` : 'Personal loan'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-medium text-slate-900">{fmtCurrency(Number(loan.outstanding_balance))}</p>
                  <p className="text-xs text-slate-400">outstanding</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
