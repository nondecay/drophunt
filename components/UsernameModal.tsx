import React, { useState } from 'react';
import { useApp } from '../AppContext';

export const UsernameModal: React.FC = () => {
    const { user, isVerified, setUsername, showUsernameModal, disconnected } = useApp();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!user || disconnected || !isVerified || !showUsernameModal) return null;

    // Don't show if username is already set custom (not Hunter_...)
    // But showUsernameModal global state controls this mostly.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name.trim() || name.length < 3) return setError("Minimum 3 characters.");
        if (!/^[a-zA-Z0-9_]+$/.test(name)) return setError("Alphanumeric only.");

        setLoading(true);
        const success = await setUsername(name);
        setLoading(false);
        if (!success) setError("Username taken or invalid.");
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-indigo-500"></div>

                <h2 className="text-2xl font-black text-white text-center mb-2 uppercase tracking-tight">Identity Required</h2>
                <p className="text-center text-slate-400 text-xs mb-8">Choose a unique codename for the DropHunt network.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <input
                            type="text"
                            className="w-full bg-slate-950 border-2 border-slate-800 focus:border-primary-500 rounded-xl p-4 text-center font-black text-xl text-white outline-none transition-all placeholder:text-slate-700"
                            placeholder="USERNAME"
                            value={name}
                            onChange={(e) => setName(e.target.value.substring(0, 15))}
                            autoFocus
                        />
                        {error && <p className="text-red-500 text-center text-xs font-bold mt-2 animate-pulse">{error}</p>}
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-white text-black font-black p-4 rounded-xl hover:scale-105 active:scale-95 transition-all text-sm uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Registering...' : 'Establish Identity'}
                    </button>

                    <p className="text-[10px] text-center text-slate-600 font-mono">
                        This will be permanently valid for your wallet.
                    </p>
                </form>
            </div>
        </div>
    );
};
