
import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useApp } from '../AppContext';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  LayoutDashboard, Calendar as CalendarIcon, Bell, Moon, Sun,
  User as UserIcon, Globe, Menu, X, ShieldAlert, ChevronDown, Zap,
  Ticket, CheckCircle, AlertCircle, Mail, Sun as SunIcon,
  Sparkles, ArrowUpCircle, Sword, LogOut, Target, UserPlus, Users, Lock, Wrench, Droplets, ShieldCheck, Twitter
} from 'lucide-react';

const DiscordIcon = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.699.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
  </svg>
);

const ToastItem: React.FC<{ toast: any, onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const [timeLeft, setTimeLeft] = useState(5);
  const [progress, setProgress] = useState(100);
  const duration = 5000;
  const step = 50;

  useEffect(() => {
    const totalSteps = duration / step;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const nextProgress = 100 - (currentStep / totalSteps) * 100;
      const nextTime = Math.floor(5 - (currentStep * step) / 1000);

      setProgress(nextProgress);
      setTimeLeft(nextTime >= 0 ? nextTime : 0);

      if (currentStep >= totalSteps) {
        clearInterval(interval);
      }
    }, step);

    return () => clearInterval(interval);
  }, []);

  const color = toast.type === 'error' ? 'rgb(239, 68, 68)' : toast.type === 'warning' ? 'rgb(245, 158, 11)' : 'rgb(16, 185, 129)';
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border bg-white dark:bg-slate-900 animate-in slide-in-from-right duration-300 max-w-sm`}
      style={{ borderColor: color }}>
      <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
        <svg className="w-10 h-10 -rotate-90">
          <circle cx="20" cy="20" r={radius} fill="transparent" stroke="currentColor" strokeWidth="3" className="text-slate-100 dark:text-slate-800" />
          <circle cx="20" cy="20" r={radius} fill="transparent" stroke={color} strokeWidth="3" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-[50ms]" />
        </svg>
        <span className="absolute font-black text-xs" style={{ color }}>{timeLeft}</span>
      </div>
      <div className="flex-1">
        <span className="font-bold text-sm line-clamp-2">{toast.message}</span>
      </div>
      <button onClick={() => onRemove(toast.id)} className="ml-2 text-slate-400 hover:text-slate-600 transition-colors">
        <X size={16} />
      </button>
    </div>
  );
};

const SidebarLink: React.FC<{ to: string, icon: React.ReactNode, label: string, active: boolean, onClick?: () => void, badge?: number }> = ({ to, icon, label, active, onClick, badge }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${active
      ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
      : 'text-slate-500 hover:bg-primary-50 dark:hover:bg-slate-800 hover:text-primary-600'
      }`}>
    <div className="flex items-center gap-3">
      {icon}
      <span className="font-black text-xs uppercase tracking-wider">{label}</span>
    </div>
    {badge !== undefined && badge > 0 && (
      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${active ? 'bg-white text-primary-600' : 'bg-red-500 text-white'}`}>
        {badge}
      </span>
    )}
  </Link>
);

export const Layout: React.FC = () => {
  const { theme, toggleTheme, lang, setLang, t, user, isVerified, verifyWallet, logout, setUsername, toasts, removeToast, inbox } = useApp();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [tempUsername, setTempUsername] = useState('');

  const langMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = inbox.filter(m => !m.isRead).length;
  const needsUsername = user && isVerified && !user.username;
  const needsVerification = user && !isVerified;

  // Ban check
  const isBanned = user && (user.isPermaBanned || (user.bannedUntil && user.bannedUntil > Date.now()));
  const banDaysLeft = user?.bannedUntil ? Math.ceil((user.bannedUntil - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) setShowLangMenu(false);
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isBanned) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-8 animate-pulse shadow-[0_0_50px_rgba(239,68,68,0.3)]">
          <Lock size={48} />
        </div>
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">ACCESS DENIED</h1>
        <p className="text-slate-400 max-w-md font-medium text-lg mb-10">
          {user?.isPermaBanned
            ? "Your identity has been permanently terminated from the protocol."
            : `Protocol access suspended for violation. Return in ${banDaysLeft} days.`}
        </p>
        <button onClick={logout} className="px-8 py-3 bg-red-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl">Disconnect Hub</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">

      <div className="fixed top-6 right-6 z-[200] flex flex-col gap-3">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} overflow-y-auto`}>
        <div className="flex flex-col min-h-full p-6 relative">
          <div className="flex items-center justify-between mb-8 w-full">
            <Link to="/" className="flex items-center gap-3 group min-w-0 flex-1">
              <img src="/logo.jpg" className="w-8 h-8 sm:w-10 sm:h-10 object-contain shadow-lg rounded-xl shrink-0" alt="Logo" />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 relative">
                  <span className="text-lg sm:text-2xl font-black tracking-tight text-primary-600 uppercase leading-none truncate">DROPHUNT.IO</span>
                  <span className="absolute -top-3 right-0 bg-primary-500/10 text-white border border-primary-500/20 text-[6px] sm:text-[7px] font-black px-1.5 py-0.5 rounded animate-shake-rare">BETA</span>
                </div>
              </div>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 bg-primary-50 text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30 flex-shrink-0 ml-2"><X size={16} /></button>
          </div>

          <style>{`
            @keyframes shake-rare {
              0%, 90% { transform: rotate(0deg); }
              91% { transform: rotate(-5deg); }
              93% { transform: rotate(5deg); }
              95% { transform: rotate(-5deg); }
              97% { transform: rotate(5deg); }
              100% { transform: rotate(0deg); }
            }
            .animate-shake-rare {
              animation: shake-rare 12s infinite;
              display: inline-block;
            }
          `}</style>
          <nav className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2 mt-4">DROPHUNT.IO</p>

            <SidebarLink to="/" icon={<LayoutDashboard size={18} />} label={t('airdrops')} active={location.pathname === '/'} onClick={() => setSidebarOpen(false)} />
            <SidebarLink to="/infofi" icon={<Zap size={18} />} label={t('infofi')} active={location.pathname === '/infofi'} onClick={() => setSidebarOpen(false)} />
            <SidebarLink to="/calendar" icon={<CalendarIcon size={18} />} label={t('calendar')} active={location.pathname === '/calendar'} onClick={() => setSidebarOpen(false)} />
            <SidebarLink to="/claims" icon={<Bell size={18} />} label={t('claims')} active={location.pathname === '/claims'} onClick={() => setSidebarOpen(false)} />
            <SidebarLink to="/presales" icon={<Ticket size={18} />} label={t('presales')} active={location.pathname === '/presales'} onClick={() => setSidebarOpen(false)} />
            <SidebarLink to="/investors" icon={<Users size={18} />} label={t('investors')} active={location.pathname === '/investors'} onClick={() => setSidebarOpen(false)} />
            <SidebarLink to="/tools" icon={<Wrench size={18} />} label={t('tools')} active={location.pathname === '/tools'} onClick={() => setSidebarOpen(false)} />

            {user && (
              <>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2 mt-6">{t('myHub')}</p>
                <SidebarLink to="/my-airdrops" icon={<Target size={18} />} label={t('myAirdrops')} active={location.pathname === '/my-airdrops'} onClick={() => setSidebarOpen(false)} />
              </>
            )}

            {user && (
              <>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2 mt-6">{t('onChainActivities')}</p>
                <SidebarLink to="/daily-gm" icon={<SunIcon size={18} />} label={t('dailyGm')} active={location.pathname === '/daily-gm'} onClick={() => setSidebarOpen(false)} />
                <SidebarLink to="/daily-mint" icon={<Sparkles size={18} />} label={t('dailyMint')} active={location.pathname === '/daily-mint'} onClick={() => setSidebarOpen(false)} />
                <SidebarLink to="/deploy" icon={<ArrowUpCircle size={18} />} label={t('deploy')} active={location.pathname === '/deploy'} onClick={() => setSidebarOpen(false)} />
                <SidebarLink to="/rpg" icon={<Sword size={18} />} label={t('onChainRpg')} active={location.pathname === '/rpg'} onClick={() => setSidebarOpen(false)} />
              </>
            )}

            <SidebarLink to="/faucets" icon={<Droplets size={18} />} label={t('faucets')} active={location.pathname === '/faucets'} onClick={() => setSidebarOpen(false)} />

            {(user?.role === 'admin' || user?.memberStatus === 'Admin') && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <SidebarLink to="/admin" icon={<ShieldAlert size={18} />} label={t('adminHq')} active={location.pathname === '/admin'} onClick={() => setSidebarOpen(false)} />
              </div>
            )}
          </nav>


          <footer className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">DROPHUNT.IO © 2026</p>
            <div className="flex justify-center gap-4 text-slate-400">
              <a href="https://x.com/drophunt" target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 transition-colors">
                <Twitter size={18} />
              </a>
              <a href="https://discord.gg/drophunt" target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 transition-colors">
                <DiscordIcon size={18} />
              </a>
            </div>
          </footer>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-end p-4 lg:px-8 lg:py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-800 absolute left-4"><Menu size={24} /></button>

          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:text-primary-600 transition-colors shadow-sm">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <div className="relative" ref={langMenuRef}>
              <button onClick={() => setShowLangMenu(!showLangMenu)} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold uppercase transition-colors ${showLangMenu ? 'text-primary-600' : ''}`}>
                <Globe size={18} />
                <span className="hidden sm:inline">{lang}</span>
              </button>
              {showLangMenu && (
                <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-1 z-[60]">
                  <button onClick={() => { setLang('en'); setShowLangMenu(false); }} className={`w-full text-left px-4 py-2 hover:bg-primary-50 dark:hover:bg-slate-700 rounded-lg text-sm font-bold ${lang === 'en' ? 'text-primary-600' : ''}`}>English</button>
                  <button onClick={() => { setLang('tr'); setShowLangMenu(false); }} className={`w-full text-left px-4 py-2 hover:bg-primary-50 dark:hover:bg-slate-700 rounded-lg text-sm font-bold ${lang === 'tr' ? 'text-primary-600' : ''}`}>Türkçe</button>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

            <ConnectButton accountStatus="address" showBalance={false} chainStatus="icon" />

            {user && isVerified && (
              <div className="relative ml-2" ref={profileMenuRef}>
                <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-2 p-1 pl-3 bg-slate-100 dark:bg-slate-800 rounded-full transition-all border border-transparent hover:border-primary-500">
                  <img src={user.avatar} className="w-8 h-8 rounded-full object-cover" />
                  <ChevronDown size={14} className="text-slate-400 mr-1" />
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-2 z-[60] animate-in slide-in-from-top-2">
                    <div className="px-4 py-3 border-b dark:border-slate-800 mb-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('loggedAs')}</p>
                      <p className="text-sm font-black text-primary-600 truncate">{user.username || user.address}</p>
                    </div>
                    <Link to="/profile" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary-50 dark:hover:bg-slate-800 rounded-xl text-sm font-bold transition-colors"><UserIcon size={18} /> {t('profile')}</Link>
                    <Link to="/my-airdrops" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary-50 dark:hover:bg-slate-800 rounded-xl text-sm font-bold transition-colors"><Target size={18} /> {t('myAirdrops')}</Link>
                    <Link to="/inbox" onClick={() => setShowProfileMenu(false)} className="flex items-center justify-between px-4 py-2.5 hover:bg-primary-50 dark:hover:bg-slate-800 rounded-xl text-sm font-bold transition-colors">
                      <div className="flex items-center gap-3"><Mail size={18} /> {t('messages')}</div>
                      {unreadCount > 0 && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                    </Link>
                    <div className="h-px bg-slate-100 dark:border-slate-800 my-1" />
                    <button onClick={() => { logout(); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl text-sm font-bold transition-colors text-red-600">
                      <LogOut size={18} /> {t('disconnect')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 lg:p-8"><Outlet /></div>
      </main>
    </div>
  );
};
