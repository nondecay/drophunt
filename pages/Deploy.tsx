
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../AppContext';
import { ArrowUpCircle, Search, Loader2, Wallet, Globe, ChevronDown, Check, Clock } from 'lucide-react';
import { useAccount, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { parseEther } from 'viem';
import { LoadingSpinner } from '../components/LoadingSpinner';

const DeployCard: React.FC<{ activity: any, isExecuting: boolean, onAction: (activity: any) => void }> = ({ activity, isExecuting, onAction }) => {
  const { user, chains, t } = useApp();
  const { isConnected, chainId: currentChainId } = useAccount();

  const lastTime = user?.lastActivities?.[activity.id] || 0;
  const COOLDOWN_MS = 12 * 60 * 60 * 1000;
  const isCooldown = Date.now() - lastTime < COOLDOWN_MS;

  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!isCooldown) return;
    const interval = setInterval(() => {
      const remaining = COOLDOWN_MS - (Date.now() - lastTime);
      if (remaining <= 0) {
        setTimeLeft('');
        clearInterval(interval);
      } else {
        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isCooldown, lastTime]);

  const isWrongChain = isConnected && currentChainId !== activity.chainId;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col items-center text-center group hover:shadow-xl transition-all relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1" style={{ backgroundColor: activity.color || '#10b981' }} />

      {activity.badge && activity.badge !== 'none' && (
        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest text-white shadow-md z-10 ${activity.badge === 'Popular' ? 'bg-primary-600' : 'bg-red-500'}`}>
          {activity.badge}
        </div>
      )}

      <div className="w-14 h-14 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
        <img src={activity.logo} className="w-full h-full object-contain" alt="" />
      </div>

      <h3 className="text-xs font-black tracking-tight mb-4 uppercase leading-none truncate w-full px-2">{activity.name}</h3>

      <div className="w-full mt-auto">
        {isCooldown ? (
          <div className="w-full py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-400 flex flex-col items-center gap-0.5 border dark:border-slate-800">
            <span className="text-[7px] font-black uppercase tracking-widest flex items-center gap-1"><Clock size={10} /> {t('cooldown')}</span>
            <span className="text-[9px] font-bold font-mono">{timeLeft}</span>
          </div>
        ) : (
          <button
            onClick={() => onAction(activity)}
            disabled={isExecuting}
            className={`w-full py-3 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${!isConnected ? 'bg-primary-600 text-white shadow-primary-500/20' : isWrongChain ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-primary-600 text-white shadow-primary-500/20'}`}
          >
            {isExecuting ? <Loader2 className="animate-spin" size={14} /> : (!isConnected ? "Connect Wallet" : isWrongChain ? t('syncNetwork') : t('executeDeploy'))}
          </button>
        )}
      </div>
    </div>
  );
};

export const Deploy: React.FC = () => {
  const { activities, addToast, chains, t, logActivity, isDataLoaded } = useApp();

  if (!isDataLoaded) return <LoadingSpinner />;
  const { isConnected, chainId: currentChainId } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChainAsync } = useSwitchChain();
  const [mode, setMode] = useState<'mainnet' | 'testnet'>('mainnet');
  const [search, setSearch] = useState('');
  const [showChainDrop, setShowChainDrop] = useState(false);
  const [selectedChainId, setSelectedChainId] = useState<number | 'all'>('all');
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isExecuting, setIsExecuting] = useState(false);
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const { isLoading: isWaitingForTx } = useWaitForTransactionReceipt({ hash: txHash });

  const availableChains = (chains || []).filter(c => (mode === 'mainnet' ? !c.isTestnet : c.isTestnet));

  const chainSuggestions = availableChains
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 5);

  const deployActivities = useMemo(() => {
    return activities
      .filter(a =>
        a.type === 'deploy' &&
        (mode === 'mainnet' ? !a.isTestnet : a.isTestnet) &&
        (selectedChainId === 'all' || a.chainId === selectedChainId)
      )
      .sort((a, b) => {
        if (a.badge === 'Popular' && b.badge !== 'Popular') return -1;
        if (a.badge !== 'Popular' && b.badge === 'Popular') return 1;
        return 0;
      });
  }, [activities, mode, selectedChainId]);

  const activeChainObj = chains.find(c => c.chainId === selectedChainId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowChainDrop(false);
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeployAction = async (activity: any) => {
    if (!isConnected) return addToast("Protocol requires wallet connection", "error");
    if (isExecuting || isWaitingForTx) return;

    setIsExecuting(true);
    try {
      if (currentChainId !== activity.chainId) {
        addToast(`Switching to ${activity.name} network...`, "info");
        await switchChainAsync({ chainId: activity.chainId });
        setIsExecuting(false);
        return;
      }

      setActiveActivityId(activity.id);

      const rawFee = activity.mintFee || '0';
      const cleanFee = rawFee.toString().replace(/[^0-9.]/g, '') || '0';
      const valueBigInt = parseEther(cleanFee);
      const funcName = activity.functionName || 'deploy';

      const hash = await writeContractAsync({
        address: activity.contractAddress as `0x${string}`,
        abi: [{ "inputs": [], "name": funcName, "outputs": [], "stateMutability": "payable", "type": "function" }],
        functionName: funcName,
        value: valueBigInt,
      } as any);

      setTxHash(hash);
      addToast(t('deploying'), "info");
    } catch (error: any) {
      addToast(error?.shortMessage || error?.message || "Deployment failed", "error");
      setIsExecuting(false);
      setActiveActivityId(null);
    }
  };

  useEffect(() => {
    if (!isWaitingForTx && txHash && activeActivityId) {
      logActivity(activeActivityId);
      addToast(t('contractLive'), "success");
      setTxHash(undefined);
      setActiveActivityId(null);
      setIsExecuting(false);
    }
  }, [isWaitingForTx, txHash, activeActivityId, logActivity, t]);

  const globalLoading = isExecuting || isWaitingForTx;

  return (
    <div className="max-w-6xl mx-auto pb-24 px-4" ref={dropdownRef}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl shadow-lg">
              <ArrowUpCircle size={32} />
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">{t('deployHub')}</h1>
          </div>
          <p className="text-slate-500 font-medium text-sm tracking-wide">{t('deploySub')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center">

          <div className="relative w-full sm:w-64">
            <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="w-full px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border dark:border-slate-800 flex items-center justify-between shadow-sm transition-all hover:border-primary-500/50">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  {activeChainObj?.logo ? <img src={activeChainObj.logo} className="w-full h-full object-contain" /> : <Globe size={14} className="text-slate-400" />}
                </div>
                <span className="font-black text-xs uppercase tracking-widest">{activeChainObj?.name || t('allChains')}</span>
              </div>
              <ChevronDown size={14} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDropdownOpen && (
              <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border dark:border-slate-800 p-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="max-h-64 overflow-y-auto p-1">
                  <button onClick={() => { setSelectedChainId('all'); setDropdownOpen(false); }} className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-black uppercase transition-all ${selectedChainId === 'all' ? 'bg-primary-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}>
                    <div className="flex items-center gap-3"><Globe size={16} /> <span>{t('allChains')}</span></div>
                  </button>
                  {availableChains.map(c => (
                    <button key={c.id} onClick={() => { setSelectedChainId(c.chainId); setDropdownOpen(false); }} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-black uppercase transition-all ${selectedChainId === c.chainId ? 'bg-primary-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}>
                      <div className="flex items-center gap-3">
                        {c.logo ? <img src={c.logo} className="w-5 h-5 object-contain" /> : <Globe size={16} />}
                        <span>{c.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={t('search')}
              onFocus={() => setShowChainDrop(true)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border dark:border-slate-800 outline-none font-black text-xs shadow-sm focus:border-primary-500/50 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {showChainDrop && search.length > 0 && chainSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border dark:border-slate-800 p-1 z-50 animate-in fade-in">
                {chainSuggestions.map(s => (
                  <button key={s.id} onClick={() => { setSelectedChainId(s.chainId); setSearch(s.name); setShowChainDrop(false); }} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
                    <img src={s.logo} className="w-4 h-4 object-contain" /> {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-inner">
            <button onClick={() => { setMode('mainnet'); setSelectedChainId('all'); setSearch(''); }} className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all ${mode === 'mainnet' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-500'}`}>{t('mainnet')}</button>
            <button onClick={() => { setMode('testnet'); setSelectedChainId('all'); setSearch(''); }} className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all ${mode === 'testnet' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-500'}`}>{t('testnet')}</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {deployActivities.map(a => (
          <DeployCard
            key={a.id}
            activity={a}
            isExecuting={globalLoading}
            onAction={handleDeployAction}
          />
        ))}
        {deployActivities.length === 0 && (
          <div className="col-span-full py-20 text-center border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem]">
            <p className="text-slate-300 font-black uppercase tracking-widest">Sector Inactive</p>
          </div>
        )}
      </div>
    </div>
  );
};
