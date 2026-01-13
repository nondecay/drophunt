
import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { Search, Plus, Star, TrendingUp, Users, Bell, Zap, Lock, ChevronDown, Filter, X, Twitter, Calendar, Check, ArrowUpDown, ChevronLeft, ChevronRight, ExternalLink, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Airdrop } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';

// Image Proxy Helper
const getImgUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `https://bxklsejtopzevituoaxk.supabase.co/storage/v1/object/public/${path}`;
};

const PartialStar: React.FC<{ rating: number }> = ({ rating }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const diff = (rating || 0) - (i - 1);
    const fill = Math.min(100, Math.max(0, diff * 100));
    stars.push(
      <div key={i} className="relative w-4 h-4">
        <Star size={14} className="text-slate-200" />
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${fill}%` }}>
          <Star size={14} className="fill-yellow-400 text-yellow-400" />
        </div>
      </div>
    );
  }
  return <div className="flex gap-0.5">{stars}</div>;
};

const CustomSelect: React.FC<{ value: string, options: { label: string, value: string, logo?: string }[], onChange: (v: string) => void, icon?: any }> = ({ value, options, onChange, icon }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const active = options.find(o => o.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl font-bold text-xs shadow-sm hover:border-primary-500 transition-all min-w-[140px]">
        <div className="flex items-center gap-2">
          {active?.logo ? <img src={getImgUrl(active.logo)} className="w-4 h-4 object-contain" /> : icon}
          <span className="truncate">{active?.label || value}</span>
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-2 w-full min-w-[180px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border dark:border-slate-800 p-2 z-[100] animate-in fade-in slide-in-from-top-2">
          {options.map(opt => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all flex items-center justify-between ${value === opt.value ? 'bg-primary-600 text-white shadow-lg' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}>
              <div className="flex items-center gap-2">
                {opt.logo && <img src={getImgUrl(opt.logo)} className="w-4 h-4 object-contain" />}
                {opt.label}
              </div>
              {value === opt.value && <Check size={12} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const AnnouncementSlider: React.FC = () => {
  const { announcements } = useApp();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const itv = setInterval(() => setIndex(i => (i + 1) % announcements.length), 5000);
    return () => clearInterval(itv);
  }, [announcements.length]);

  if (announcements.length === 0) return null;

  const current = announcements[index];

  return (
    <div className="w-full bg-primary-600 text-white py-3 px-6 mb-8 rounded-[1.5rem] shadow-lg shadow-primary-500/20 relative overflow-hidden h-12 flex items-center">
      <div className="flex items-center gap-3 w-full animate-in slide-in-from-bottom-4 duration-700" key={current.id}>
        <span className="text-xl">{current.emoji || '📢'}</span>
        <div className="flex-1 min-w-0">
          {current.link ? (
            <a href={current.link} target="_blank" className="font-black text-xs uppercase tracking-widest truncate block hover:underline flex items-center gap-2 transition-all">
              {current.text} <ExternalLink size={10} />
            </a>
          ) : (
            <span className="font-black text-xs uppercase tracking-widest truncate block">{current.text}</span>
          )}
        </div>
      </div>
      <div className="absolute right-4 flex gap-1.5 opacity-40">
        {announcements.map((_, i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === index ? 'bg-white scale-125' : 'bg-white/40'}`} />
        ))}
      </div>
    </div>
  );
};

