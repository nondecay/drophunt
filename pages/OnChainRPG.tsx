
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../AppContext';
import { Sword, Shield, Trophy, Zap, Heart, Star, Compass, Loader2, Wallet, Globe, Target, MapPin, Check, ChevronDown, Search, ShieldCheck, AlertCircle, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useAccount, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { LoadingSpinner } from '../components/LoadingSpinner';

// Image Proxy Helper
const getImgUrl = (path: string) => {
   if (!path) return '';
   if (path.startsWith('http') || path.startsWith('data:')) return path;
   return `https://bxklsejtopzevituoaxk.supabase.co/storage/v1/object/public/${path}`;
};

export const OnChainRPG: React.FC = () => {
   const { user, activities, gainXP, addToast, usersList, chains, t, isDataLoaded, verifyWallet } = useApp();
   const { isConnected, chainId: currentChainId } = useAccount();
   const { switchChainAsync } = useSwitchChain();
   const { writeContractAsync } = useWriteContract();

   const [missionSearch, setMissionSearch] = useState('');
   const [isMissionDropdownOpen, setIsMissionDropdownOpen] = useState(false);
   const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
   const [isWaitingForTx, setIsWaitingForTx] = useState(false);
   const [rankingPage, setRankingPage] = useState(1);
   const [countdown, setCountdown] = useState('');
   const missionDropdownRef = useRef<HTMLDivElement>(null);

   const { isVerified } = useApp(); // Destructure isVerified

   if (isConnected && !isVerified) {
      return (
         <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-full flex items-center justify-center mb-8 shadow-inner ring-8 ring-white dark:ring-slate-900">
               <ShieldAlert size={48} />
            </div>
            <h2 className="text-4xl font-black tracking-tighter mb-4">Restricted Zone</h2>
            <p className="text-slate-500 font-medium max-w-md mx-auto mb-8 text-lg">
               The RPG Zone requires verified hunter status. Identify yourself to enter.
            </p>
            <button
               onClick={() => verifyWallet()}
               className="px-10 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-3"
            >
               <Zap size={20} /> Sign & Verify
            </button>
         </div>
      );
   }

   const rankPerPage = 10;

   useEffect(() => {
      const updateTimer = () => {
         const now = new Date();
         const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
         const diff = nextMonth.getTime() - now.getTime();
         const d = Math.floor(diff / (1000 * 60 * 60 * 24));
         const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
         const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
         const s = Math.floor((diff % (1000 * 60)) / 1000);
         setCountdown(`${d}d ${h}h ${m}m ${s}s`);
      };
      updateTimer();
      const timer = setInterval(updateTimer, 1000);
      return () => clearInterval(timer);
   }, []);

   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (missionDropdownRef.current && !missionDropdownRef.current.contains(event.target as Node)) {
            setIsMissionDropdownOpen(false);
         }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []);

   const missions = useMemo(() => {
      return activities.filter(a => a.type === 'rpg');
   }, [activities]);

   const filteredMissions = useMemo(() => {
      return missions.filter(m => m.name.toLowerCase().includes(missionSearch.toLowerCase()));
   }, [missions, missionSearch]);

   const activeMission = useMemo(() => {
      return missions.find(m => m.id === selectedMissionId);
   }, [missions, selectedMissionId]);

   const rankedHunters = useMemo(() => {
      if (!usersList) return [];
      return [...usersList].sort((a, b) => ((b.level - 1) * 100 + b.xp) - ((a.level - 1) * 100 + a.xp));
   }, [usersList]);

   const totalPages = Math.ceil(rankedHunters.length / rankPerPage);
   const currentRanked = rankedHunters.slice((rankingPage - 1) * rankPerPage, rankingPage * rankPerPage);

   const handleAdventure = async () => {
      if (!selectedMissionId || !user) return;
      setIsWaitingForTx(true);
      try {
         const mission = activeMission;
         if (!mission) throw new Error("Mission not found");

         if (mission.chainId && currentChainId !== mission.chainId) {
            await switchChainAsync({ chainId: mission.chainId });
         }

         if (mission.contractAddress && mission.abi) {
            await writeContractAsync({
               address: mission.contractAddress as `0x${string}`,
               abi: mission.abi,
               functionName: mission.functionName || 'adventure',
               args: [],
            });
            addToast("Adventure Transaction Sent! Waiting for confirmation...", "success");
         } else {
            await new Promise(resolve => setTimeout(resolve, 2000));
            addToast("Adventure Completed! (Simulation)", "success");
         }
      } catch (e: any) {
         console.error(e);
         addToast("Adventure Failed: " + (e.message || "Unknown error"), "error");
      } finally {
         setIsWaitingForTx(false);
      }
   };

   const userRank = useMemo(() => {
      if (!user || !usersList) return 'N/A';
      const sorted = [...usersList].sort((a, b) => ((b.level - 1) * 100 + b.xp) - ((a.level - 1) * 100 + a.xp));
      const index = sorted.findIndex(u => u.id === user.id);
      return index >= 0 ? index + 1 : 'N/A';
   }, [user, usersList]);

   if (!isDataLoaded) return <LoadingSpinner />;

   // ... (existing code)

   // ... (existing code inside component)

   // Logic to handle !user or !isConnected
   if (!isConnected || !user) {
      // 1. If not connected, show Connect Wallet
      if (!isConnected) {
         return (
            <div className="max-w-4xl mx-auto py-32 text-center px-4">
               <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 text-primary-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner border-2 border-slate-200 dark:border-slate-700 animate-pulse">
                  <Wallet size={48} />
               </div>
               <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-6 text-slate-900 dark:text-white">{t('connectWallet')}</h1>
               <p className="text-slate-500 text-lg md:text-xl font-medium mb-10 max-w-lg mx-auto leading-relaxed">Please connect your wallet to access the Onchain RPG.</p>
               {/* Connect Button is handled by RainbowKit in Header usually, but we can show a hint or custom button if specific connection required */}
               <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl inline-block font-bold">
                  Please use the Connect button in the header.
               </div>
            </div>
         );
      }

      // 2. If connected but not verified (!user), show Verify screen
      return (
         <div className="max-w-4xl mx-auto py-32 text-center px-4">
            <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner border-2 border-amber-500/20 animate-pulse">
               <ShieldCheck size={48} />
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-6 text-slate-900 dark:text-white">Verification Required</h1>
            <p className="text-slate-500 text-lg md:text-xl font-medium mb-10 max-w-lg mx-auto leading-relaxed">You must Verify your wallet for play Onchain RPG.</p>
            <button
               onClick={() => verifyWallet()}
               className="px-10 py-5 bg-primary-600 text-white rounded-3xl font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-3 mx-auto"
            >
               <ShieldCheck size={20} /> Sign And Verify
            </button>
         </div>
      );
   }

   const xpRequired = user.level * 100;
   const progress = (user.xp / xpRequired) * 100;

   return (
      <div className="max-w-6xl mx-auto pb-24 px-4">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Profile Sidebar */}
            <div className="lg:col-span-4 space-y-8">
               <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden group">
                  <div className="flex flex-col items-center text-center relative z-10">
                     <div className="relative mb-8">
                        <img src={getImgUrl(user.avatar)} className="w-36 h-36 rounded-[3rem] object-cover ring-8 ring-primary-50 dark:ring-slate-800 shadow-2xl" />
                        <div className="absolute -bottom-3 -right-3 w-14 h-14 bg-primary-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-2xl border-4 border-white dark:border-slate-900">{user.level}</div>
                     </div>
                     <h2 className="text-3xl font-black tracking-tighter uppercase mb-6 leading-none">{user.username || 'Hunter'}</h2>

                     <div className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border dark:border-slate-800 mb-8">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Position</p>
                        <p className="text-2xl font-black text-primary-600">#{userRank || 'N/A'}</p>
                     </div>

                     <div className="w-full space-y-5 mb-10"><div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-3"><span>{t('expProgress')}</span><span>{user.xp} / {xpRequired}</span></div><div className="h-6 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border-2 border-slate-50 dark:border-slate-800 p-1.5 shadow-inner"><div className="h-full bg-primary-600 rounded-full shadow-lg transition-all duration-1000" style={{ width: `${progress}%` }} /></div></div>
                     <div className="grid grid-cols-2 gap-4 w-full">
                        <StatBox icon={<Heart size={16} className="text-rose-500" />} label="HP" val={user.hp} />
                        <StatBox icon={<Zap size={16} className="text-sky-500" />} label="MP" val={user.mp} />
                        <StatBox icon={<Sword size={16} className="text-primary-500" />} label="ATK" val={user.strength} />
                        <StatBox icon={<ShieldCheck size={16} className="text-emerald-500" />} label="DEF" val={user.defense} />
                     </div>
                  </div>
               </div>
            </div>

            {/* Action & Ranking Area */}
            <div className="lg:col-span-8 space-y-10">
               {/* Compact Slogan & Reset Card */}
               <div className="bg-primary-600 rounded-[2.5rem] p-6 text-white shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="relative z-10">
                     <div className="flex items-center gap-2 mb-2">
                        <Trophy size={20} className="text-amber-300" />
                        <h3 className="text-sm font-black uppercase tracking-tighter">Onchain RPG</h3>
                     </div>
                     <p className="text-[11px] font-black uppercase tracking-widest opacity-90">{t('rpgSub')}</p>
                  </div>
                  <div className="relative z-10 text-center sm:text-right bg-white/10 p-4 rounded-[2rem] border border-white/20 backdrop-blur-md min-w-[180px]">
                     <div className="flex items-center justify-center sm:justify-end gap-2 mb-1 text-primary-100">
                        <Clock size={14} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Monthly Reset In</span>
                     </div>
                     <div className="text-xl font-black tracking-tight font-mono tabular-nums whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>{countdown}</div>
                  </div>
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 blur-3xl rounded-full -mr-24 -mt-24"></div>
               </div>

               <section className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-8 border dark:border-slate-800 shadow-sm relative overflow-hidden">
                  <h3 className="text-2xl font-black mb-6 flex items-center gap-3 uppercase tracking-tighter relative z-10 leading-none"><Compass className="text-primary-600" size={24} /> {t('engageAdventure')}</h3>

                  <div className="p-8 bg-slate-50 dark:bg-slate-950 rounded-[3rem] border-4 border-dashed dark:border-slate-800 shadow-inner relative z-10 text-center">

                     <div className="flex flex-col gap-4 mb-8 items-center justify-center max-w-sm mx-auto" ref={missionDropdownRef}>
                        {activeMission && (
                           <div className="w-20 h-20 p-3 bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-xl border dark:border-slate-800 flex items-center justify-center animate-in zoom-in duration-300">
                              <img src={getImgUrl(activeMission.logo)} className="w-full h-full object-contain" />
                           </div>
                        )}

                        <div className="relative w-full">
                           <div className="mb-3 relative group">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500" size={14} />
                              <input
                                 type="text"
                                 placeholder={t('search')}
                                 className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border dark:border-slate-800 outline-none font-bold text-xs shadow-sm focus:border-primary-500 transition-all"
                                 value={missionSearch}
                                 onChange={e => { setMissionSearch(e.target.value); setIsMissionDropdownOpen(true); }}
                                 onFocus={() => setIsMissionDropdownOpen(true)}
                              />
                           </div>

                           <button onClick={() => setIsMissionDropdownOpen(!isMissionDropdownOpen)} className="w-full px-5 py-4 rounded-[2rem] bg-white dark:bg-slate-900 border dark:border-slate-800 flex items-center justify-between shadow-xl transition-all hover:border-primary-500/50">
                              <div className="flex items-center gap-3">
                                 <Globe size={18} className="text-slate-400" />
                                 <span className="font-black text-xs uppercase tracking-widest">{activeMission?.name || t('selectHub')}</span>
                              </div>
                              <ChevronDown size={18} className={`transition-transform ${isMissionDropdownOpen ? 'rotate-180' : ''}`} />
                           </button>

                           {isMissionDropdownOpen && filteredMissions.length > 0 && (
                              <div className="absolute top-full mt-3 w-full bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border dark:border-slate-800 p-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                 <div className="max-h-64 overflow-y-auto custom-scrollbar p-1">
                                    {filteredMissions.map(m => (
                                       <button key={m.id} onClick={() => { setSelectedMissionId(m.id); setIsMissionDropdownOpen(false); setMissionSearch(''); }} className={`w-full flex items-center justify-between px-5 py-3 rounded-2xl text-xs font-black uppercase transition-all ${selectedMissionId === m.id ? 'bg-primary-600 text-white shadow-xl' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}>
                                          <div className="flex items-center gap-4">
                                             <div className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                                                <img src={getImgUrl(m.logo)} className="w-full h-full object-contain p-1" />
                                             </div>
                                             <div className="text-left">
                                                <p className="font-black text-[10px] leading-tight">{m.name}</p>
                                             </div>
                                          </div>
                                          {selectedMissionId === m.id && <Check size={16} />}
                                       </button>
                                    ))}
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>

                     <button onClick={handleAdventure} disabled={isWaitingForTx || !selectedMissionId} className={`w-full py-6 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-xs flex items-center justify-center gap-4 shadow-2xl transition-all active:scale-95 ${!selectedMissionId ? 'bg-slate-100 text-slate-300' : isWaitingForTx ? 'bg-slate-950 text-white' : 'bg-primary-600 text-white hover:scale-[1.01] shadow-primary-500/40'}`}>
                        {isWaitingForTx ? <Loader2 className="animate-spin" size={20} /> : <><Sword size={20} /> {t('commenceAdventure')}</>}
                     </button>
                  </div>
               </section>

               {/* Ranking */}
               <section className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 border dark:border-slate-800 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-10">
                     <h3 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tighter leading-none"><Trophy className="text-amber-500" size={28} /> {t('hallOfFame')}</h3>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top 100 Ranked Hunters</p>
                  </div>

                  <div className="space-y-3 mb-10">
                     {currentRanked.map((u, i) => (
                        <div key={u.address} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl transition-all hover:bg-white dark:hover:bg-slate-800 border dark:border-slate-700 shadow-sm">
                           <div className="flex items-center gap-5">
                              <span className={`w-8 font-black text-sm ${(rankingPage - 1) * rankPerPage + i < 3 ? 'text-amber-500' : 'text-slate-400'}`}>#{(rankingPage - 1) * rankPerPage + i + 1}</span>
                              <img src={getImgUrl(u.avatar)} className="w-12 h-12 rounded-2xl object-cover shadow-md border-2 border-white dark:border-slate-700" />
                              <div>
                                 <p className="font-black text-sm uppercase leading-none mb-1">{u.username || 'Hunter'}</p>
                                 <p className="text-[10px] font-mono text-slate-400">{u.address.slice(0, 6)}...{u.address.slice(-4)}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-8">
                              <div className="text-center">
                                 <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Level</p>
                                 <p className="font-black text-sm text-primary-600">{u.level}</p>
                              </div>
                              <div className="text-right min-w-[80px]">
                                 <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Total XP</p>
                                 <p className="font-black text-sm">{(u.level - 1) * 100 + u.xp}</p>
                              </div>
                           </div>
                        </div>
                     ))}
                     {rankedHunters.length === 0 && (
                        <div className="py-20 text-center text-slate-400 font-black uppercase text-xs tracking-widest border-2 border-dashed rounded-3xl border-slate-200">No active hunters in ranking.</div>
                     )}
                  </div>

                  {totalPages > 1 && (
                     <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setRankingPage(p => Math.max(1, p - 1))} className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-primary-600 transition-all"><ChevronLeft size={20} /></button>
                        <div className="flex gap-1.5">
                           {Array.from({ length: totalPages }, (_, i) => (
                              <button key={i} onClick={() => setRankingPage(i + 1)} className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${rankingPage === i + 1 ? 'bg-primary-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{i + 1}</button>
                           ))}
                        </div>
                        <button onClick={() => setRankingPage(p => Math.min(totalPages, p + 1))} className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-primary-600 transition-all"><ChevronRight size={20} /></button>
                     </div>
                  )}
               </section>
            </div>
         </div>
      </div>
   );
};

const StatBox: React.FC<{ icon: any, label: string, val: number }> = ({ icon, label, val }) => (
   <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl flex items-center gap-4 border dark:border-slate-800">
      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-inner border dark:border-slate-700">{icon}</div>
      <div className="text-left">
         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
         <p className="font-black text-lg leading-none">{val}</p>
      </div>
   </div>
);
