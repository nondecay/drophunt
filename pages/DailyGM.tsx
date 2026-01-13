
// Add missing useMemo import from React.
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../AppContext';
import { Sun, Loader2, Send, Search, Wallet, Globe, ChevronDown, Check, Clock, Zap, Rocket } from 'lucide-react';
import { useAccount, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { parseEther } from 'viem';

// Image Proxy Helper
const getImgUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `https://bxklsejtopzevituoaxk.supabase.co/storage/v1/object/public/${path}`;
};

const GMCard: React.FC<{ activity: any, isExecuting: boolean, onAction: (activity: any) => void }> = ({ activity, isExecuting, onAction }) => {
  const { user, chains, t } = useApp();
  const { isConnected, chainId: currentChainId } = useAccount();
  const { openConnectModal } = useConnectModal();

  const lastTime = user?.lastActivities?.[activity.id] || 0;
  const COOLDOWN_MS = 12 * 60 * 60 * 1000;
  const isCooldown = Date.now() - lastTime < COOLDOWN_MS;

  const calculateTimeLeft = () => {
    const remaining = COOLDOWN_MS - (Date.now() - lastTime);
    if (remaining <= 0) return '';
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const [timeLeft, setTimeLeft] = useState<string>(calculateTimeLeft());

  useEffect(() => {
    if (!isCooldown) return;
    const interval = setInterval(() => {
      const newTime = calculateTimeLeft();
      if (!newTime) {
        clearInterval(interval);
      }
      setTimeLeft(newTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCooldown, lastTime]);

  const isWrongChain = isConnected && currentChainId !== activity.chainId;
  const canPeform = !isCooldown;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col items-center text-center group hover:shadow-xl transition-all relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1" style={{ backgroundColor: activity.color || '#7c3aed' }} />

      {activity.badge && activity.badge !== 'none' && (
        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest text-white shadow-md z-10 ${activity.badge === 'Popular' ? 'bg-primary-600' : 'bg-red-500'}`}>
          {activity.badge}
        </div>
      )}

      <div className="w-14 h-14 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
        <img src={getImgUrl(activity.logo)} className="w-full h-full object-contain" alt="" />
      </div>

      <h3 className="text-xs font-black tracking-tight mb-4 uppercase leading-none truncate w-full px-2">{activity.name}</h3>

      <div className="w-full mt-auto">
        {isCooldown ? (
          <div className="w-full py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-400 flex flex-col items-center gap-0.5 border dark:border-slate-800">
            <span className="text-[7px] font-black uppercase tracking-widest flex items-center gap-1"><Clock size={10} /> {t('cooldown')}</span>
            <span className="text-[9px] font-bold font-mono">{timeLeft}</span>
          </div>
        ) : (
          !isConnected ? (
            <button onClick={openConnectModal} className="mt-auto w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all">
              Connect Wallet
            </button>
          ) : (
            <button
              onClick={() => onAction(activity)}
              disabled={(!canPeform && !isWrongChain) || isExecuting}
              className={`mt-auto w-full py-3 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${isWrongChain
                ? 'bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-600'
                : !canPeform
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-primary-600 text-white shadow-primary-500/30 hover:bg-primary-700 hover:shadow-primary-500/50 hover:scale-[1.02] active:scale-95'
                }`}
            >
              {isExecuting ? <Loader2 size={14} className="animate-spin" /> : (
                <>
                  {isWrongChain ? 'Change Network' : canPeform ? 'Send GM' : 'Cooldown'}
                  {!isWrongChain && canPeform && <Zap size={14} fill="currentColor" />}
                </>
              )}
            </button>
          )
        )}
      </div>
    </div>
  );
};

export const DailyGM: React.FC = () => {
  const { activities, addToast, logActivity, chains, t } = useApp();
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
  const { writeContractAsync, isPending: isTxSending } = useWriteContract();
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { isLoading: isWaitingForTx, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const sortedAllChains = useMemo(() => {
    return [...(chains || [])].sort((a, b) => (a.isTestnet === b.isTestnet ? 0 : a.isTestnet ? 1 : -1));
  }, [chains]);

  const availableChains = (chains || []).filter(c => (mode === 'mainnet' ? !c.isTestnet : c.isTestnet));

  const chainSuggestions = availableChains
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 5);

  const gmActivities = useMemo(() => {
    return activities
      .filter(a =>
        a && a.type === 'gm' &&
        (mode === 'mainnet' ? !a.isTestnet : a.isTestnet) &&
        (selectedChainId === 'all' || a.chainId === selectedChainId)
      )
      .sort((a, b) => {
        if (a.badge === 'Popular' && b.badge !== 'Popular') return -1;
        if (a.badge !== 'Popular' && b.badge === 'Popular') return 1;
        return 0;
      });
  }, [activities, mode, selectedChainId]);

  const activeChainObj = (chains || []).find(c => c.chainId === selectedChainId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        setShowChainDrop(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSendGM = async (activity: any) => {
    if (!isConnected) return addToast("Protocol requires wallet connection", "error");
    if (isExecuting || isTxSending || isWaitingForTx) return;

    setIsExecuting(true);
    try {
      if (currentChainId !== activity.chainId) {
        addToast(`Switching to ${activity.name} node...`, "info");
        await switchChainAsync({ chainId: activity.chainId });
        setIsExecuting(false);
        return;
      }

      const rawFee = activity.mintFee || '0.00035';
      const cleanFee = rawFee.toString().replace(/[^0-9.]/g, '') || '0.00035';
      const valueBigInt = parseEther(cleanFee);
      const funcName = activity.functionName || 'mint';

      setActiveActivityId(activity.id);
      const hash = await writeContractAsync({
        address: activity.contractAddress as `0x${string}`,
        abi: [{ name: funcName, type: 'function', stateMutability: 'payable', inputs: [], outputs: [] }],
        functionName: funcName,
        args: [],
        value: valueBigInt,
      } as any);

      setTxHash(hash);
      addToast(`${funcName.toUpperCase()} sequence initiated.`, "info");
    } catch (error: any) {
      console.error("GM Failed:", error);
      addToast(error?.shortMessage || error?.message || "Protocol transmission failed", "error");
      setIsExecuting(false);
      setActiveActivityId(null);
    }
  };

  useEffect(() => {
    if (isTxSuccess && txHash && activeActivityId) {
      logActivity(activeActivityId);
      addToast(t('gmSuccess'), "success");
      setTxHash(undefined);
      setActiveActivityId(null);
      setIsExecuting(false);
    }
  }, [isTxSuccess, txHash, activeActivityId, t]);

  const globalLoading = isExecuting || isTxSending || (isWaitingForTx && txHash !== undefined);

  return (
    <div className="max-w-6xl mx-auto pb-24 px-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div className="flex flex-col">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-3xl shadow-xl shadow-amber-500/10"><Sun size={40} /></div>
            <h1 className="text-5xl font-black tracking-tighter uppercase leading-none whitespace-nowrap">{t('gmTitle')}</h1>
          </div>
          <p className="text-slate-500 font-medium text-lg tracking-wide">{t('gmSub')}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center" ref={dropdownRef}>
          <div className="relative w-full sm:w-64">
            <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="w-full px-5 py-4 rounded-3xl bg-white dark:bg-slate-900 border dark:border-slate-800 flex items-center justify-between shadow-sm transition-all hover:border-primary-500/50">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  {activeChainObj?.logo ? <img src={getImgUrl(activeChainObj.logo)} className="w-full h-full object-contain" /> : <Globe size={16} className="text-slate-400" />}
                </div>
                <span className="font-black text-xs uppercase tracking-widest">{activeChainObj?.name || t('allChains')}</span>
              </div>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDropdownOpen && (
              <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                <button onClick={() => { setSelectedChainId('all'); setDropdownOpen(false); }} className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-black uppercase transition-all ${selectedChainId === 'all' ? 'bg-primary-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}>
                  <div className="flex items-center gap-3"><Globe size={16} /> <span>{t('allChains')}</span></div>
                </button>
                {sortedAllChains.map(c => (
                  <button key={c.id} onClick={() => { setSelectedChainId(c.chainId); setDropdownOpen(false); }} className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-black uppercase transition-all ${selectedChainId === c.chainId ? 'bg-primary-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 flex items-center justify-center">
                        {c.logo ? <img src={getImgUrl(c.logo)} className="w-full h-full object-contain" /> : <Globe size={16} />}
                      </div>
                      <span>{c.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={t('searchNode')}
              onFocus={() => setShowChainDrop(true)}
              className="w-full pl-14 pr-8 py-4 rounded-3xl bg-white dark:bg-slate-900 border dark:border-slate-800 outline-none font-black text-sm shadow-sm focus:border-primary-500/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {showChainDrop && search.length > 0 && chainSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border dark:border-slate-800 p-1 z-50 animate-in fade-in">
                {chainSuggestions.map(s => (
                  <button key={s.id} onClick={() => { setSelectedChainId(s.chainId); setSearch(s.name); setShowChainDrop(false); }} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
                    <img src={getImgUrl(s.logo)} className="w-4 h-4 object-contain" /> {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex p-1.5 bg-slate-100 dark:bg-slate-900 rounded-[1.5rem] border dark:border-slate-800 shadow-inner">
            <button onClick={() => { setMode('mainnet'); setSelectedChainId('all'); setSearch(''); }} className={`px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${mode === 'mainnet' ? 'bg-primary-600 text-white shadow-xl' : 'text-slate-500'}`}>{t('mainnet')}</button>
            <button onClick={() => { setMode('testnet'); setSelectedChainId('all'); setSearch(''); }} className={`px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${mode === 'testnet' ? 'bg-primary-600 text-white shadow-xl' : 'text-slate-500'}`}>{t('testnet')}</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {gmActivities.map((activity) => (
          <GMCard key={activity.id} activity={activity} isExecuting={globalLoading && activeActivityId === activity.id} onAction={handleSendGM} />
        ))}
        {gmActivities.length === 0 && (
          <div className="col-span-full py-20 text-center border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem]">
            <p className="text-slate-300 font-black uppercase tracking-widest">Sector Inactive</p>
          </div>
        )}
      </div>
    </div>
  );
};