const MobileProjectCard: React.FC<{ project: Airdrop, isTracked: boolean, onTrack: () => void, user: any, infofiPlatforms: any[] }> = ({ project, isTracked, onTrack, user, infofiPlatforms }) => {
  const getTypeStyle = (type: string) => {
    const tStr = (type || '').toLowerCase();
    if (tStr === 'free') return 'bg-emerald-500 text-white shadow-sm';
    if (tStr === 'paid') return 'bg-amber-500 text-white shadow-sm';
    if (tStr === 'gas only') return 'bg-sky-500 text-white shadow-sm';
    if (tStr === 'waitlist') return 'bg-primary-600 text-white shadow-sm';
    if (tStr === 'testnet') return 'bg-rose-500 text-white shadow-sm';
    return 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500';
  };

  const getStatusStyle = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'potential') return 'bg-purple-600 text-white';
    if (s.includes('available')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    return 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500';
  };

  const platformObj = project.hasInfoFi ? infofiPlatforms.find(p => p.name === project.platform) : null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 border border-slate-200 dark:border-slate-800 shadow-lg relative overflow-hidden">
      <Link to={`/project/${project.id}`} className="flex items-start gap-4 mb-4">
        <img src={getImgUrl(project.icon) || 'https://picsum.photos/200'} className="w-16 h-16 rounded-2xl object-cover shadow-md" alt="" />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center min-w-0">
            <div className="min-w-0 flex-1 mr-2">
              <div className="flex items-center gap-2 mb-1 min-w-0">
                <h3 className="font-black text-lg uppercase tracking-tight leading-none text-slate-900 dark:text-white truncate block w-full">{project.name}</h3>
                {(project.createdAt || 0) > Date.now() - 7 * 24 * 60 * 60 * 1000 && (
                  <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded animate-pulse shrink-0">NEW</span>
                )}
              </div>
              <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-md mb-2 ${getTypeStyle(project.type)}`}>{project.type}</span>
            </div>
            {user?.username ? (
              <button onClick={(e) => { e.preventDefault(); onTrack(); }} className={`p-2 rounded-xl transition-all shadow-sm active:scale-95 shrink-0 ${isTracked ? 'bg-primary-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary-600'}`}>
                <Plus size={16} className={isTracked ? 'rotate-45' : ''} />
              </button>
            ) : (
              <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-300 rounded-xl shrink-0"><Lock size={16} /></div>
            )}
          </div>
        </div>
      </Link>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Raise</p>
          <p className="font-black text-sm dark:text-white">${project.investment}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Status</p>
          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${getStatusStyle(project.status)}`}>{project.status}</span>
        </div>
        {project.hasInfoFi && (
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl col-span-2 flex items-center justify-between">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Platform</p>
            <div className="flex items-center gap-2">
              {platformObj?.logo && <img src={getImgUrl(platformObj.logo)} className="w-4 h-4 object-contain" />}
              <span className="font-bold text-xs uppercase">{project.platform}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="text-[10px] font-bold text-slate-400"><span className="uppercase tracking-widest mr-2">Date Added:</span>{new Date(project.createdAt || Date.now()).toLocaleDateString()}</div>
        <div className="flex items-center gap-1"><PartialStar rating={project.rating} /><span className="text-[10px] font-bold text-slate-400">{(project.rating || 0).toFixed(1)}</span></div>
      </div>
    </div>
  );
};

const ensureHttp = (url: string) => {
  if (!url) return '#';
  if (url.startsWith('http')) return url;
  return `https://${url}`;
};

