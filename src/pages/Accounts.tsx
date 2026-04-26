import { useEffect, useState } from 'react';
import { ChevronRight, PlusCircle } from 'lucide-react';
import { listAccounts, createAccount, listTransactions } from '../api/accounts';
import type { Account, Transaction } from '../types';

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const TYPE_COLORS: Record<string, string> = {
  checking: 'bg-blue-100 text-blue-800',
  savings: 'bg-emerald-100 text-emerald-800',
  money_market: 'bg-violet-100 text-violet-800',
  cd: 'bg-amber-100 text-amber-800',
};

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selected, setSelected] = useState<Account | null>(null);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newType, setNewType] = useState('checking');
  const [newNickname, setNewNickname] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAccounts().then(setAccounts).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selected) listTransactions(selected.id, { limit: 30 }).then(setTxns);
  }, [selected]);

  async function handleCreate() {
    const account = await createAccount(newType, newNickname || undefined);
    setAccounts(a => [...a, account]);
    setShowCreate(false);
    setNewNickname('');
    setSelected(account);
  }

  return (
    <div className="p-6 max-w-5xl flex gap-6">
      {/* Account list */}
      <div className="w-72 flex-shrink-0">
        <div className="flex justify-between items-center mb-3">
          <h1 className="font-bold text-lg text-slate-900">Accounts</h1>
          <button onClick={() => setShowCreate(true)} className="text-blue-600 hover:text-blue-700">
            <PlusCircle size={18} />
          </button>
        </div>

        {showCreate && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Open Account</h3>
            <select value={newType} onChange={e => setNewType(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
              {['checking', 'savings', 'money_market', 'cd'].map(t => (
                <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
            </select>
            <input value={newNickname} onChange={e => setNewNickname(e.target.value)}
              placeholder="Nickname (optional)"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <button onClick={handleCreate} className="flex-1 bg-blue-600 text-white text-sm py-2 rounded-lg">Open</button>
              <button onClick={() => setShowCreate(false)} className="flex-1 border border-slate-200 text-sm py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        )}

        {loading ? <p className="text-sm text-slate-400">Loading…</p> : (
          <div className="space-y-2">
            {accounts.map(a => (
              <button key={a.id} onClick={() => setSelected(a)}
                className={`w-full text-left bg-white border rounded-xl p-4 hover:border-blue-300 transition-colors ${selected?.id === a.id ? 'border-blue-500' : 'border-slate-100'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[a.type] ?? 'bg-slate-100 text-slate-600'}`}>
                      {a.type.replace('_', ' ')}
                    </span>
                    {a.nickname && <p className="text-sm font-medium text-slate-900 mt-1">{a.nickname}</p>}
                  </div>
                  <ChevronRight size={14} className="text-slate-300 mt-0.5" />
                </div>
                <p className="text-lg font-bold font-mono text-slate-900 mt-2">{fmtCurrency(Number(a.balance))}</p>
                <p className="text-xs text-slate-400 font-mono">•••• {a.account_number.slice(-4)}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Account detail */}
      {selected && (
        <div className="flex-1">
          <div className="bg-white border border-slate-100 rounded-xl p-5 mb-4">
            <h2 className="font-bold text-slate-900 mb-3">{selected.nickname || `${selected.type} Account`}</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Balance', fmtCurrency(Number(selected.balance))],
                ['Account Number', selected.account_number],
                ['Routing Number', selected.routing_number],
                ['Interest Rate', `${(Number(selected.interest_rate) * 100).toFixed(2)}% APY`],
                ['Status', selected.status],
                ['Currency', selected.currency],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-slate-400 text-xs">{label}</p>
                  <p className="font-mono font-medium text-slate-900">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <h3 className="font-semibold text-slate-900 mb-2">Recent Transactions</h3>
          {txns.length === 0 ? (
            <p className="text-sm text-slate-400">No transactions yet.</p>
          ) : (
            <div className="bg-white border border-slate-100 rounded-xl divide-y divide-slate-50">
              {txns.map(t => (
                <div key={t.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{t.description || t.type.replace('_', ' ')}</p>
                    <p className="text-xs text-slate-400">{fmtDate(t.created_at)} · {t.reference_number ?? ''}</p>
                  </div>
                  <span className={`font-mono text-sm font-semibold ${t.to_account_id === selected.id ? 'text-emerald-600' : 'text-red-500'}`}>
                    {t.to_account_id === selected.id ? '+' : '-'}{fmtCurrency(Number(t.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
