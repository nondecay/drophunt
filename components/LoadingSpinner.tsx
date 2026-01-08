import React from 'react';

export const LoadingSpinner: React.FC = () => (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">Initializing Protocol...</p>
    </div>
);
