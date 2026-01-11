
import React, { useState } from 'react';
import { User, AuthenticatedUser, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useApp } from '../AppContext';

export const UsernameModal: React.FC = () => {
    const { user, showUsernameModal, setShowUsernameModal, setUsername } = useApp();
    const [input, setInput] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Only show if explicitly triggered by AppContext state
    if (!showUsernameModal) return null;

    const handleSubmit = async () => {
        setError('');

        // Regex: Alphanumeric + symbols, 1-12 chars
        const regex = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{1,12}$/;

        if (!input.match(regex)) {
            setError('Invalid format. Max 12 chars, no spaces.');
            return;
        }

        if (input.length > 12) {
            setError('Too long (max 12 characters).');
            return;
        }

        setLoading(true);
        try {
            const success = await setUsername(input);
            if (success) setShowUsernameModal(false);
        } catch (e: any) {
            setError(e.message || 'Failed to set username');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300 p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl border-4 border-amber-500/20 text-center relative">

                <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-white dark:ring-slate-900">
                    <User size={40} />
                </div>

                <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Select Your Username</h2>
                <p className="text-slate-500 font-medium mb-8 text-sm">
                    We assigned you a codename, but you can change it now.<br />
                    <span className="opacity-75">Max 12 chars. Symbols allowed.</span>
                </p>

                <div className="mb-6 relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={user?.username || "Enter Username"}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 font-black text-center text-lg outline-none focus:border-amber-500 transition-colors uppercase placeholder:text-slate-300 placeholder:normal-case"
                    />
                    {error && (
                        <div className="absolute -bottom-6 left-0 w-full text-center text-rose-500 text-xs font-bold flex items-center justify-center gap-1">
                            <AlertCircle size={10} /> {error}
                        </div>
                    )}
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading || !input}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    {loading ? 'Updating...' : <><Sparkles size={20} /> Update Username</>}
                </button>
                <button
                    onClick={() => setShowUsernameModal(false)}
                    className="text-xs text-slate-400 font-bold uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-200 mt-3 block w-full text-center"
                >
                    Keep Current Name
                </button>
            </div>
        </div>
    );
};
