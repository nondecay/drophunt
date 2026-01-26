import React from 'react';
import { useApp } from '../AppContext';
import { ShieldAlert, Lock, Clock } from 'lucide-react';

export const BannedScreen: React.FC = () => {
    const { user, isAuthLoading } = useApp();

    if (isAuthLoading || !user) return null;

    const isPerma = user.isPermaBanned;
    const isTemp = user.bannedUntil && new Date(user.bannedUntil).getTime() > Date.now();

    if (!isPerma && !isTemp) return null;

    const remainingTime = isTemp
        ? Math.ceil((new Date(user.bannedUntil!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white p-6 animate-in fade-in duration-500">
            <div className="bg-rose-950/30 p-10 rounded-[3rem] border border-rose-500/30 max-w-lg w-full backdrop-blur-md text-center shadow-2xl shadow-rose-900/50">
                <div className="w-24 h-24 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-8 ring-4 ring-rose-500/10">
                    <ShieldAlert size={48} />
                </div>

                <h1 className="text-4xl font-black uppercase tracking-tighter mb-4 text-white">
                    {isPerma ? 'Account Terminated' : 'Account Suspended'}
                </h1>

                <p className="text-rose-200/80 font-medium mb-8 leading-relaxed">
                    {isPerma
                        ? 'Your access to this protocol has been permanently revoked due to severe violations of our community guidelines.'
                        : `Your account is temporarily suspended. Access will be restored in approximately ${remainingTime} days.`
                    }
                </p>

                <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5 flex items-center justify-center gap-4 mb-8">
                    {isPerma ? <Lock size={20} className="text-slate-400" /> : <Clock size={20} className="text-amber-400" />}
                    <span className="font-mono text-sm uppercase tracking-widest text-slate-400">
                        {isPerma ? 'Code: PERMA_BAN_ENFORCED' : `Lift Date: ${new Date(user.bannedUntil!).toLocaleDateString()}`}
                    </span>
                </div>

                <a href="https://twitter.com/drophunt" target="_blank" rel="noreferrer" className="block w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all">
                    Contact Support
                </a>
            </div>
        </div>
    );
};
