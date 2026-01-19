
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../AppContext';
import { Sparkles, Loader2, Wallet, Globe, ChevronDown, Check, Search } from 'lucide-react';
import { useAccount, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { parseEther } from 'viem';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { getImgUrl } from '../utils/getImgUrl';

// Image Proxy Helper - Imported from utils

export const DailyMint: React.FC = () => {
   const { activities = [], addToast, chains = [], t, logActivity, isDataLoaded, user } = useApp();

   if (!isDataLoaded) return <LoadingSpinner />;
   const { isConnected, chainId: currentChainId } = useAccount();
   const { openConnectModal } = useConnectModal();
   const { switchChainAsync } = useSwitchChain();
   const [mode, setMode] = useState<'mainnet' | 'testnet'>('mainnet');
   const [selectedChainId, setSelectedChainId] = useState<number | null>(null);
   const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);
   const [chainSearchTerm, setChainSearchTerm] = useState('');
   const chainDropdownRef = useRef<HTMLDivElement>(null);

   const [isProcessing, setIsProcessing] = useState(false);
   const { writeContractAsync, isPending: isTxSending } = useWriteContract();
   const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
   const { isLoading: isWaitingForTx, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });

   const availableChains = (chains || []).filter(c => (mode === 'mainnet' ? !c.isTestnet : c.isTestnet));
   const filteredChains = availableChains.filter(c => c.name.toLowerCase().includes(chainSearchTerm.toLowerCase()));

   useEffect(() => {
      if (!selectedChainId && availableChains.length > 0) {
         setSelectedChainId(availableChains[0].chainId);
      }
   }, [availableChains, selectedChainId]);

   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (chainDropdownRef.current && !chainDropdownRef.current.contains(event.target as Node)) {
            setIsChainDropdownOpen(false);
         }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []);

   const activeMint = (activities || []).find(a => a && a.type === 'mint' && a.chainId === selectedChainId);
   const activeChainObj = (chains || []).find(c => c.chainId === selectedChainId);

   const lastTime = activeMint && user?.lastActivities?.[activeMint.id] ? user.lastActivities[activeMint.id] : 0;
   const COOLDOWN_MS = 12 * 60 * 60 * 1000;
   const isCooldown = Date.now() - lastTime < COOLDOWN_MS;

   const calculateTimeLeft = () => {
      if (!isCooldown) return '';
      const remaining = COOLDOWN_MS - (Date.now() - lastTime);
      if (remaining <= 0) return '';
      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      return `${hours}h ${minutes}m`;
   };

   const [timeLeft, setTimeLeft] = useState<string>(calculateTimeLeft());

   useEffect(() => {
      if (!isCooldown) {
         if (timeLeft) setTimeLeft('');
         return;
      }
      const interval = setInterval(() => {
         const newTime = calculateTimeLeft();
         if (!newTime) clearInterval(interval);
         setTimeLeft(newTime);
      }, 1000);
      return () => clearInterval(interval);
   }, [isCooldown, lastTime]);

   const handleMint = async () => {
      if (!activeMint) return;
      if (isCooldown) return addToast("Cooldown active for this chain.", "error");
      if (!isConnected) {
         if (openConnectModal) openConnectModal();
         return;
      }
      if (isProcessing || isTxSending || isWaitingForTx) return;

      setIsProcessing(true);
      try {
         if (currentChainId !== activeMint.chainId) {
            addToast(`Switching to ${activeMint.name} network...`, "info");
            await switchChainAsync({ chainId: activeMint.chainId });
            await new Promise(resolve => setTimeout(resolve, 1000));
         }

         const rawFee = activeMint.mintFee || '0.00035';
         const cleanFee = rawFee.toString().replace(/[^0-9.]/g, '') || '0.00035';
         const valueBigInt = parseEther(cleanFee);
         const funcName = activeMint.functionName || 'mint';

         const hash = await writeContractAsync({
            address: activeMint.contractAddress as `0x${string}`,
            abi: [{ name: funcName, type: 'function', stateMutability: 'payable', inputs: [], outputs: [] }],
            functionName: funcName,
            args: [],
            value: valueBigInt,
         } as any);
         setTxHash(hash);
         addToast(`Signed! Initiating Artifact ${funcName.toUpperCase()}...`, "info");
      } catch (error: any) {
         console.error("Minting Execution Failure:", error);
         addToast(error?.shortMessage || error?.message || "Action failed", "error");
         setIsProcessing(false);
      }
   };

   useEffect(() => {
      if (isTxSuccess && txHash && activeMint) {
         logActivity(activeMint.id);
         addToast("Artifact secured!", "success");
         setTxHash(undefined);
         setIsProcessing(false);
      }
   }, [isTxSuccess, txHash, activeMint, logActivity]);

   const isLoading = isProcessing || isTxSending || (isWaitingForTx && txHash !== undefined);

   return (
      <div className="max-w-2xl mx-auto pb-24 px-4 flex flex-col items-center">
         <div className="text-center mb-10 w-full flex flex-col items-center">
            <div className="flex items-center justify-center gap-4 mb-4">
               <Sparkles className="text-primary-600" size={40} />
               <h1 className="text-4xl font-black tracking-tighter uppercase">{t('dailyActionsTitle')}</h1>
            </div>
            <p className="text-slate-500 font-medium text-sm text-center">{t('dailyActionsSub')}</p>
         </div>

         <div className="w-full max-w-sm space-y-6">
            {activeMint ? (
               <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-5 border dark:border-slate-800 shadow-2xl relative overflow-hidden">
                  <div className="relative aspect-square rounded-[2.2rem] overflow-hidden mb-5 shadow-xl">
                     <img src={getImgUrl(activeMint.nftImage || activeMint.logo) || 'https://picsum.photos/seed/protocol/500/500'} className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-40"></div>
                     <div className="absolute bottom-5 left-5 right-5 text-white">
                        <p className="text-lg font-black uppercase tracking-tight leading-none mb-1">{activeMint.name}</p>
                        <div className="flex items-center gap-1.5">
                           {activeChainObj?.logo && <img src={getImgUrl(activeChainObj.logo)} className="w-3 h-3 object-contain opacity-80" />}
                           <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest leading-none">{activeChainObj?.name || 'Protocol Node'}</p>
                        </div>
                     </div>
                  </div>

                  <button onClick={handleMint} disabled={isLoading || isCooldown} className={`w-full py-3 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${isCooldown ? 'bg-slate-100 text-slate-400' : 'bg-primary-600 text-white shadow-primary-500/20'}`}
                  >
                     {isLoading ? <Loader2 className="animate-spin" size={20} /> :
                        isCooldown ? <><Clock size={16} /> Cooldown {timeLeft}</> :
                           (!isConnected ? <><Wallet size={18} /> Connect Wallet</> : <>{t('forgeArtifact')}</>)
                     }
                  </button>
               </div>
            ) : (
               <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-4 border-dashed border-slate-100 dark:border-slate-800"><p className="text-slate-300 font-black uppercase text-xl tracking-widest">{t('nodeOffline')}</p></div>
            )}

            <div className="bg-white dark:bg-slate-900 p-4 rounded-[2.5rem] border dark:border-slate-800 shadow-xl flex flex-col gap-4">
               <div className="flex flex-col gap-3">
                  <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border dark:border-slate-800">
                     <button onClick={() => { setMode('mainnet'); setSelectedChainId(null); setChainSearchTerm(''); }} className={`flex-1 px-4 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${mode === 'mainnet' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500'}`}>{t('mainnet')}</button>
                     <button onClick={() => { setMode('testnet'); setSelectedChainId(null); setChainSearchTerm(''); }} className={`flex-1 px-4 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${mode === 'testnet' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500'}`}>{t('testnet')}</button>
                  </div>

                  <div className="relative" ref={chainDropdownRef}>
                     <button onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)} className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 flex items-center justify-between font-black text-xs uppercase tracking-widest transition-all hover:border-primary-500/50 mb-2">
                        <div className="flex items-center gap-3">
                           {activeChainObj?.logo ? <img src={getImgUrl(activeChainObj.logo)} className="w-5 h-5 object-contain" /> : <Globe size={16} className="text-slate-400" />}
                           <span>{activeChainObj?.name || t('selectHub')}</span>
                        </div>
                        <ChevronDown size={14} className={`transition-transform ${isChainDropdownOpen ? 'rotate-180' : ''}`} />
                     </button>

                     <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={14} />
                        <input
                           type="text"
                           placeholder={t('searchNode')}
                           className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 outline-none font-bold text-[10px] focus:border-primary-500/50 transition-all shadow-inner"
                           value={chainSearchTerm}
                           onChange={e => { setChainSearchTerm(e.target.value); setIsChainDropdownOpen(true); }}
                        />
                     </div>

                     {isChainDropdownOpen && (
                        <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border dark:border-slate-800 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                           <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                              {filteredChains.map(c => (
                                 <button key={c.id} onClick={() => { setSelectedChainId(c.chainId); setIsChainDropdownOpen(false); setChainSearchTerm(''); }} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${selectedChainId === c.chainId ? 'bg-primary-600 text-white shadow-lg' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}>
                                    <div className="flex items-center gap-3">
                                       {c.logo ? <img src={getImgUrl(c.logo)} className="w-4 h-4 object-contain" /> : <Globe size={12} />}
                                       <span>{c.name}</span>
                                    </div>
                                    {selectedChainId === c.chainId && <Check size={14} />}
                                 </button>
                              ))}
                              {filteredChains.length === 0 && <div className="p-4 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">No chains found</div>}
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};
