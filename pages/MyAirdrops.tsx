
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { Plus, CheckCircle2, Trash2, ListChecks, Zap, Clock, PieChart, RefreshCw, Target, ArrowUpRight, ChevronLeft, ChevronRight, Mail, DollarSign, Calendar, Filter, X, ChevronDown, Check, ShieldAlert } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { getImgUrl } from '../utils/getImgUrl';

export const MyAirdrops: React.FC = () => {
  const { airdrops, userTasks, setUserTasks, userClaims, setUserClaims, addToast, user, toggleTrackProject, t, inbox, manageTodo, manageUserClaim, infofiPlatforms, isDataLoaded } = useApp();
  const { isConnected } = useAccount();

  // Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'claim' | 'task', id: string } | null>(null);

  const [activeTab, setActiveTab] = useState<'tasks' | 'airdrops' | 'infofi' | 'completed' | 'claimed'>('tasks');
  const [showAdd, setShowAdd] = useState(false);
  const [showClaimAdd, setShowClaimAdd] = useState(false);
  const [isMonthDropOpen, setMonthDropOpen] = useState(false);
  const monthDropRef = useRef<HTMLDivElement>(null);

  if (!isDataLoaded) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-800 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">Initializing Protocol...</p>
      </div>
    );
  }

  // Verification Gate
  const { isVerified, verifyWallet } = useApp();
  if (isConnected && !isVerified) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-full flex items-center justify-center mb-8 shadow-inner ring-8 ring-white dark:ring-slate-900">
          <ShieldAlert size={48} />
        </div>
        <h2 className="text-4xl font-black tracking-tighter mb-4">Restricted Access</h2>
        <p className="text-slate-500 font-medium max-w-md mx-auto mb-8 text-lg">
          This section contains sensitive hunter data. You must verify your wallet ownership to proceed.
        </p>
        <button
          onClick={() => verifyWallet()}
          className="px-10 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-3"
        >
          <Zap size={20} /> Sign & Verify Access
        </button>
      </div>
    );
  }

  const [newTask, setNewTask] = useState({ note: '', airdropId: 'custom', reminder: 'none' as any, deadline: '' });
  const [newClaim, setNewClaim] = useState({ projectName: '', expense: 0, claimedToken: '', tokenCount: 0, earning: 0, claimedDate: new Date().toISOString().split('T')[0] });
  const [claimMonthFilter, setClaimMonthFilter] = useState('all');

  // Derived State Definitions
  // Restore "Old Look": show project if it is in user.trackedProjectIds OR has a claim/task
  const trackedIds = useMemo(() => user?.trackedProjectIds || [], [user]);

  const trackedAirdrops = useMemo(() => {
    // Exclude items that are InfoFi platforms (either by ID match or hasInfoFi flag)
    const infoFiIds = new Set((infofiPlatforms || []).map(i => i.id));
    return airdrops.filter(p => !p.hasInfoFi && !infoFiIds.has(p.id) && (trackedIds.includes(p.id) || userClaims.some(c => c.projectName === p.name) || userTasks.some(t => t.airdropId === p.id)));
  }, [airdrops, trackedIds, userClaims, userTasks, infofiPlatforms]);

  const trackedInfoFi = useMemo(() => {
    // Include explicit InfoFi platforms AND Airdrops that are marked as InfoFi
    const explicitInfoFi = (infofiPlatforms || []).filter(p => trackedIds.includes(p.id));
    const airdropInfoFi = airdrops.filter(p => p.hasInfoFi && trackedIds.includes(p.id));

    // Merge unique by ID
    const combined = [...explicitInfoFi, ...airdropInfoFi];
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    return unique;
  }, [infofiPlatforms, airdrops, trackedIds]);

  const activeTasksCount = useMemo(() => userTasks.filter(t => !t.completed).length, [userTasks]);

  // Calculate Earnings
  const totalEarning = useMemo(() => userClaims.reduce((acc, curr) => acc + (Number(curr.earning) || 0), 0), [userClaims]);

  // Dummy values for missing context data to prevent crash
  const unreadAirdropMessages = 0;
  const unreadInfoFiMessages = 0;

  // Available months calculation
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    userClaims.forEach(c => {
      if (c.claimedDate) months.add(c.claimedDate.substring(0, 7)); // YYYY-MM
    });
    return Array.from(months).sort().reverse();
  }, [userClaims]);

  // Newest to Oldest sorting for tasks
  const manualTasks = useMemo(() => {
    return userTasks.filter(t => !t.completed && t.airdropId === 'custom')
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [userTasks]);

  const completedTasks = useMemo(() => {
    return userTasks.filter(t => t.completed)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [userTasks]);

  const [taskPage, setTaskPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const paginatedTasks = useMemo(() => {
    const start = (taskPage - 1) * ITEMS_PER_PAGE;
    return manualTasks.slice(start, start + ITEMS_PER_PAGE);
  }, [manualTasks, taskPage]);

  const totalTaskPages = Math.ceil(manualTasks.length / ITEMS_PER_PAGE);

  // Claim Filtering & Calculations
  const filteredClaims = useMemo(() => {
    if (claimMonthFilter === 'all') return userClaims;
    return userClaims.filter(c => c.claimedDate?.startsWith(claimMonthFilter));
  }, [userClaims, claimMonthFilter]);

  const totalExpense = useMemo(() => filteredClaims.reduce((acc, curr) => acc + (Number(curr.expense) || 0), 0), [filteredClaims]);
  // Re-calculate totalEarning based on filter if needed, but usually Total Earning is Global. 
  // However, the requested UI implies totals for the view. Let's keep Total Earning global as per dashboard, 
  // but for the Claims tab, users might expect filtered totals?
  // The UI shows "Net Yield" which implies filtered.
  // Let's calculate filtered earning/profit for the Claims tab stat cards.
  const filteredEarning = useMemo(() => filteredClaims.reduce((acc, curr) => acc + (Number(curr.earning) || 0), 0), [filteredClaims]);
  const totalProfit = filteredEarning - totalExpense;

  const addTask = async () => {
    if (!newTask.note) return;
    await manageTodo('add', {
      note: newTask.note,
      airdropId: newTask.airdropId, // 'custom' or ID
      deadline: newTask.deadline || null,
      reminder: newTask.reminder, // 'none', 'daily', etc.
      completed: false,
      createdAt: Date.now()
    });
    setNewTask({ note: '', airdropId: 'custom', reminder: 'none', deadline: '' });
    setShowAdd(false);
    addToast(t('taskAdded'), 'success');
  };

  const addClaimEntry = async () => {
    if (!newClaim.projectName) return;
    await manageUserClaim('add', {
      projectName: newClaim.projectName,
      expense: newClaim.expense || 0,
      claimedToken: newClaim.claimedToken || '',
      tokenCount: newClaim.tokenCount || 0,
      earning: newClaim.earning || 0,
      claimedDate: newClaim.claimedDate || new Date().toISOString().split('T')[0]
    });
    setNewClaim({ projectName: '', expense: 0, claimedToken: '', tokenCount: 0, earning: 0, claimedDate: new Date().toISOString().split('T')[0] });
    setShowClaimAdd(false);
    addToast('Claim recorded successfully!', 'success');
  };

  // Auto-Cleanup Effect: Keep only 20 completed non-recurring tasks
  useEffect(() => {
    const cleanupOldTasks = async () => {
      const completed = userTasks.filter(t => t.completed && (!t.reminder || t.reminder === 'none'))
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); // Oldest first

      if (completed.length > 20) {
        const toDelete = completed.slice(0, completed.length - 20);
        for (const t of toDelete) {
          await manageTodo('remove', t.id);
        }
      }
    };
    if (userTasks.length > 0) cleanupOldTasks();
  }, [userTasks.length]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-primary-500/10 rounded-full flex items-center justify-center mb-6 ring-4 ring-primary-500/20">
          <Target size={48} className="text-primary-500" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Track Your Airdrop Journey</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8 text-lg font-medium">
          Connect your wallet to track airdrops, receive notifications, and manage your daily tasks.
        </p>
        <ConnectButton label="Connect Wallet" />
      </div>
    );
  }

  // Not Verified Gating
  // Note: user.username check is a proxy for strictly needing the modal, but 'isVerified' is the key.
  // We check global 'isVerified' from context.
  // The user requested: "Verify your wallet ownership to use this feature."
  const needsVerification = !useApp().isVerified;

  if (needsVerification) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6 ring-4 ring-yellow-500/20">
          <ShieldAlert size={48} className="text-yellow-500" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Verification Required</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8 text-lg font-medium">
          Verify your wallet ownership to access your personal dashboard.
        </p>
        <button
          onClick={useApp().verifyWallet}
          className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-primary-600/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          Sign and Verify
        </button>
      </div>
    );
  }


  // Fallback if user is basic connected but state sync needs a moment
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* User Hub Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <DashboardStat label="Tracked Airdrops" val={trackedAirdrops?.length || 0} icon={<Target size={20} />} color="bg-primary-600" />
        {/* <DashboardStat label="Tracked InfoFi" val={trackedInfoFi?.length || 0} icon={<Zap size={20} />} color="bg-primary-600" /> */}
        <DashboardStat label="Pending Tasks" val={activeTasksCount || 0} icon={<ListChecks size={20} />} color="bg-rose-600" />
        <DashboardStat label="Total Earning" val={`$${(totalEarning || 0).toLocaleString()}`} icon={<DollarSign size={20} />} color="bg-emerald-600" />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div><h1 className="text-4xl font-black tracking-tighter mb-2">{t('operationCenter')}</h1><p className="text-slate-500 font-medium tracking-wide">{t('operationSub')}</p></div>
        <div className="flex gap-2 w-full md:w-auto">
          {activeTab === 'tasks' && (
            <button onClick={() => setShowAdd(true)} className="flex-1 md:flex-none px-6 py-3.5 bg-primary-600 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform uppercase tracking-widest"><Plus size={18} /> {t('newTask')}</button>
          )}
        </div>
      </div>

      {/* Add Task Modal - Redesigned */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black">{t('addNewTask')}</h3>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">{t('taskNote')}</label>
                <input
                  type="text"
                  value={newTask.note}
                  onChange={e => setNewTask({ ...newTask, note: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="e.g. Claim daily faucet"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">{t('recurrence')}</label>
                  <select
                    value={newTask.reminder}
                    onChange={e => setNewTask({ ...newTask, reminder: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 font-bold text-sm outline-none cursor-pointer"
                  >
                    <option value="none">{t('none')}</option>
                    <option value="daily">{t('daily')}</option>
                    <option value="weekly">{t('weekly')}</option>
                    <option value="monthly">{t('monthly')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">{t('linkAirdrop')}</label>
                  <select
                    value={newTask.airdropId}
                    onChange={e => setNewTask({ ...newTask, airdropId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 font-bold text-sm outline-none cursor-pointer"
                  >
                    <option value="custom">{t('customTask')}</option>
                    {trackedAirdrops.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>

              <button
                onClick={addTask}
                disabled={!newTask.note}
                className="w-full mt-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary-600/20 active:scale-95 transition-all"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}


      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-72 flex lg:flex-col gap-2 overflow-x-auto pb-4 shrink-0">
          <NavBtn icon={<ListChecks size={18} />} label={t('tasks').toUpperCase()} active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} count={manualTasks.length} />
          <NavBtn icon={<Target size={18} />} label={`${t('airdrops').toUpperCase()} (${trackedAirdrops.length})`} active={activeTab === 'airdrops'} onClick={() => setActiveTab('airdrops')} notificationCount={unreadAirdropMessages} colorClass="bg-primary-600" />
          {/* <NavBtn icon={<Zap size={18} />} label={`${t('infofi').toUpperCase()} (${trackedInfoFi.length})`} active={activeTab === 'infofi'} onClick={() => setActiveTab('infofi')} notificationCount={unreadInfoFiMessages} colorClass="bg-primary-600" /> */}
          <NavBtn icon={<CheckCircle2 size={18} />} label={t('completed').toUpperCase()} active={activeTab === 'completed'} onClick={() => setActiveTab('completed')} count={completedTasks.length} />
          <NavBtn icon={<PieChart size={18} />} label={t('claimed').toUpperCase()} active={activeTab === 'claimed'} onClick={() => setActiveTab('claimed')} />
        </div>

        <div className="flex-1">
          {activeTab === 'claimed' && (
            <div className="mb-6 flex justify-end">
              <div className="relative" ref={monthDropRef}>
                <button onClick={() => setMonthDropOpen(!isMonthDropOpen)} className="flex items-center gap-3 bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border dark:border-slate-800 shadow-sm hover:border-primary-500 transition-all">
                  <Calendar size={16} className="text-slate-400" />
                  <div className="text-left">
                    <p className="text-[8px] font-black uppercase text-slate-400 leading-none mb-0.5">Filter Period</p>
                    <p className="text-xs font-black uppercase">{claimMonthFilter === 'all' ? t('allMonths') : claimMonthFilter}</p>
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${isMonthDropOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMonthDropOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-1.5 animate-in fade-in slide-in-from-top-2">
                    <button onClick={() => { setClaimMonthFilter('all'); setMonthDropOpen(false); }} className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-between ${claimMonthFilter === 'all' ? 'bg-primary-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}>{t('allMonths')} {claimMonthFilter === 'all' && <Check size={12} />}</button>
                    {availableMonths.map(m => (
                      <button key={m} onClick={() => { setClaimMonthFilter(m); setMonthDropOpen(false); }} className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-between ${claimMonthFilter === m ? 'bg-primary-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}>{m} {claimMonthFilter === m && <Check size={12} />}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {(activeTab === 'airdrops' || activeTab === 'infofi') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(activeTab === 'airdrops' ? trackedAirdrops : trackedInfoFi).map(a => {
                const unreadMsg = inbox.find(m => m.relatedAirdropId === a.id && !m.isRead);
                return (
                  <ProjectCard
                    key={a.id}
                    project={a}
                    onUntrack={() => toggleTrackProject(a.id)}
                    t_func={t}
                    unreadMessage={unreadMsg}
                  />
                );
              })}
              {(activeTab === 'airdrops' ? trackedAirdrops : trackedInfoFi).length === 0 && (
                <div className="col-span-full p-24 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-4 border-dashed border-slate-100 dark:border-slate-800">
                  <Target size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-400 font-black uppercase text-xs tracking-widest">
                    {activeTab === 'airdrops' ? t('noTrackedAirdrops') : /* t('noTrackedInfoFi') */ ""}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              {paginatedTasks.map(t_obj => (
                <TaskCard
                  key={t_obj.id}
                  task={t_obj}
                  project={null}
                  onToggle={() => manageTodo('toggle', t_obj)}
                  onDelete={() => manageTodo('remove', t_obj.id)}
                  t_func={t}
                />
              ))}
              {manualTasks.length === 0 && <div className="p-24 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-4 border-dashed border-slate-100 dark:border-slate-800"><ListChecks size={48} className="mx-auto text-slate-200 mb-4" /><p className="text-slate-400 font-black uppercase text-xs tracking-widest">{t('noActiveTasks')}</p></div>}
              {totalTaskPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button onClick={() => setTaskPage(p => Math.max(1, p - 1))} className="p-3 rounded-xl bg-white dark:bg-slate-900 border dark:border-slate-800 text-slate-400 hover:text-primary-600 shadow-sm transition-all"><ChevronLeft size={20} /></button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalTaskPages }, (_, i) => (
                      <button key={i} onClick={() => setTaskPage(i + 1)} className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${taskPage === i + 1 ? 'bg-primary-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border dark:border-slate-800 text-slate-400'}`}>{i + 1}</button>
                    ))}
                  </div>
                  <button onClick={() => setTaskPage(p => Math.min(totalTaskPages, p + 1))} className="p-3 rounded-xl bg-white dark:bg-slate-900 border dark:border-slate-800 text-slate-400 hover:text-primary-600 shadow-sm transition-all"><ChevronRight size={20} /></button>
                </div>
              )}
            </div>
          )}


          {activeTab === 'completed' && (
            <div className="space-y-4 opacity-75">
              {completedTasks.map(t_obj => (
                <TaskCard
                  key={t_obj.id}
                  task={t_obj}
                  project={airdrops.find(a => a.id === t_obj.airdropId)}
                  onToggle={() => manageTodo('toggle', t_obj)}
                  onDelete={() => manageTodo('remove', t_obj.id)}
                  t_func={t}
                />
              ))}
              {completedTasks.length === 0 && <div className="p-24 text-center text-slate-400 font-black uppercase text-xs tracking-widest border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem]">{t('archiveClear')}</div>}
              {completedTasks.length >= 20 && <p className="text-center text-[9px] font-black uppercase text-slate-400 opacity-50 tracking-widest">Protocol limit reached. Old completed units will be purged.</p>}
            </div>
          )}

          {activeTab === 'claimed' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="flex gap-12 relative z-10">
                  <Stat label={t('totalCost')} val={`$${totalExpense.toLocaleString()}`} color="text-red-500" />
                  <Stat label={t('totalEarning')} val={`$${totalEarning.toLocaleString()}`} color="text-emerald-500" />
                  <Stat label={t('netYield')} val={`$${totalProfit.toLocaleString()}`} color={totalProfit >= 0 ? "text-primary-600" : "text-red-500"} />
                </div>
                <button onClick={() => setShowClaimAdd(true)} className="px-6 py-3.5 bg-emerald-600 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform uppercase tracking-widest relative z-10"><Plus size={16} /> {t('recordClaim')}</button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[2rem] border dark:border-slate-800 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <tr><th className="p-6">{t('origin')}</th><th className="p-6">Claimed Date</th><th className="p-6">{t('expense')}</th><th className="p-6">{t('allocation')}</th><th className="p-6">{t('reward')}</th><th className="p-6">{t('yield')}</th><th className="p-6 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800 font-medium">
                    {filteredClaims.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-6 font-bold">{c.projectName}</td>
                        <td className="p-6 font-bold text-slate-400">{c.claimedDate || 'N/A'}</td>
                        <td className="p-6 text-red-500">-${c.expense.toLocaleString()}</td>
                        <td className="p-6 font-bold text-slate-500">{c.tokenCount?.toLocaleString() || '0'} {c.claimedToken}</td>
                        <td className="p-6 text-emerald-500 font-black">+${c.earning.toLocaleString()}</td>
                        <td className={`p-6 font-black ${c.earning - c.expense >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>${(c.earning - c.expense).toLocaleString()}</td>
                        <td className="p-6 text-right">
                          <button
                            onClick={() => {
                              setDeleteTarget({ type: 'claim', id: c.id });
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title={t('delete')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 w-full max-lg rounded-[2.5rem] p-10 shadow-2xl relative animate-in zoom-in-95">
            <h3 className="text-2xl font-black mb-8 tracking-tighter">{t('newObjective')}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest ml-1">Task Name</label>
                <input type="text" placeholder={t('taskDetails')} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl font-bold outline-none shadow-inner" value={newTask.note} onChange={e => setNewTask({ ...newTask, note: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest ml-1">{t('cycleFreq')}</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl font-bold outline-none shadow-inner" value={newTask.reminder} onChange={e => setNewTask({ ...newTask, reminder: e.target.value as any })}>
                    <option value="none">{t('once')}</option>
                    <option value="daily">{t('dailyReset')}</option>
                    <option value="weekly">{t('weeklyReset')}</option>
                    <option value="monthly">{t('monthlyReset')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest ml-1">Deadline</label>
                  <input type="date" className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl font-bold outline-none shadow-inner" value={newTask.deadline} onChange={e => setNewTask({ ...newTask, deadline: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-10">
              <button onClick={() => setShowAdd(false)} className="flex-1 font-black text-slate-400 uppercase text-xs tracking-widest">{t('abort')}</button>
              <button onClick={addTask} className="flex-1 py-4 bg-primary-600 text-white rounded-xl font-black shadow-xl active:scale-95 transition-transform uppercase text-xs tracking-widest">{t('deploy')}</button>
            </div>
          </div>
        </div>
      )}

      {showClaimAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 w-full max-lg rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black mb-8 tracking-tighter text-emerald-600">{t('archiveClaim')}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest ml-1">{t('projectIdent')}</label>
                <input type="text" placeholder={t('projectIdent')} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl font-bold outline-none border-none shadow-inner" value={newClaim.projectName} onChange={e => setNewClaim({ ...newClaim, projectName: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest ml-1">Claim Date</label><input type="date" className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl font-bold" value={newClaim.claimedDate} onChange={e => setNewClaim({ ...newClaim, claimedDate: e.target.value })} /></div>
                <div><label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest ml-1">{t('expense')} ($)</label><input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl font-bold" value={newClaim.expense || ''} onChange={e => setNewClaim({ ...newClaim, expense: Number(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest ml-1">{t('reward')} ($)</label><input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl font-bold" value={newClaim.earning || ''} onChange={e => setNewClaim({ ...newClaim, earning: Number(e.target.value) })} /></div>
                <div><label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest ml-1">{t('assetTicker')}</label><input type="text" className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl font-bold" placeholder="e.g. BTC" value={newClaim.claimedToken} onChange={e => setNewClaim({ ...newClaim, claimedToken: e.target.value.toUpperCase() })} /></div>
              </div>
              <div><label className="text-[10px] font-black uppercase text-slate-400 mb-1 block uppercase tracking-widest ml-1">Token Allocation</label><input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl font-bold" value={newClaim.tokenCount || ''} onChange={e => setNewClaim({ ...newClaim, tokenCount: Number(e.target.value) })} /></div>
            </div>
            <div className="flex gap-4 mt-10">
              <button onClick={() => setShowClaimAdd(false)} className="flex-1 font-black text-slate-400 uppercase text-xs tracking-widest">{t('abort')}</button>
              <button onClick={addClaimEntry} className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-black shadow-xl active:scale-95 transition-transform text-xs tracking-widest">{t('archive')}</button>
            </div>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative animate-in zoom-in-95 border dark:border-slate-800">
            {/* Title Removed as requested */}
            <p className="text-slate-500 text-center text-sm font-medium mb-8">Are you sure you want to delete this item? This action cannot be undone.</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  if (deleteTarget?.type === 'claim') manageUserClaim('remove', deleteTarget.id);
                  if (deleteTarget?.type === 'task') manageTodo('remove', deleteTarget.id);
                  setShowDeleteModal(false);
                }}
                className="py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-red-600 text-white shadow-lg shadow-red-500/30 hover:bg-red-700 active:scale-95 transition-all"
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Image Proxy Helper - Imported from utils


const DashboardStat: React.FC<{ label: string, val: string | number, icon: any, color: string }> = ({ label, val, icon, color }) => (
  // ... (unchanged)
  <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-2xl text-white ${color} shadow-lg shadow-current/20`}>{icon}</div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
      <p className="text-lg font-black tracking-tight">{val}</p>
    </div>
  </div>
);

const ProjectCard: React.FC<{ project: any, onUntrack: () => void, t_func: any, unreadMessage?: any }> = ({ project, onUntrack, t_func, unreadMessage }) => (
  <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-5 flex flex-col group hover:shadow-xl hover:border-primary-500 transition-all relative">
    {unreadMessage && (
      <Link to="/inbox" className="absolute -top-2 -right-2 bg-red-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-1 animate-bounce z-10 border-2 border-white dark:border-slate-900">
        <Mail size={10} /> Mission Intel
      </Link>
    )}
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3 min-w-0">
        <img src={getImgUrl(project.icon)} className="w-12 h-12 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform" />
        <div className="min-w-0">
          <h4 className="font-black text-sm uppercase truncate">{project.name}</h4>
          {project.hasInfoFi && (
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{project.platform}</p>
          )}
        </div>
      </div>
      <button onClick={onUntrack} className="p-2 text-slate-300 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-800 rounded-lg"><Trash2 size={14} /></button>
    </div>
    <div className="flex items-center justify-between mt-auto pt-4 border-t dark:border-slate-800">
      <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-800/80 text-primary-600 dark:text-primary-400 rounded-xl font-black font-mono text-[10px] border border-slate-100 dark:border-slate-700 shadow-sm transition-all group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-500">
        <DollarSign size={10} />
        {project.investment}
      </div>
      <Link to={`/project/${project.id}`} className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-primary-600 transition-colors uppercase tracking-widest">{t_func('projectDetails')} <ArrowUpRight size={12} /></Link>
    </div>
  </div>
);

const TaskCard: React.FC<{ task: any, project?: any, onToggle: () => void, onDelete: () => void, t_func: any }> = ({ task, project, onToggle, onDelete, t_func }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm p-4 flex items-center justify-between group transition-all hover:border-primary-500/50 ${task.completed ? 'opacity-50 grayscale' : ''}`}>
    <div className="flex items-center gap-4 min-w-0">
      <button onClick={onToggle} className={`p-1 rounded-lg transition-all ${task.completed ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'text-slate-300 hover:text-primary-600 bg-slate-50 dark:bg-slate-800'}`}>
        <CheckCircle2 size={24} />
      </button>
      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-inner">
        {project ? <img src={getImgUrl(project.icon)} className="w-full h-full rounded-xl object-cover shadow-sm" /> : <ListChecks size={20} className="text-primary-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className={`font-black text-sm truncate ${task.completed ? 'line-through' : ''}`}>{task.note}</h4>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[8px] font-black text-slate-400 uppercase tracking-widest"><Clock size={10} /> {new Date(task.createdAt).toLocaleString()}</span>
          {task.deadline && (
            <span className="flex items-center gap-1 text-[8px] font-black text-red-500 uppercase tracking-widest"><Calendar size={10} /> Deadline: {task.deadline}</span>
          )}
          {task.reminder && task.reminder !== 'none' && (
            <span className="flex items-center gap-1 text-[8px] font-black text-primary-600 uppercase tracking-tighter bg-primary-50 dark:bg-primary-900/40 px-1.5 py-0.5 rounded shadow-sm">
              <RefreshCw size={10} className="animate-spin-slow" /> {task.reminder} cycle
            </span>
          )}
        </div>
      </div>
    </div>
    <button onClick={onDelete} className="p-2 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
  </div>
);

const NavBtn: React.FC<{ icon: any, label: string, active: boolean, count?: number, onClick: () => void, notificationCount?: number, colorClass?: string }> = ({ icon, label, active, count, onClick, notificationCount, colorClass }) => (
  <button onClick={onClick} className={`px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-between transition-all relative ${active ? (colorClass || 'bg-primary-600') + ' text-white shadow-xl shadow-primary-500/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
    <div className="flex items-center gap-3">{icon} <span>{label}</span></div>
    <div className="flex items-center gap-2">
      {count !== undefined && count > 0 && <span className={`text-[9px] px-2 py-0.5 rounded-full ${active ? 'bg-white text-primary-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'}`}>{count}</span>}
      {notificationCount !== undefined && notificationCount > 0 && <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>}
    </div>
  </button>
);

const Stat: React.FC<{ label: string, val: string, color: string }> = ({ label, val, color }) => (
  <div className="min-w-0"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">{label}</p><p className={`text-2xl font-black ${color} truncate`}>{val}</p></div>
);
