import { Buffer } from 'buffer';
import React, { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import { supabase } from '../supabaseClient';
import {
   Shield, LayoutDashboard, Users, MessageSquare, Check, Trash2, Edit, Plus, Bell, Zap, X,
   Mail, Ticket, BarChart3, Star, Trophy, ArrowUpCircle, Sword, Globe, ExternalLink, Map, Sun, Sparkles, Youtube, Github, Twitter, Save, UserPlus, Link2, Calendar, UserCheck, ShieldAlert, Send,
   Layers, Search, Info, Megaphone, TrendingUp, ChevronRight, Lock, Clock, History, ChevronLeft, Wrench
} from 'lucide-react';
import { OnChainActivity, Airdrop, Claim, Guide, Comment, TopUser, Chain, User, InfoFiPlatform, Announcement, Investor, Tool, ToolCategory } from '../types';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: string }> {
   state = { hasError: false, error: '' };

   static getDerivedStateFromError(error: any) { return { hasError: true, error: error.toString() }; }
   componentDidCatch(error: any, errorInfo: any) { console.error("AdminPanel Crash:", error, errorInfo); }
   render() {
      if (this.state.hasError) {
         return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-10">
               <ShieldAlert size={64} className="text-rose-500 mb-6" />
               <h2 className="text-3xl font-black uppercase mb-4 text-center">Protocol Malfunction</h2>
               <div className="bg-rose-950/30 p-6 rounded-xl border border-rose-500/30 max-w-2xl w-full backdrop-blur-sm">
                  <p className="font-mono text-xs text-rose-400 mb-2 uppercase tracking-widest">Error Log</p>
                  <p className="font-mono text-sm text-white break-all">{this.state.error}</p>
               </div>
               <button onClick={() => window.location.reload()} className="mt-8 px-8 py-4 bg-primary-600 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl">Reboot System</button>
            </div>
         );
      }
      return this.props.children;
   }
}

