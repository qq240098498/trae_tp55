import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sofa,
  CalendarDays,
  CreditCard,
  Coffee,
  LogOut,
  Sparkles,
  RefreshCw,
  Users,
  Calculator,
} from 'lucide-react';
import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '状态看板', end: true },
  { to: '/rooms', icon: Sofa, label: '包间管理' },
  { to: '/bookings', icon: CalendarDays, label: '预约管理' },
  { to: '/matchmaking', icon: Users, label: '拼桌搭子' },
  { to: '/checkout', icon: CreditCard, label: '开台结算' },
  { to: '/products', icon: Coffee, label: '商品管理' },
  { to: '/daily-settlement', icon: Calculator, label: '日结扎账' },
];

export default function Layout() {
  const navigate = useNavigate();
  const fetchAll = useStore((s) => s.fetchAll);
  const fetchActiveOrders = useStore((s) => s.fetchActiveOrders);
  const fetchStats = useStore((s) => s.fetchStats);
  const fetchRooms = useStore((s) => s.fetchRooms);

  useEffect(() => {
    fetchAll();
    const timer = setInterval(() => {
      fetchActiveOrders();
      fetchStats();
      fetchRooms();
    }, 10000);
    return () => clearInterval(timer);
  }, [fetchAll, fetchActiveOrders, fetchStats, fetchRooms]);

  const handleRefresh = async () => {
    await fetchAll();
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gradient-to-b from-primary via-primary-700 to-primary-800 text-white flex flex-col shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 paper-texture" />
        <div className="relative p-6 border-b border-gold/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold to-gold-600 flex items-center justify-center shadow-gold">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold gold-gradient-text">雅阁会所</h1>
              <p className="text-xs text-gold-200/70 mt-0.5">预约管理系统</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 relative">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'sidebar-item-active' : 'text-gold-100/80 hover:!bg-gold/10 hover:!text-gold'}`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="relative p-4 border-t border-gold/20 space-y-2">
          <button
            onClick={handleRefresh}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-gold-100/80 hover:bg-gold/10 hover:text-gold transition-all duration-200"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="font-medium">刷新数据</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-gold-100/80 hover:bg-gold/10 hover:text-gold transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">退出登录</span>
          </button>
          <p className="text-xs text-center text-gold-200/40 pt-2">© 2026 雅阁会所</p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white/60 backdrop-blur-md border-b border-cream-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div>
            <h2 className="font-serif text-2xl font-bold text-primary">
              {navItems.find((n) => {
                const path = window.location.pathname;
                return n.end ? path === n.to : path.startsWith(n.to);
              })?.label || '管理系统'}
            </h2>
            <p className="text-sm text-ink-400 mt-0.5">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold text-primary">管理员</p>
              <p className="text-xs text-ink-400">admin@yage.com</p>
            </div>
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center shadow-gold">
              <span className="text-gold font-bold text-lg">A</span>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
