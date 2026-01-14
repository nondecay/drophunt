
import React from 'react';
import { ShieldCheck, Wallet } from 'lucide-react';
import { useApp } from '../AppContext';
import { useAccount } from 'wagmi';

export const VerificationModal: React.FC = () => {
    const { user, verifyWallet } = useApp();
    const { isConnected } = useAccount();

    // If user is loaded (logged in) OR wallet not connected, don't show.
    if (user || !isConnected) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300 p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl border-4 border-primary-500/20 text-center relative overflow-hidden">

                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 to-purple-600" />

                <div className="w-20 h-20 bg-primary-50 dark:bg-slate-800 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-white dark:ring-slate-900">
                    <ShieldCheck size={40} />
                </div>

                <h2 className="text-2xl font-black uppercase tracking-tighter mb-3">Verification Required</h2>
                <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                    Please sign a message to verify your wallet ownership and access the protocol.
                </p>

                <button
                    onClick={() => verifyWallet()}
                    className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    <Wallet size={20} />
                    Sign & Verify
                </button>

                <p className="text-xs text-slate-400 font-bold mt-6 uppercase tracking-wider">
                    Secure Authentication
                </p>
            </div>
        </div>
    );
};
