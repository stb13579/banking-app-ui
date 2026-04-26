import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CreditCard, ArrowLeftRight,
  Landmark, HeadphonesIcon, ShoppingBag, LogOut,
} from 'lucide-react';
import { clearToken } from '../api/client';

const nav = [
  { to: '/',          label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/accounts',  label: 'Accounts',   icon: CreditCard },
  { to: '/transfers', label: 'Transfers',  icon: ArrowLeftRight },
  { to: '/loans',     label: 'Loans',      icon: Landmark },
  { to: '/products',  label: 'Products',   icon: ShoppingBag },
  { to: '/support',   label: 'Support',    icon: HeadphonesIcon },
];

export default function Layout() {
  const navigate = useNavigate();

  function logout() {
    clearToken();
    navigate('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-slate-900 flex flex-col">
        <div className="px-6 py-5 border-b border-slate-700">
          <span className="text-white font-bold text-lg tracking-tight">BankingApp</span>
          <p className="text-slate-400 text-xs mt-0.5">Demo Platform</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-700">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <Outlet />
      </main>
    </div>
  );
}