const AdminPanelContent: React.FC = () => {
   const {
      airdrops, setAirdrops, comments, setComments, guides, setGuides, claims, setClaims,
      usersList, setUsersList, requests, setRequests, addToast, activities, setActivities,
      chains, setChains, setInbox, infofiPlatforms, setInfofiPlatforms, t, user,
      announcements, setAnnouncements, investors, setInvestors, resetAllXPs, banUser,
      tools, setTools
   } = useApp();

   const [activeTab, setActiveTab] = useState<'dash' | 'airdrops' | 'infofi' | 'platforms' | 'investors' | 'claims' | 'presales' | 'gm' | 'mint' | 'deploy' | 'rpg' | 'users' | 'requests' | 'moderation' | 'chains' | 'messages' | 'announcements' | 'tools'>('dash');

   const [showModal, setShowModal] = useState<string | null>(null);
   const [editingItem, setEditingItem] = useState<any>(null);
   const [formData, setFormData] = useState<any>({});
   const [hunterSearch, setHunterSearch] = useState('');
   const [backerSearch, setBackerSearch] = useState('');
   const [projectSearch, setProjectSearch] = useState('');
   const [projectPage, setProjectPage] = useState(1);
   const [commsSearch, setCommsSearch] = useState('');

   // Auth State
   const [isAuthenticated, setIsAuthenticated] = useState(false);
   const [adminPassword, setAdminPassword] = useState('');
   const [authError, setAuthError] = useState('');

   const isOwner = user?.memberStatus === 'Admin' || isAuthenticated;
   const isSuper = user?.memberStatus === 'Super Admin' || isAuthenticated;
   const isMod = user?.memberStatus === 'Moderator' || isAuthenticated;

   const canSee = (tab: string) => {
      if (isAuthenticated) return true; // Master Key Override
      if (isOwner) return true;
      if (isSuper) return ['dash', 'airdrops', 'infofi', 'platforms', 'investors', 'claims', 'presales', 'messages', 'requests', 'moderation', 'users', 'announcements', 'tools'].includes(tab);
      if (isMod) return ['requests', 'moderation'].includes(tab);
      return false;
   };

   const handleAdminLogin = async () => {
      try {
         const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: adminPassword }) });
         const data = await res.json();
         if (res.ok && data.success) {
            setIsAuthenticated(true);
            setAuthError('');
            localStorage.setItem('admin_login_ts', Date.now().toString());
         } else { setAuthError(data.error || 'Access Denied'); }
      } catch (e) { setAuthError('Connection Error'); }
   };

   // Session Timeout (15 mins) & Restore
   React.useEffect(() => {
      const checkSession = () => {
         const ts = localStorage.getItem('admin_login_ts');
         if (ts) {
            const diff = Date.now() - parseInt(ts);
            if (diff < 15 * 60 * 1000) {
               setIsAuthenticated(true);
            } else {
               setIsAuthenticated(false);
               localStorage.removeItem('admin_login_ts');
               // Only toast if we were previously logged in or attempting to access
               // addToast("Session expired", "warning"); 
            }
         }
      };

      checkSession();
      // Optional: Interval to check periodically
      const interval = setInterval(checkSession, 60000);
      return () => clearInterval(interval);
   }, []);

   const sendBroadcast = async () => {
      if (!msgData.title || !msgData.content) return addToast("Comms incomplete.", "error");

      const newMsg = {
         title: msgData.title,
         content: msgData.content,
         projectId: msgData.projectId || null,
         type: msgData.type,
         createdAt: Date.now(),
         targetRole: 'all',
         authorId: user?.id,
         relatedAirdropId: msgData.target === 'project' && msgData.projectId ? msgData.projectId : null
      };

      const { error } = await supabase.from('messages').insert(newMsg);

      if (!error) {
         addToast("Transmission broadcasted.");
         setMsgData({ title: '', content: '', target: 'all', projectId: '' });
      } else {
         console.error("Broadcast Error", error);
         addToast(`Failed to broadcast: ${error?.message || 'Unknown error'}`, "error");
      }
   };

   const syncToDb = async (table: string, data: any) => {
      const { error } = await supabase.from(table).upsert(data);
      if (error) { addToast("Sync Failed: " + error.message, "error"); return false; }
      return true;
   };

   const deleteFromDb = async (table: string, id: string) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) addToast("Delete Failed", "error");
   };

   const stats = useMemo(() => {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
         const d = new Date();
         d.setDate(d.getDate() - i);
         const dayStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
         const userCount = usersList.filter(u => new Date(u.registeredAt).toLocaleDateString() === d.toLocaleDateString()).length;
         const commCount = comments.filter(c => new Date(c.createdAtTimestamp || 0).toLocaleDateString() === d.toLocaleDateString()).length;
         const guideCount = guides.filter(g => new Date(g.createdAt || 0).toLocaleDateString() === d.toLocaleDateString()).length;

         return { day: dayStr, userCount, commCount, guideCount };
      }).reverse();

      const last6Months = Array.from({ length: 6 }, (_, i) => {
         const d = new Date();
         d.setMonth(d.getMonth() - i);
         const monthStr = d.toLocaleString('default', { month: 'short' });
         const projCount = airdrops.filter(a => {
            const adate = new Date(a.createdAt || 0);
            return adate.getMonth() === d.getMonth() && adate.getFullYear() === d.getFullYear();
         }).length;
         return { month: monthStr, projCount };
      }).reverse();

      return {
         totalUsers: usersList.length,
         totalAirdrops: airdrops.filter(a => !a.hasInfoFi).length,
         totalInfoFi: airdrops.filter(a => a.hasInfoFi).length,
         totalComments: comments.length,
         totalChains: chains.length,
         history: last7Days,
         months: last6Months,
         maxUser: Math.max(...last7Days.map(h => h.userCount), 1),
         maxComm: Math.max(...last7Days.map(h => h.commCount), 1),
         maxGuide: Math.max(...last7Days.map(h => h.guideCount), 1),
         maxProj: Math.max(...last6Months.map(m => m.projCount), 1),
      };
   }, [usersList, airdrops, comments, guides, chains]);

   const [msgData, setMsgData] = useState({ title: '', content: '', target: 'all', projectId: '' });

   const getDefaultData = (type: string) => {
      switch (type) {
         case 'airdrop': return { name: '', icon: '', investment: '', type: 'Free', hasInfoFi: false, rating: 5, status: 'Potential', backerIds: [], socials: { website: '', twitter: '', discord: '' }, projectInfo: '', campaignUrl: '', claimUrl: '', createdAt: Date.now() };
         case 'infofi': return { name: '', icon: '', investment: '', hasInfoFi: true, platform: infofiPlatforms[0]?.name || '', backerIds: [], type: 'Free', topUsers: [], socials: { website: '', twitter: '', discord: '' }, projectInfo: '', campaignUrl: '', claimUrl: '', potentialReward: '', createdAt: Date.now(), status: 'Potential' };
         case 'platform': return { name: '', logo: '' };
         case 'investor': return { name: '', logo: '', createdAt: Date.now() };
         case 'claim': return { projectName: '', icon: '', link: '', type: 'claim', isUpcoming: false, deadline: '' };
         case 'presale': return { projectName: '', icon: '', link: '', type: 'presale', fdv: '', whitelist: 'Public', isUpcoming: false, startDate: '' };
         case 'tool': return { name: '', description: '', logo: '', link: '', category: 'Research' };
         case 'gm': return { type: 'gm', name: '', logo: '', chainId: chains[0]?.chainId || 1, contractAddress: '', color: '#f59e0b', isTestnet: false, mintFee: '0.00035', functionName: 'mint', badge: 'none' };
         case 'mint': return { type: 'mint', name: '', logo: '', chainId: chains[0]?.chainId || 1, contractAddress: '', color: '#8b5cf6', isTestnet: false, nftImage: '', mintFee: '0.00035', functionName: 'mint', badge: 'none' };
         case 'deploy': return { type: 'deploy', name: '', logo: '', chainId: chains[0]?.chainId || 1, contractAddress: '', color: '#10b981', isTestnet: false, functionName: 'deploy', badge: 'none' };
         case 'rpg': return { type: 'rpg', name: '', logo: '', chainId: chains[0]?.chainId || 1, contractAddress: '', extraXP: 25, color: '#f43f5e', isTestnet: false, mintFee: '0.00035', functionName: 'mint', badge: 'none' };
         case 'chain': return { name: '', chainId: 1, rpcUrl: '', explorerUrl: '', isTestnet: true, logo: '', nativeCurrency: 'ETH' };
         case 'announcement': return { text: '', emoji: '📢', link: '' };
         default: return {};
      }
   };

   const openModal = (type: string, item: any = null) => {
      setEditingItem(item);
      setShowModal(type);
      let baseData = item ? JSON.parse(JSON.stringify(item)) : getDefaultData(type);

      if (type === 'infofi' || (item && item.hasInfoFi)) {
         if (!baseData.topUsers) baseData.topUsers = [];
         while (baseData.topUsers.length < 10) {
            baseData.topUsers.push({ id: Math.random().toString(36).substr(2, 9), rank: baseData.topUsers.length + 1, twitterUrl: '', name: '', avatar: '' });
         }
      }

      setFormData(baseData);
   };

   const handleSave = async () => {
      const id = editingItem?.id || Date.now().toString();
      const finalData = { ...formData, id };

      let table = ''; let setter: any = null;
      if (showModal === 'airdrop' || showModal === 'infofi') { table = 'airdrops'; setter = setAirdrops; }
      else if (showModal === 'claim' || showModal === 'presale') { table = 'claims'; setter = setClaims; }
      else if (showModal === 'chain') { table = 'chains'; setter = setChains; }
      else if (showModal === 'platform') { table = 'infofi_platforms'; setter = setInfofiPlatforms; }
      else if (showModal === 'investor') { table = 'investors'; setter = setInvestors; }
      else if (showModal === 'announcement') { table = 'announcements'; setter = setAnnouncements; }
      else if (showModal === 'tool') { table = 'tools'; setter = setTools; }
      else if (['gm', 'mint', 'deploy', 'rpg'].includes(showModal || '')) { table = 'activities'; setter = setActivities; }

      if (table) {
         const success = await syncToDb(table, finalData);
         if (success && setter) {
            setter((prev: any[]) => editingItem ? prev.map(a => a.id === id ? finalData : a) : [finalData, ...prev]);
            addToast("Protocol Synced."); setShowModal(null);
         }
      }
   };



   const handleTempBan = (address: string) => {
      const days = prompt("Enter ban duration in days:", "7");
      if (days) {
         const until = Date.now() + parseInt(days) * 24 * 60 * 60 * 1000;
         banUser(address, until);
         addToast(`User suspended for ${days} days.`);
      }
   };

   const handlePermaBan = (address: string) => {
      if (confirm("Permanently terminate protocol access for this unit?")) {
         banUser(address, 'perma');
         addToast("User permanently banned.", "error");
      }
   };

   const handleFile = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
      const file = e.target.files?.[0];
      if (file) {
         const reader = new FileReader();
         reader.onloadend = () => setFormData({ ...formData, [field]: reader.result as string });
         reader.readAsDataURL(file);
      }
   };

   const filteredUsers = useMemo(() => {
      return usersList.filter(u =>
         (u.username || '').toLowerCase().includes(hunterSearch.toLowerCase()) ||
         u.address.toLowerCase().includes(hunterSearch.toLowerCase())
      );
   }, [usersList, hunterSearch]);

   const toggleBackerSelection = (investorId: string) => {
      const current = formData.backerIds || [];
      const updated = current.includes(investorId)
         ? current.filter((id: string) => id !== investorId)
         : [...current, investorId];
      setFormData({ ...formData, backerIds: updated });
   };

   const updateInfoFiSlot = (index: number, twitterUrl: string) => {
      const currentTopUsers = [...(formData.topUsers || [])];
      if (currentTopUsers[index]) {
         currentTopUsers[index] = { ...currentTopUsers[index], twitterUrl };
      }
      setFormData({ ...formData, topUsers: currentTopUsers });
   };

   const backerSearchResults = useMemo(() => {
      if (!backerSearch) return [];
      return investors.filter(inv => inv.name.toLowerCase().includes(backerSearch.toLowerCase())).slice(0, 10);
   }, [investors, backerSearch]);

   const projectList = useMemo(() => {
      const isInfoFi = activeTab === 'infofi';
      const filtered = airdrops.filter(a => (isInfoFi ? a.hasInfoFi : !a.hasInfoFi) && a.name.toLowerCase().includes(projectSearch.toLowerCase()));
      return {
         items: filtered.slice((projectPage - 1) * 10, projectPage * 10),
         total: Math.ceil(filtered.length / 10),
         count: filtered.length
      };
   }, [airdrops, projectSearch, projectPage, activeTab]);

   const commsProjectResults = useMemo(() => {
      if (!commsSearch) return [];
      return airdrops.filter(a => a.name.toLowerCase().includes(commsSearch.toLowerCase())).slice(0, 5);
   }, [airdrops, commsSearch]);

   const updateGuideInList = (id: string, updates: Partial<Guide>) => {
      setGuides(p => p.map(g => g.id === id ? { ...g, ...updates } : g));
   };

   // --- CONDITIONAL AUTH RETURN ---
   if (!isAuthenticated) {
      return (
         <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border dark:border-slate-800">
               <div className="flex justify-center mb-6"><Shield size={64} className="text-primary-600" /></div>
               <h2 className="text-3xl font-black text-center uppercase tracking-tighter mb-2">Admin Access</h2>
               <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Restricted Protocol Area</p>
               <div className="space-y-4">
                  <input type="password" placeholder="Enter Command Code..." className="w-full p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl font-bold text-center outline-none border-2 border-transparent focus:border-primary-500 transition-all" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} />
                  {authError && <p className="text-center text-rose-500 font-black text-xs uppercase">{authError}</p>}
                  <button onClick={handleAdminLogin} className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-105 transition-all">Authenticate</button>
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="max-w-[1600px] mx-auto pb-24 px-4">
         <div className="flex items-center gap-6 mb-12">
            <div className="w-16 h-16 bg-primary-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl border-4 border-white dark:border-slate-800"><Shield size={32} /></div>
            <div>
               <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">{t('adminHq')}</h1>
               <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">{t('masterAuth')}</p>
            </div>
         </div>

         <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-72 shrink-0">
               <nav className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-4 border dark:border-slate-800 shadow-sm space-y-1 sticky top-24">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-2">{t('monitor')}</p>
                  {canSee('dash') && <NavBtn icon={<BarChart3 size={18} />} label={t('dashboard')} active={activeTab === 'dash'} onClick={() => setActiveTab('dash')} />}
                  {canSee('airdrops') && <NavBtn icon={<LayoutDashboard size={18} />} label={t('airdrops')} active={activeTab === 'airdrops'} onClick={() => { setActiveTab('airdrops'); setProjectPage(1); setProjectSearch(''); }} />}
                  {canSee('infofi') && <NavBtn icon={<Zap size={18} />} label={t('infofi')} active={activeTab === 'infofi'} onClick={() => { setActiveTab('infofi'); setProjectPage(1); setProjectSearch(''); }} />}
                  {canSee('platforms') && <NavBtn icon={<Layers size={18} />} label={t('platforms')} active={activeTab === 'platforms'} onClick={() => setActiveTab('platforms')} />}
                  {canSee('investors') && <NavBtn icon={<Users size={18} />} label={t('investors')} active={activeTab === 'investors'} onClick={() => setActiveTab('investors')} />}
                  {canSee('claims') && <NavBtn icon={<Bell size={18} />} label={t('claims')} active={activeTab === 'claims'} onClick={() => setActiveTab('claims')} />}
                  {canSee('presales') && <NavBtn icon={<Ticket size={18} />} label={t('presales')} active={activeTab === 'presales'} onClick={() => setActiveTab('presales')} />}
                  {canSee('announcements') && <NavBtn icon={<Megaphone size={18} />} label={t('announcements')} active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')} />}
                  {canSee('tools') && <NavBtn icon={<Wrench size={18} />} label={t('tools')} active={activeTab === 'tools'} onClick={() => setActiveTab('tools')} />}

                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-2 mt-4">{t('nodeOps')}</p>
                  {canSee('chains') && <NavBtn icon={<Link2 size={18} className="text-emerald-500" />} label={t('chains')} active={activeTab === 'chains'} onClick={() => setActiveTab('chains')} />}
                  {canSee('gm') && <NavBtn icon={<Sun size={18} className="text-amber-500" />} label={t('dailyGm')} active={activeTab === 'gm'} onClick={() => setActiveTab('gm')} />}
                  {canSee('mint') && <NavBtn icon={<Sparkles size={18} className="text-primary-500" />} label={t('dailyMint')} active={activeTab === 'mint'} onClick={() => setActiveTab('mint')} />}
                  {canSee('deploy') && <NavBtn icon={<ArrowUpCircle size={18} className="text-sky-500" />} label={t('deployHub')} active={activeTab === 'deploy'} onClick={() => setActiveTab('deploy')} />}
                  {canSee('rpg') && <NavBtn icon={<Map size={18} className="text-rose-500" />} label={t('rpgZone')} active={activeTab === 'rpg'} onClick={() => setActiveTab('rpg')} />}

                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-2 mt-4">{t('secComms')}</p>
                  {canSee('messages') && <NavBtn icon={<Send size={18} className="text-primary-600" />} label={t('globalComms')} active={activeTab === 'messages'} onClick={() => setActiveTab('messages')} />}
                  {canSee('requests') && <NavBtn icon={<Mail size={18} />} label={t('requests')} active={activeTab === 'requests'} onClick={() => setActiveTab('requests')} count={requests.length} />}
                  {canSee('moderation') && <NavBtn icon={<MessageSquare size={18} />} label={t('moderation')} active={activeTab === 'moderation'} onClick={() => setActiveTab('moderation')} count={comments.filter(c => !c.isApproved).length + guides.filter(g => !g.isApproved).length} />}
                  {canSee('users') && <NavBtn icon={<Users size={18} />} label={t('hunterDb')} active={activeTab === 'users'} onClick={() => setActiveTab('users')} />}
               </nav>
            </aside>

            <main className="flex-1 min-w-0">
               {activeTab === 'dash' && (
                  <div className="space-y-8 overflow-hidden">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        <StatBox label="Total Hunters" value={stats.totalUsers} icon={<Users className="text-primary-600" />} />
                        <StatBox label="Airdrop Nodes" value={stats.totalAirdrops} icon={<LayoutDashboard className="text-emerald-500" />} />
                        <StatBox label="InfoFi Hubs" value={stats.totalInfoFi} icon={<Zap className="text-amber-500" />} />
                        <StatBox label="Protocol Intel" value={stats.totalComments} icon={<MessageSquare className="text-sky-500" />} />
                        <StatBox label="Live Chains" value={stats.totalChains} icon={<Link2 className="text-rose-500" />} />
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <ChartBox title="Hunter Growth (Daily)" data={stats.history} valKey="userCount" labelKey="day" max={stats.maxUser} color="bg-primary-600" />
                        <ChartBox title="Protocol Intel (Comments Daily)" data={stats.history} valKey="commCount" labelKey="day" max={stats.maxComm} color="bg-sky-500" />
                        <ChartBox title="Guide Submissions (Daily)" data={stats.history} valKey="guideCount" labelKey="day" max={stats.maxGuide} color="bg-rose-500" />
                        <ChartBox title="Indexed Projects (Monthly)" data={stats.months} valKey="projCount" labelKey="month" max={stats.maxProj} color="bg-emerald-500" />
                     </div>
                  </div>
               )}

               {activeTab === 'users' && (
                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border dark:border-slate-800 shadow-sm overflow-hidden">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3"><Users className="text-primary-600" /> {t('hunterDatabase')}</h3>
                        <div className="relative">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                           <input type="text" className="pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold text-xs outline-none border border-transparent focus:border-primary-500 min-w-[300px]" placeholder={t('hunterSearch')} value={hunterSearch} onChange={(e) => setHunterSearch(e.target.value)} />
                        </div>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-400">
                              <tr><th className="p-4">UID</th><th className="p-4">Hunter</th><th className="p-4">{t('level')}</th><th className="p-4">{t('status')}</th><th className="p-4">Actions</th></tr>
                           </thead>
                           <tbody className="divide-y dark:divide-slate-800">
                              {filteredUsers.map(u => (
                                 <tr key={u.address} className="hover:bg-slate-50/50 transition-colors text-sm">
                                    <td className="p-4 font-black text-xs text-slate-400">#{u.uid}</td>
                                    <td className="p-4 flex items-center gap-3">
                                       <img src={u.avatar} className="w-8 h-8 rounded-full object-cover" />
                                       <div className="min-w-0"><p className="font-black text-xs truncate w-32">{u.username || 'Anon'}</p><p className="text-[8px] font-mono text-slate-400 truncate w-32">{u.address}</p></div>
                                    </td>
                                    <td className="p-4 font-black text-primary-600 text-xs">{u.level}</td>
                                    <td className="p-4">
                                       {isOwner ? (
                                          <select className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded text-[10px] font-black uppercase outline-none" value={u.memberStatus} onChange={e => {
                                             setUsersList(prev => prev.map(usr => usr.address === u.address ? { ...usr, memberStatus: e.target.value as any, isAdmin: e.target.value !== 'Hunter' } : usr));
                                             addToast("Status updated.");
                                          }}>
                                             <option value="Hunter">Hunter</option>
                                             <option value="Moderator">Moderator</option>
                                             <option value="Super Admin">Super Admin</option>
                                             <option value="Admin">Admin</option>
                                          </select>
                                       ) : (
                                          <span className="text-[10px] font-black uppercase text-slate-400">{u.memberStatus}</span>
                                       )}
                                    </td>
                                    <td className="p-4 flex gap-2">
                                       <button onClick={() => handleTempBan(u.address)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg"><Clock size={16} /></button>
                                       {isOwner && <button onClick={() => handlePermaBan(u.address)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><Lock size={16} /></button>}
                                       {isOwner && <button onClick={() => { if (confirm("Permanently delete unit?")) setUsersList(prev => prev.filter(usr => usr.address !== u.address)); }} className="text-red-500 p-2 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>}
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               )}

               {activeTab === 'moderation' && (
                  <div className="space-y-10">
                     <SectionWrapper title="Pending Comments">
                        <div className="space-y-4">
                           {comments.filter(c => !c.isApproved).map(c => (
                              <div key={c.id} className="p-5 bg-white dark:bg-slate-800 rounded-3xl flex items-start justify-between border dark:border-slate-700 shadow-sm">
                                 <div className="flex gap-4">
                                    <img src={c.avatar} className="w-12 h-12 rounded-xl" />
                                    <div>
                                       <p className="font-black text-xs uppercase tracking-tight text-primary-600">{c.username} @ {airdrops.find(a => a.id === c.airdropId)?.name || 'Protocol'}</p>
                                       <p className="text-sm font-medium mt-1 leading-relaxed">{c.content}</p>
                                    </div>
                                 </div>
                                 <div className="flex gap-2">
                                    <button onClick={async () => {
                                       const { error } = await supabase.from('comments').update({ isApproved: true }).eq('id', c.id);
                                       if (!error) {
                                          setComments(p => p.map(x => x.id === c.id ? { ...x, isApproved: true } : x));
                                          addToast("Comment approved (Saved).");
                                       } else {
                                          addToast("Approval Failed", "error");
                                       }
                                    }} className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"><Check size={18} /></button>
                                    <button onClick={async () => {
                                       const { error } = await supabase.from('comments').delete().eq('id', c.id);
                                       if (!error) {
                                          setComments(p => p.filter(x => x.id !== c.id));
                                          addToast("Comment deleted.");
                                       }
                                    }} className="p-2.5 bg-rose-500 text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"><Trash2 size={18} /></button>
                                 </div>
                              </div>
                           ))}
                           {comments.filter(c => !c.isApproved).length === 0 && <div className="p-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest border-4 border-dashed rounded-[3rem]">Comment queue is quiet.</div>}
                        </div>
                     </SectionWrapper>
                     <SectionWrapper title="Proposed Guides">
                        <div className="space-y-4">
                           {guides.filter(g => !g.isApproved).map(g => (
                              <div key={g.id} className="p-5 bg-white dark:bg-slate-800 rounded-3xl flex flex-col border dark:border-slate-700 shadow-sm gap-4">
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                       <div className={`p-3 rounded-2xl ${g.platform === 'youtube' ? 'bg-red-50 text-red-500' : g.platform === 'twitter' ? 'bg-sky-50 text-sky-500' : 'bg-slate-50 text-slate-900'}`}>{g.platform === 'youtube' ? <Youtube size={24} /> : g.platform === 'twitter' ? <Twitter size={24} /> : <Github size={24} />}</div>
                                       <div>
                                          <p className="font-black text-xs uppercase tracking-tight">{g.author} on {airdrops.find(a => a.id === g.airdropId)?.name || 'Protocol'}</p>
                                          <p className="text-[10px] text-slate-400 font-mono truncate w-64">{g.url}</p>
                                       </div>
                                    </div>
                                    <div className="flex gap-2">
                                       <button onClick={async () => {
                                          const { error } = await supabase.from('guides').update({ isApproved: true }).eq('id', g.id);
                                          if (!error) {
                                             setGuides(p => p.map(x => x.id === g.id ? { ...x, isApproved: true } : x));
                                             addToast("Guide approved (Saved).");
                                          } else addToast("Failed", "error");
                                       }} className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-lg hover:scale-105 transition-all"><Check size={18} /></button>
                                       <button onClick={async () => {
                                          const { error } = await supabase.from('guides').delete().eq('id', g.id);
                                          if (!error) {
                                             setGuides(p => p.filter(x => x.id !== g.id));
                                             addToast("Guide deleted.");
                                          }
                                       }} className="p-2.5 bg-rose-500 text-white rounded-xl shadow-lg hover:scale-105 transition-all"><Trash2 size={18} /></button>
                                    </div>
                                 </div>
                                 <div className="px-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Set Guide Title (Optional)</label>
                                    <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 p-2 rounded-lg text-xs font-bold border dark:border-slate-700 outline-none focus:border-primary-500" placeholder="Enter custom display title..." value={g.title || ''} onChange={e => updateGuideInList(g.id, { title: e.target.value })} />
                                 </div>
                              </div>
                           ))}
                           {guides.filter(g => !g.isApproved).length === 0 && <div className="p-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest border-4 border-dashed rounded-[3rem]">Guide queue is quiet.</div>}
                        </div>
                     </SectionWrapper>
                  </div>
               )}

               {activeTab === 'requests' && (
                  <SectionWrapper title="Hunter Project Proposals">
                     <div className="space-y-4">
                        {requests.map(r => (
                           <div key={r.id} className="p-6 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-[2rem] flex items-center justify-between group shadow-sm transition-all hover:border-primary-500">
                              <div>
                                 <h4 className="font-black text-xl uppercase tracking-tighter">{r.name}</h4>
                                 <p className={`text-[10px] font-black uppercase tracking-widest ${r.isInfoFi ? 'text-amber-500' : 'text-primary-600'}`}>Proposal by {r.address}</p>
                                 {r.twitterLink && <a href={r.twitterLink} target="_blank" rel="noreferrer" className="text-[10px] text-sky-500 font-bold hover:underline flex items-center gap-1 mt-1"><Twitter size={10} /> {r.twitterLink}</a>}
                              </div>
                              <div className="flex gap-2">
                                 <button onClick={() => { setAirdrops(prev => [{ id: Date.now().toString(), name: r.name, icon: '', investment: r.funding, type: 'Free', hasInfoFi: r.isInfoFi, rating: 5, voteCount: 0, status: 'Potential', projectInfo: '', campaignUrl: '', claimUrl: '', createdAt: Date.now(), backerIds: [], socials: { twitter: r.twitterLink } }, ...prev]); setRequests(p => p.filter(x => x.id !== r.id)); addToast("Project indexed."); }} className="p-3.5 bg-emerald-500 text-white rounded-2xl shadow-lg active:scale-90 transition-all"><Check size={24} /></button>
                                 <button onClick={() => { if (confirm("Discard proposal?")) setRequests(p => p.filter(x => x.id !== r.id)); }} className="p-3.5 bg-rose-500 text-white rounded-2xl shadow-lg active:scale-90 transition-all"><Trash2 size={24} /></button>
                              </div>
                           </div>
                        ))}
                        {requests.length === 0 && <div className="p-24 text-center text-slate-300 font-black uppercase text-xs tracking-widest border-4 border-dashed rounded-[3rem]">No pending proposals.</div>}
                     </div>
                  </SectionWrapper>
               )}

               {activeTab === 'messages' && (
                  <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border dark:border-slate-800 shadow-xl max-w-2xl mx-auto">
                     <h2 className="text-3xl font-black mb-8 tracking-tighter uppercase flex items-center gap-4"><Send className="text-primary-600" /> {t('globalComms')}</h2>
                     <div className="space-y-6">
                        <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest ml-1">Title</label><input type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-primary-500 transition-all" value={msgData.title} onChange={e => setMsgData({ ...msgData, title: e.target.value })} /></div>
                        <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest ml-1">Content</label><textarea className="w-full p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl font-bold text-sm h-32 outline-none border-2 border-transparent focus:border-primary-500 transition-all" value={msgData.content} onChange={e => setMsgData({ ...msgData, content: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-4">
                           <div><label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest ml-1">Target</label><select className="w-full p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl font-black text-xs outline-none" value={msgData.target} onChange={e => setMsgData({ ...msgData, target: e.target.value as any })}>
                              <option value="all">All Hunters</option>
                              <option value="project">Project Followers</option>
                           </select></div>
                           {msgData.target === 'project' && (
                              <div className="relative">
                                 <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest ml-1">Search Project</label>
                                 <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input type="text" className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-950 rounded-2xl font-black text-xs outline-none" placeholder="Filter projects..." value={commsSearch} onChange={e => setCommsSearch(e.target.value)} />
                                 </div>
                                 {commsSearch && commsProjectResults.length > 0 && (
                                    <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 rounded-xl shadow-2xl border dark:border-slate-700 z-50 p-1">
                                       {commsProjectResults.map(p => (
                                          <button key={p.id} onClick={() => { setMsgData({ ...msgData, projectId: p.id }); setCommsSearch(''); }} className={`w-full text-left px-4 py-3 rounded-lg text-[10px] font-black uppercase flex items-center gap-3 ${msgData.projectId === p.id ? 'bg-primary-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500'}`}>
                                             <img src={p.icon} className="w-6 h-6 rounded-md object-cover" />
                                             {p.name}
                                          </button>
                                       ))}
                                    </div>
                                 )}
                              </div>
                           )}
                        </div>
                        <button onClick={sendBroadcast} className="w-full py-5 bg-primary-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"><Send size={18} /> Broadcast Payload</button>
                     </div>
                  </div>
               )}

               {(activeTab === 'airdrops' || activeTab === 'infofi') && (
                  <SectionWrapper title={activeTab === 'infofi' ? t('infofi') : t('airdrops')} onAdd={() => openModal(activeTab === 'infofi' ? 'infofi' : 'airdrop')}>
                     <div className="mb-6 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" placeholder="Search projects..." className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold outline-none border-2 border-transparent focus:border-primary-500 transition-all" value={projectSearch} onChange={e => { setProjectSearch(e.target.value); setProjectPage(1); }} />
                     </div>
                     <div className="space-y-3 mb-8">
                        {projectList.items.map(a => <ListItem key={a.id} title={a.name} sub={`${a.investment} - ${a.status}`} img={a.icon} onEdit={() => openModal(a.hasInfoFi ? 'infofi' : 'airdrop', a)} onDelete={() => { deleteFromDb('airdrops', a.id); setAirdrops(p => p.filter(x => x.id !== a.id)); }} />)}
                        {projectList.count === 0 && <div className="p-20 text-center text-slate-400 font-black uppercase text-xs">No matching units found in current sector.</div>}
                     </div>
                     {projectList.total > 1 && (
                        <div className="flex items-center justify-center gap-2">
                           <button onClick={() => setProjectPage(p => Math.max(1, p - 1))} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary-600 transition-all shadow-sm"><ChevronLeft size={20} /></button>
                           <div className="flex gap-1">
                              {Array.from({ length: projectList.total }, (_, i) => (
                                 <button key={i} onClick={() => setProjectPage(i + 1)} className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${projectPage === i + 1 ? 'bg-primary-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'}`}>{i + 1}</button>
                              ))}
                           </div>
                           <button onClick={() => setProjectPage(p => Math.min(projectList.total, p + 1))} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary-600 transition-all shadow-sm"><ChevronRight size={20} /></button>
                        </div>
                     )}
                  </SectionWrapper>
               )}

               {activeTab === 'platforms' && <SectionWrapper title={t('platforms')} onAdd={() => openModal('platform')}><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{infofiPlatforms.map(p => <ListItem key={p.id} title={p.name} sub="Verified Hub" img={p.logo} onEdit={() => openModal('platform', p)} onDelete={() => { deleteFromDb('infofi_platforms', p.id); setInfofiPlatforms(prev => prev.filter(x => x.id !== p.id)); }} />)}</div></SectionWrapper>}
               {activeTab === 'investors' && <SectionWrapper title={t('investors')} onAdd={() => openModal('investor')}><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{investors.map(inv => <ListItem key={inv.id} title={inv.name} sub="VC Entity" img={inv.logo} onEdit={() => openModal('investor', inv)} onDelete={() => { deleteFromDb('investors', inv.id); setInvestors(prev => prev.filter(x => x.id !== inv.id)); }} />)}</div></SectionWrapper>}
               {activeTab === 'claims' && <SectionWrapper title={t('claims')} onAdd={() => openModal('claim')}><div className="space-y-3">{claims.filter(c => c.type === 'claim').map(c => <ListItem key={c.id} title={c.projectName} sub={c.link} img={c.icon} onEdit={() => openModal('claim', c)} onDelete={() => { deleteFromDb('claims', c.id); setClaims(p => p.filter(x => x.id !== c.id)); }} />)}</div></SectionWrapper>}
               {activeTab === 'presales' && <SectionWrapper title={t('presales')} onAdd={() => openModal('presale')}><div className="space-y-3">{claims.filter(c => c.type === 'presale').map(c => <ListItem key={c.id} title={c.projectName} sub={c.fdv || 'TBA'} img={c.icon} onEdit={() => openModal('presale', c)} onDelete={() => { deleteFromDb('claims', c.id); setClaims(p => p.filter(x => x.id !== c.id)); }} />)}</div></SectionWrapper>}
               {activeTab === 'announcements' && <SectionWrapper title={t('announcements')} onAdd={() => openModal('announcement')}><div className="space-y-3">{announcements.map(a => <ListItem key={a.id} title={a.text} sub={a.link || 'System Msg'} img="" onEdit={() => openModal('announcement', a)} onDelete={() => { deleteFromDb('announcements', a.id); setAnnouncements(prev => prev.filter(x => x.id !== a.id)); }} />)}</div></SectionWrapper>}
               {activeTab === 'tools' && <SectionWrapper title={t('tools')} onAdd={() => openModal('tool')}><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{tools.map(tool => <ListItem key={tool.id} title={tool.name} sub={tool.category} img={tool.logo} onEdit={() => openModal('tool', tool)} onDelete={() => { deleteFromDb('tools', tool.id); setTools(prev => prev.filter(x => x.id !== tool.id)); }} />)}</div></SectionWrapper>}
               {activeTab === 'chains' && <SectionWrapper title={t('chains')} onAdd={() => openModal('chain')}><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{chains.map(c => <ListItem key={c.id} title={c.name} sub={`ID: ${c.chainId}`} img={c.logo} onEdit={() => openModal('chain', c)} onDelete={() => { deleteFromDb('chains', c.id); setChains(p => p.filter(x => x.id !== c.id)); }} />)}</div></SectionWrapper>}
               {activeTab === 'gm' && <SectionWrapper title="Daily GM Ops" onAdd={() => openModal('gm')}><div className="space-y-3">{activities.filter(a => a.type === 'gm').map(a => <ListItem key={a.id} title={a.name} sub={`Chain ${a.chainId}`} img={a.logo} onEdit={() => openModal('gm', a)} onDelete={() => { deleteFromDb('activities', a.id); setActivities(p => p.filter(x => x.id !== a.id)); }} />)}</div></SectionWrapper>}
               {activeTab === 'mint' && <SectionWrapper title="Daily Mint Ops" onAdd={() => openModal('mint')}><div className="space-y-3">{activities.filter(a => a.type === 'mint').map(a => <ListItem key={a.id} title={a.name} sub={`Chain ${a.chainId}`} img={a.logo} onEdit={() => openModal('mint', a)} onDelete={() => { deleteFromDb('activities', a.id); setActivities(p => p.filter(x => x.id !== a.id)); }} />)}</div></SectionWrapper>}
               {activeTab === 'deploy' && <SectionWrapper title="Deploy Hub Ops" onAdd={() => openModal('deploy')}><div className="space-y-3">{activities.filter(a => a.type === 'deploy').map(a => <ListItem key={a.id} title={a.name} sub={`Chain ${a.chainId}`} img={a.logo} onEdit={() => openModal('deploy', a)} onDelete={() => { deleteFromDb('activities', a.id); setActivities(p => p.filter(x => x.id !== a.id)); }} />)}</div></SectionWrapper>}
               {activeTab === 'rpg' && <SectionWrapper title="RPG Activity Control" onAdd={() => openModal('rpg')}><div className="space-y-3">{activities.filter(a => a.type === 'rpg').map(a => <ListItem key={a.id} title={a.name} sub={`Chain ${a.chainId} - Bonus XP: ${a.extraXP}`} img={a.logo} onEdit={() => openModal('rpg', a)} onDelete={() => { deleteFromDb('activities', a.id); setActivities(p => p.filter(x => x.id !== a.id)); }} />)}</div></SectionWrapper>}
            </main>
         </div>

         {showModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl">
               <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[3.5rem] p-12 shadow-2xl relative border dark:border-slate-800 overflow-hidden">
                  <button onClick={() => setShowModal(null)} className="absolute top-8 right-8 text-slate-400 hover:text-red-500 transition-colors z-20"><X size={28} /></button>
                  <h3 className="text-3xl font-black mb-10 tracking-tighter uppercase relative z-10">{showModal} Configuration</h3>
                  <div className="grid grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar relative z-10">

                     {showModal === 'announcement' && (
                        <div className="col-span-2 space-y-4">
                           <Fld label="Content Text" val={formData.text || ''} onChange={v => setFormData({ ...formData, text: v })} />
                           <div className="grid grid-cols-2 gap-4">
                              <Fld label="Emoji Prefix" val={formData.emoji || '📢'} onChange={v => setFormData({ ...formData, emoji: v })} />
                              <Fld label="Destination URL" val={formData.link || ''} onChange={v => setFormData({ ...formData, link: v })} />
                           </div>
                        </div>
                     )}

                     {showModal === 'tool' && (
                        <div className="col-span-2 space-y-4">
                           <Fld label="Tool Name" val={formData.name || ''} onChange={v => setFormData({ ...formData, name: v })} />
                           <Fld label="Tool Description" val={formData.description || ''} onChange={v => setFormData({ ...formData, description: v })} />
                           <Fld label="Destination URL" val={formData.link || ''} onChange={v => setFormData({ ...formData, link: v })} />
                           <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Category</label>
                              <select className="w-full p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl font-bold text-xs outline-none" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as ToolCategory })}>
                                 <option value="Research">Research</option>
                                 <option value="Security">Security</option>
                                 <option value="Dex Data">Dex Data</option>
                                 <option value="Wallets">Wallets</option>
                                 <option value="Bots">Bots</option>
                                 <option value="Track Assets">Track Assets</option>
                              </select>
                           </div>
                        </div>
                     )}

                     {showModal === 'platform' && <div className="col-span-2"><Fld label="Platform Name" val={formData.name || ''} onChange={v => setFormData({ ...formData, name: v })} /></div>}
                     {showModal === 'investor' && <div className="col-span-2"><Fld label="Investor / VC Name" val={formData.name || ''} onChange={v => setFormData({ ...formData, name: v })} /></div>}

                     {(['airdrop', 'infofi'].includes(showModal)) && (
                        <>
                           <div className="col-span-2"><Fld label="Project Name" val={formData.name || ''} onChange={v => setFormData({ ...formData, name: v })} /></div>
                           <div className="grid grid-cols-2 gap-4">
                              <Fld label="Funds Raised" val={formData.investment || ''} onChange={v => setFormData({ ...formData, investment: v })} />
                              <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Status</label>
                                    <select className="w-full p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl font-bold text-xs outline-none" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                       <option value="Potential">Potential</option>
                                       <option value="Claim Available">Claim Available</option>
                                       <option value="Airdrop Confirmed">Airdrop Confirmed</option>
                                    </select>
                                 </div>
                                 <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Type</label>
                                    <select className="w-full p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl font-bold text-xs outline-none" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                       <option value="Free">Free</option>
                                       <option value="Paid">Paid</option>
                                       <option value="Gas Only">Gas Only</option>
                                       <option value="Waitlist">Waitlist</option>
                                       <option value="Testnet">Testnet</option>
                                    </select>
                                 </div>
                              </div>
                           </div>

                           <div className="col-span-2 grid grid-cols-3 gap-3 border-t dark:border-slate-800 pt-6">
                              <Fld label="Website" val={formData.socials?.website || ''} onChange={v => setFormData({ ...formData, socials: { ...formData.socials, website: v } })} />
                              <div className="relative">
                                 <Fld label="Twitter" val={formData.socials?.twitter || ''} onChange={v => setFormData({ ...formData, socials: { ...formData.socials, twitter: v } })} />
                                 <button onClick={() => {
                                    const tw = formData.socials?.twitter;
                                    if (!tw) return addToast("Enter Twitter URL first", "error");
                                    const user = tw.split('/').pop();
                                    if (user) {
                                       setFormData(prev => ({ ...prev, icon: `https://unavatar.io/twitter/${user}`, logo: `https://unavatar.io/twitter/${user}` }));
                                       addToast("Profile data fetched from Unavatar");
                                    }
                                 }} className="absolute right-2 top-8 p-1.5 bg-sky-500 text-white rounded-lg shadow-sm hover:scale-105 transition-transform" title="Fetch Profile Pic"><Sparkles size={12} /></button>
                              </div>
                              <Fld label="Discord" val={formData.socials?.discord || ''} onChange={v => setFormData({ ...formData, socials: { ...formData.socials, discord: v } })} />
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                              <Fld label="Campaign URL" val={formData.campaignUrl || ''} onChange={v => setFormData({ ...formData, campaignUrl: v })} />
                              <Fld label="Claim URL" val={formData.claimUrl || ''} onChange={v => setFormData({ ...formData, claimUrl: v })} />
                           </div>

                           {/* Backers Autocomplete Search */}
                           <div className="col-span-2 bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border dark:border-slate-800 space-y-4">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('backers')}</label>
                              <div className="relative">
                                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                 <input
                                    type="text"
                                    placeholder="Search investor by name..."
                                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold outline-none border focus:border-primary-500 shadow-sm"
                                    value={backerSearch}
                                    onChange={e => setBackerSearch(e.target.value)}
                                 />
                                 {backerSearch && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl shadow-2xl z-[100] max-h-40 overflow-y-auto">
                                       {backerSearchResults.map(inv => (
                                          <button key={inv.id} onClick={() => { toggleBackerSelection(inv.id); setBackerSearch(''); }} className={`w-full text-left px-4 py-3 flex items-center justify-between text-[11px] font-black uppercase hover:bg-slate-50 dark:hover:bg-slate-800 ${formData.backerIds?.includes(inv.id) ? 'text-primary-600' : 'text-slate-500'}`}>
                                             <div className="flex items-center gap-3">
                                                <img src={inv.logo} className="w-6 h-6 rounded-md object-cover" />
                                                <span>{inv.name}</span>
                                             </div>
                                             {formData.backerIds?.includes(inv.id) && <Check size={14} />}
                                          </button>
                                       ))}
                                       {backerSearchResults.length === 0 && <div className="p-4 text-center text-[10px] font-black text-slate-400 uppercase">No entities found</div>}
                                    </div>
                                 )}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                 {(formData.backerIds || []).map((id: string) => {
                                    const inv = investors.find(i => i.id === id);
                                    return inv ? (
                                       <div key={id} className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg">
                                          <img src={inv.logo} className="w-4 h-4 rounded object-cover" />
                                          <span>{inv.name}</span>
                                          <button onClick={() => toggleBackerSelection(id)} className="hover:text-red-300"><X size={10} /></button>
                                       </div>
                                    ) : null;
                                 })}
                              </div>
                           </div>

                           {showModal === 'infofi' && (
                              <div className="col-span-2">
                                 <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">{t('platformLabel')}</label>
                                 <select className="w-full p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl font-bold text-xs outline-none" value={formData.platform} onChange={e => setFormData({ ...formData, platform: e.target.value })}>
                                    {infofiPlatforms.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                 </select>
                              </div>
                           )}

                           <div className="col-span-2"><label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Project Info / Details</label><textarea className="w-full p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl font-bold text-xs h-32 outline-none" value={formData.projectInfo || ''} onChange={e => setFormData({ ...formData, projectInfo: e.target.value })} /></div>



                           {showModal === 'infofi' && (
                              <div className="col-span-2 space-y-4 border-t dark:border-slate-800 pt-6 mt-4">
                                 <h4 className="text-sm font-black uppercase tracking-widest text-amber-500">Leaderboard Management</h4>
                                 <div className="mb-4">
                                    <Fld label="Potential Reward (e.g. Top 50 1000$)" val={formData.potentialReward || ''} onChange={v => setFormData({ ...formData, potentialReward: v })} />
                                 </div>
                                 <div className="grid grid-cols-1 gap-3">
                                    {formData.topUsers?.map((u: any, idx: number) => (
                                       <div key={idx} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl">
                                          <span className="w-8 font-black text-xs text-slate-400 text-center">#{idx + 1}</span>
                                          {u.avatar && <img src={u.avatar} className="w-8 h-8 rounded-full object-cover border border-slate-200" />}
                                          <div className="flex-1 min-w-0 flex flex-col gap-1">
                                             <input
                                                type="text"
                                                className="w-full bg-white dark:bg-slate-900 p-2 rounded-lg text-[10px] font-bold outline-none"
                                                placeholder="Twitter Handle / URL"
                                                value={u.twitterUrl || ''}
                                                onChange={e => {
                                                   const val = e.target.value;
                                                   // Auto-update avatar if URL is pasted
                                                   const newUsers = [...(formData.topUsers || [])];
                                                   newUsers[idx] = {
                                                      ...u,
                                                      twitterUrl: val
                                                   };

                                                   if (val.includes('twitter.com') || val.includes('x.com')) {
                                                      const clean = val.split('?')[0];
                                                      const parts = clean.split('/');
                                                      const username = parts[parts.length - 1] || parts[parts.length - 2];
                                                      if (username) {
                                                         newUsers[idx].avatar = `https://unavatar.io/twitter/${username}`;
                                                         newUsers[idx].name = `@${username}`;
                                                      }
                                                   }
                                                   setFormData({ ...formData, topUsers: newUsers });
                                                }}
                                             />
                                             {u.name && <span className="text-[9px] font-black text-primary-600 pl-1">{u.name}</span>}
                                          </div>
                                          <button onClick={() => {
                                             const tw = u.twitterUrl;
                                             if (!tw) return addToast("Enter Twitter URL", "error");
                                             const username = tw.split('/').pop()?.split('?')[0];
                                             if (username) {
                                                const newUsers = [...(formData.topUsers || [])];
                                                newUsers[idx] = { ...newUsers[idx], avatar: `https://unavatar.io/twitter/${username}` };
                                                setFormData({ ...formData, topUsers: newUsers });
                                                addToast("Fetched avatar");
                                             }
                                          }} className="p-1.5 bg-sky-500 text-white rounded-lg shadow-sm hover:scale-105 transition-transform"><Sparkles size={12} /></button>
                                          {u.avatar && <img src={u.avatar} className="w-8 h-8 rounded-full" />}
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           )}
                        </>
                     )}

                     {(['gm', 'deploy', 'mint', 'rpg'].includes(showModal || '')) && (
                        <div className="col-span-2 space-y-4">
                           <Fld label="Protocol Node Name" val={formData.name || ''} onChange={v => setFormData({ ...formData, name: v })} />
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Target Network</label>
                                 <select className="w-full p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl font-bold text-xs outline-none" value={formData.chainId} onChange={e => setFormData({ ...formData, chainId: parseInt(e.target.value) })}>
                                    {chains.map(c => <option key={c.id} value={c.chainId}>{c.name} ({c.chainId})</option>)}
                                 </select>
                              </div>
                              <Fld label="Function Name (e.g. mint)" val={formData.functionName || ''} onChange={v => setFormData({ ...formData, functionName: v })} />
                           </div>
                           <Fld label="Contract Address" val={formData.contractAddress || ''} onChange={v => setFormData({ ...formData, contractAddress: v })} />
                           <div className="grid grid-cols-2 gap-4">
                              <Fld label="Fee (ETH)" val={formData.mintFee || '0'} onChange={v => setFormData({ ...formData, mintFee: v })} />
                              {showModal === 'rpg' ? <Fld label="Bonus XP" val={formData.extraXP?.toString() || '0'} onChange={v => setFormData({ ...formData, extraXP: parseInt(v) })} /> : <Fld label="UI Color (Hex)" val={formData.color || '#7c3aed'} onChange={v => setFormData({ ...formData, color: v })} />}
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Display Badge</label>
                                 <select className="w-full p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl font-bold text-xs outline-none" value={formData.badge} onChange={e => setFormData({ ...formData, badge: e.target.value })}>
                                    <option value="none">None</option>
                                    <option value="Popular">Popular</option>
                                    <option value="NEW">NEW</option>
                                 </select>
                              </div>
                              <div className="flex items-center gap-2 pt-4">
                                 <input type="checkbox" checked={formData.isTestnet} onChange={e => setFormData({ ...formData, isTestnet: e.target.checked })} className="w-5 h-5 rounded" id="isTest" />
                                 <label htmlFor="isTest" className="text-[10px] font-black uppercase text-slate-400">Testnet Node?</label>
                              </div>
                           </div>
                        </div>
                     )}

                     {showModal === 'chain' && (
                        <>
                           <Fld label="Network Name" val={formData.name || ''} onChange={v => setFormData({ ...formData, name: v })} />
                           <Fld label="Chain ID" val={formData.chainId?.toString() || '1'} onChange={v => setFormData({ ...formData, chainId: parseInt(v) })} />
                           <Fld label="RPC Endpoint" val={formData.rpcUrl || ''} onChange={v => setFormData({ ...formData, rpcUrl: v })} />
                           <Fld label="Explorer URL" val={formData.explorerUrl || ''} onChange={v => setFormData({ ...formData, explorerUrl: v })} />
                           <div className="flex items-center gap-2 mt-4 col-span-2">
                              <input type="checkbox" checked={formData.isTestnet} onChange={e => setFormData({ ...formData, isTestnet: e.target.checked })} className="w-5 h-5 rounded" />
                              <label className="text-[10px] font-black uppercase text-slate-400">Is Testnet?</label>
                           </div>
                        </>
                     )}

                     {(showModal === 'claim' || showModal === 'presale') && (
                        <>
                           <div className="col-span-2"><Fld label="Project Name" val={formData.projectName || ''} onChange={v => setFormData({ ...formData, projectName: v })} /></div>
                           <div className="col-span-2"><Fld label="Destination Link" val={formData.link || ''} onChange={v => setFormData({ ...formData, link: v })} /></div>
                           <div className="grid grid-cols-2 gap-4">
                              {showModal === 'presale' ? <Fld label="Sale FDV" val={formData.fdv || ''} onChange={v => setFormData({ ...formData, fdv: v })} /> : <Fld label="Deadline (e.g. 2024-12-01)" val={formData.deadline || ''} onChange={v => setFormData({ ...formData, deadline: v })} />}
                              {showModal === 'presale' && <Fld label="Start Date" type="date" val={formData.startDate || ''} onChange={v => setFormData({ ...formData, startDate: v })} />}
                           </div>
                           {showModal === 'presale' && (
                              <div>
                                 <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Access Mode</label>
                                 <select className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl font-bold text-xs outline-none" value={formData.whitelist} onChange={e => setFormData({ ...formData, whitelist: e.target.value })}>
                                    <option value="Public">Public</option>
                                    <option value="Whitelist">Whitelist</option>
                                 </select>
                              </div>
                           )}
                           <div className="flex items-center gap-2 mt-4 col-span-2">
                              <input type="checkbox" checked={formData.isUpcoming} onChange={e => setFormData({ ...formData, isUpcoming: e.target.checked })} className="w-5 h-5 rounded" />
                              <label className="text-[10px] font-black uppercase text-slate-400">Mark as Upcoming</label>
                           </div>
                        </>
                     )}

                     {!(showModal === 'announcement') && (
                        <div className="col-span-2 mt-4 p-6 bg-slate-50 dark:bg-slate-900 border-2 border-dashed dark:border-slate-800 rounded-2xl">
                           <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Graphic Resource</label>
                           <input type="file" className="text-xs" onChange={e => handleFile(e, (['airdrop', 'infofi', 'chain', 'claim', 'presale', 'platform', 'investor', 'tool'].includes(showModal || '')) ? (['platform', 'chain', 'investor', 'tool'].includes(showModal || '') ? 'logo' : 'icon') : (showModal === 'mint' ? 'nftImage' : 'logo'))} />
                        </div>
                     )}
                  </div>
                  <button onClick={handleSave} className="w-full mt-10 py-6 bg-primary-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2"><Save size={18} /> Synchronize Protocol</button>
               </div>
            </div>
         )}
      </div>
   );
};

const NavBtn: React.FC<{ icon: any, label: string, active: boolean, count?: number, onClick: () => void }> = ({ icon, label, active, count, onClick }) => (
   <button onClick={onClick} className={`w-full px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-between transition-all ${active ? 'bg-primary-600 text-white shadow-xl shadow-primary-500/30' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
      <div className="flex items-center gap-3">{icon} <span>{label}</span></div>
      {count !== undefined && count > 0 && <span className={`text-[9px] px-2 py-0.5 rounded-md ${active ? 'bg-white text-primary-600' : 'bg-rose-500 text-white shadow-lg'}`}>{count}</span>}
   </button>
);

const SectionWrapper: React.FC<{ title: string, onAdd?: () => void, children: React.ReactNode }> = ({ title, onAdd, children }) => (
   <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border dark:border-slate-800 shadow-sm">
      <div className="flex justify-between items-center mb-10"><h3 className="text-2xl font-black uppercase tracking-tighter">{title}</h3>{onAdd && <button onClick={onAdd} className="px-6 py-3 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Add Entry</button>}</div>
      {children}
   </div>
);

const ListItem: React.FC<{ title: string, sub: string, img: string, onEdit: () => void, onDelete: () => void }> = ({ title, sub, img, onEdit, onDelete }) => (
   <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between group border dark:border-slate-700 hover:border-primary-500 transition-all shadow-sm">
      <div className="flex items-center gap-4 min-w-0">
         {img ? <img src={img} className="w-12 h-12 rounded-xl object-cover shadow-sm group-hover:scale-110 transition-transform" /> : <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 font-black text-[8px]">NO IMG</div>}
         <div className="min-w-0"><p className="font-black text-sm uppercase truncate w-32 md:w-48">{title}</p><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate w-32 md:w-48">{sub}</p></div>
      </div>
      <div className="flex gap-1 transition-all"><button onClick={onEdit} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl text-slate-400 hover:text-primary-600 shadow-sm"><Edit size={16} /></button><button onClick={() => { if (confirm("Purge from protocol?")) onDelete(); }} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl text-slate-400 hover:text-red-500 shadow-sm"><Trash2 size={16} /></button></div>
   </div>
);

const StatBox: React.FC<{ label: string, value: any, icon: any }> = ({ label, value, icon }) => (
   <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">{icon}</div>
      <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p><p className="text-3xl font-black tracking-tighter leading-none">{value}</p></div>
   </div>
);

const ChartBox: React.FC<{ title: string, data: any[], valKey: string, labelKey: string, max: number, color: string }> = ({ title, data, valKey, labelKey, max, color }) => (
   <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border dark:border-slate-800 shadow-sm flex flex-col h-72 min-w-0 overflow-hidden">
      <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8">{title}</h3>
      <div className="flex-1 flex items-end gap-3 px-2 overflow-hidden">
         {data.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-3 group h-full justify-end min-w-0">
               <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl relative overflow-hidden flex flex-col justify-end items-center" style={{ height: '80%' }}>
                  <div className="mb-1 text-[10px] font-black text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                     {d[valKey]}
                  </div>
                  <div className={`${color} transition-all duration-1000 rounded-t-lg group-hover:opacity-80 w-full shadow-lg`} style={{ height: `${Math.max(5, (d[valKey] / Math.max(1, max)) * 100)}%` }} />
               </div>
               <span className="text-[8px] font-black text-slate-400 uppercase truncate w-full text-center">{d[labelKey] || 'T-Point'}</span>
            </div>
         ))}
      </div>
   </div>
);

const Fld: React.FC<{ label: string, val: string, type?: string, onChange: (v: string) => void }> = ({ label, val, type = "text", onChange }) => (
   <div className="mb-4 w-full">
      <label className="text-[9px] font-black uppercase text-slate-400 block mb-1 ml-1 tracking-widest">{label}</label>
      <input type={type} className="w-full p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl font-bold text-xs outline-none border-2 border-transparent focus:border-primary-500 transition-all shadow-inner" value={val || ''} onChange={e => onChange(e.target.value)} />
   </div>
);

export const AdminPanel: React.FC = () => (
   <ErrorBoundary>
      <AdminPanelContent />
   </ErrorBoundary>
);