export const Home: React.FC<{ category: 'all' | 'infofi' }> = ({ category }) => {
  const { user, airdrops = [], claims = [], toggleTrackProject, addToast, setRequests, logActivity, usersList, infofiPlatforms, t, isDataLoaded } = useApp();

  if (!isDataLoaded) return <LoadingSpinner />;
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const [currentPage, setCurrentPage] = useState(1);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqData, setReqData] = useState({ name: '', twitter: '' });

  const itemsPerPage = 20;

  const filtered = airdrops.filter(a => {
    if (!a) return false;
    const nameMatch = (a.name || '').toLowerCase().includes(search.toLowerCase());
    const isInfoFiProject = a.hasInfoFi === true;
    const categoryMatch = category === 'infofi' ? isInfoFiProject : !isInfoFiProject;

    const platformMatch = category === 'infofi' ? (platformFilter === 'all' || a.platform === platformFilter) : true;
    const typeMatch = typeFilter === 'all' ? true : a.type === typeFilter;
    const statusMatch = statusFilter === 'all' ? true : a.status === statusFilter;
    const ratingMatch = ratingFilter === 'all' ? true : (ratingFilter === 'high' ? a.rating >= 4 : a.rating < 3);

    return nameMatch && categoryMatch && platformMatch && typeMatch && statusMatch && ratingMatch;
  }).sort((a, b) => {
    if (sortBy === 'newest') return (b.createdAt || 0) - (a.createdAt || 0);
    if (sortBy === 'oldest') return (a.createdAt || 0) - (b.createdAt || 0);
    return 0;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleRequestSubmit = () => {
    if (!user) return;
    const lastRequestAt = user.lastActivities?.['project_propose'] || 0;
    if (Date.now() - lastRequestAt < 24 * 60 * 60 * 1000) {
      return addToast(t('projectSubmitLimit'), "error");
    }

    if (!reqData.name) return addToast(t('projectName') + " required", "error");
    setRequests(prev => [...prev, {
      id: Date.now().toString(),
      name: reqData.name,
      funding: "TBA",
      twitterLink: reqData.twitter,
      isInfoFi: category === 'infofi',
      address: user?.address || 'anon',
      timestamp: Date.now()
    }]);
    logActivity('project_propose');
    addToast(t('projectSubmitted'), "success");
    setShowRequestModal(false);
    setReqData({ name: '', twitter: '' });
  };

  const isProjectTracked = (id: string) => user?.trackedProjectIds?.includes(id);

  const getTypeStyle = (type: string) => {
    const tStr = (type || '').toLowerCase();
    if (tStr === 'free') return 'bg-emerald-500 text-white shadow-sm';
    if (tStr === 'paid') return 'bg-amber-500 text-white shadow-sm';
    if (tStr === 'gas only') return 'bg-sky-500 text-white shadow-sm';
    if (tStr === 'waitlist') return 'bg-primary-600 text-white shadow-sm';
    if (tStr === 'testnet') return 'bg-rose-500 text-white shadow-sm';
    return 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500';
  };

  const getStatusStyle = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'potential') return 'bg-purple-600 text-white';
    if (s.includes('available')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    return 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500';
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-0 animate-in fade-in duration-500 pb-20">
      <AnnouncementSlider />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase leading-none">
            {category === 'infofi' ? t('infofiTerminal') : t('dashboardTitle')}
          </h1>
          <p className="text-slate-500 font-medium text-sm sm:text-base tracking-wide mt-2">{t('protocolSub')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {category === 'infofi' && (
            <CustomSelect
              value={platformFilter}
              options={[{ label: t('allPlatforms'), value: 'all' }, ...infofiPlatforms.map(p => ({ label: p.name, value: p.name, logo: p.logo }))]}
              onChange={setPlatformFilter}
              icon={<Filter size={14} className="text-slate-400" />}
            />
          )}

          <CustomSelect
            value={typeFilter}
            options={[{ label: t('allTypes'), value: 'all' }, { label: 'Free', value: 'Free' }, { label: 'Paid', value: 'Paid' }, { label: 'Gas Only', value: 'Gas Only' }, { label: 'Waitlist', value: 'Waitlist' }, { label: 'Testnet', value: 'Testnet' }]}
            onChange={setTypeFilter}
            icon={<Filter size={14} className="text-slate-400" />}
          />
          <CustomSelect
            value={statusFilter}
            options={[{ label: t('allStatus'), value: 'all' }, { label: 'Potential', value: 'Potential' }, { label: 'Claim Available', value: 'Claim Available' }]}
            onChange={setStatusFilter}
            icon={<Zap size={14} className="text-slate-400" />}
          />
          <CustomSelect
            value={ratingFilter}
            options={[{ label: t('allRatings'), value: 'all' }, { label: t('ratingHigh'), value: 'high' }, { label: t('ratingLow'), value: 'low' }]}
            onChange={setRatingFilter}
            icon={<Star size={14} className="text-slate-400" />}
          />
          <CustomSelect
            value={sortBy}
            options={[
              { label: t('newest'), value: 'newest' },
              { label: t('oldest'), value: 'oldest' }
            ]}
            onChange={setSortBy}
            icon={<ArrowUpDown size={14} className="text-slate-400" />}
          />

          <div className="relative group min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder={t('filterTerminal')}
              className="pl-12 pr-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 outline-none w-full font-bold focus:ring-4 focus:ring-primary-500/10 transition-all text-sm"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <button onClick={() => user ? setShowRequestModal(true) : addToast("Connect wallet to submit projects.", "warning")} className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-2xl font-black hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/20 active:scale-95 text-xs uppercase tracking-widest">
            <Plus size={18} /> <span>{t('proposeProject')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 sm:gap-6 sm:mb-12">
        <div className="bg-white dark:bg-slate-900 p-2 sm:p-8 rounded-xl sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-1 sm:gap-6">
          <div className="p-1.5 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg sm:rounded-[1.5rem] text-primary-600">
            <TrendingUp size={16} className="sm:hidden" />
            <TrendingUp size={24} className="hidden sm:block" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0 sm:mb-1 leading-none">{category === 'infofi' ? 'Projects' : 'Airdrops'}</p>
            <p className="text-sm sm:text-2xl font-black tracking-tighter sm:tracking-normal">{filtered.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-2 sm:p-8 rounded-xl sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-1 sm:gap-6">
          <div className="p-1.5 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg sm:rounded-[1.5rem] text-emerald-500">
            <Users size={16} className="sm:hidden" />
            <Users size={24} className="hidden sm:block" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0 sm:mb-1 leading-none">{t('activeHunters')}</p>
            <p className="text-sm sm:text-2xl font-black tracking-tighter sm:tracking-normal">{usersList.length.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-2 sm:p-8 rounded-xl sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-1 sm:gap-6">
          <div className="p-1.5 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg sm:rounded-[1.5rem] text-amber-500">
            <Bell size={16} className="sm:hidden" />
            <Bell size={24} className="hidden sm:block" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0 sm:mb-1 leading-none">Claims</p>
            <p className="text-sm sm:text-2xl font-black tracking-tighter sm:tracking-normal">{claims.filter(c => c.type === 'claim').length}</p>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden grid grid-cols-1 gap-4 mb-8">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-400 font-black uppercase tracking-widest border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">No projects found.</div>
        ) : (
          currentItems.map(a => a && (
            <MobileProjectCard
              key={a.id}
              project={a}
              isTracked={isProjectTracked(a.id)}
              onTrack={() => toggleTrackProject(a.id)}
              user={user}
              infofiPlatforms={infofiPlatforms}
            />
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{t('protocol')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{t('indexedDate')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{t('capitalRaise')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{t('status')}</th>
                {category === 'infofi' && <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{t('platformLabel')}</th>}
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{t('rating')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right">{t('nodeSync')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={category === 'infofi' ? 7 : 6} className="p-20 text-center text-slate-400 font-black uppercase tracking-widest">No projects detected in this sector.</td>
                </tr>
              ) : (
                currentItems.map((a) => {
                  if (!a) return null;
                  const platformObj = a.hasInfoFi ? infofiPlatforms.find(p => p.name === a.platform) : null;
                  return (
                    <tr key={a.id} className="group hover:bg-primary-50/30 dark:hover:bg-primary-900/5 transition-all">
                      <td className="px-6 py-3">
                        <Link to={`/project/${a.id}`} className="flex items-center gap-4">
                          <div className="relative shrink-0">
                            <img src={getImgUrl(a.icon) || 'https://picsum.photos/200'} className="w-12 h-12 rounded-xl object-cover shadow-lg group-hover:scale-110 transition-transform" alt="" />
                            {(a.createdAt || 0) > Date.now() - 7 * 24 * 60 * 60 * 1000 && (
                              <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-sm z-10 animate-pulse">NEW</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-black text-base block leading-tight mb-1 group-hover:text-primary-600 transition-colors uppercase truncate">{a.name}</span>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${getTypeStyle(a.type)}`}>{a.type}</span>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-[11px] font-bold text-slate-500 whitespace-nowrap">{new Date(a.createdAt || Date.now()).toLocaleDateString()}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center text-slate-900 dark:text-white font-bold gap-0.5">
                          <span className="text-2xl">$</span>
                          <span className="text-2xl">{a.investment}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest whitespace-nowrap ${getStatusStyle(a.status)}`}>
                          {a.status}
                        </span>
                      </td>
                      {category === 'infofi' && <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 transition-all whitespace-nowrap`}>
                            {platformObj?.logo && <img src={getImgUrl(platformObj.logo)} className="w-3 h-3 object-contain" />}
                            {a.platform || 'N/A'}
                          </span>
                        </div>
                      </td>}
                      <td className="px-6 py-3"><div className="flex flex-col gap-1"><PartialStar rating={a.rating} /><span className="text-[10px] font-bold text-slate-400">{(a.rating || 0).toFixed(1)}</span></div></td>
                      <td className="px-6 py-3 text-right">
                        {user?.username ? (
                          <button onClick={() => toggleTrackProject(a.id)} className={`p-3 rounded-xl transition-all shadow-sm active:scale-95 ${isProjectTracked(a.id) ? 'bg-primary-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary-600'}`}>
                            <Plus size={20} className={isProjectTracked(a.id) ? 'rotate-45' : ''} />
                          </button>
                        ) : (
                          <div className="flex justify-end"><div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-300 rounded-xl cursor-not-allowed group/lock relative"><Lock size={20} /><div className="absolute bottom-full right-0 mb-2 hidden group-hover/lock:block bg-slate-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap">Connect Wallet to Track</div></div></div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-3 rounded-2xl bg-white dark:bg-slate-900 border dark:border-slate-800 text-slate-400 hover:text-primary-600 shadow-sm transition-all"><ChevronLeft size={20} /></button>
          <div className="flex gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-11 h-11 rounded-2xl font-black text-xs transition-all ${currentPage === i + 1 ? 'bg-primary-600 text-white shadow-xl shadow-primary-500/30 scale-110' : 'bg-white dark:bg-slate-900 border dark:border-slate-800 text-slate-400'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-3 rounded-2xl bg-white dark:bg-slate-900 border dark:border-slate-800 text-slate-400 hover:text-primary-600 shadow-sm transition-all"><ChevronRight size={20} /></button>
        </div>
      )}

      {showRequestModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] p-10 shadow-2xl relative border dark:border-slate-800">
            <button onClick={() => setShowRequestModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-red-500 transition-colors"><X size={24} /></button>
            <h3 className="text-3xl font-black mb-8 tracking-tighter uppercase leading-none">{t('proposeProject')}</h3>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 ml-1 tracking-widest">{t('projectName')}</label>
                <input type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl font-bold text-sm outline-none border border-transparent focus:border-primary-500 transition-all shadow-inner" placeholder="e.g. Project X" value={reqData.name} onChange={e => setReqData({ ...reqData, name: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 ml-1 tracking-widest flex items-center gap-2"><Twitter size={10} /> {t('projectTwitter')}</label>
                <input type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl font-bold text-sm outline-none border border-transparent focus:border-primary-500 transition-all shadow-inner" placeholder="@handle" value={reqData.twitter} onChange={e => setReqData({ ...reqData, twitter: e.target.value })} />
              </div>
            </div>
            <button onClick={handleRequestSubmit} className="w-full mt-10 py-5 bg-primary-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
              <Zap size={18} /> {t('submitTransmission')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string, color: string }> = ({ icon, label, value, color }) => (
  <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
    <div className={`p-4 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] ${color}`}>{icon}</div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
      <p className="text-3xl font-black tracking-tighter leading-none">{value}</p>
    </div>
  </div>
);
