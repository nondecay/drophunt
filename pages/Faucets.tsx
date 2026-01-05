
import React from 'react';
import { useApp } from '../AppContext';
import { Droplets } from 'lucide-react';

export const Faucets: React.FC = () => {
  const { t } = useApp();

  return (
    <div className="max-w-4xl mx-auto h-[60vh] flex items-center justify-center px-4">
      <div className="relative w-full text-center py-20 bg-white/30 dark:bg-slate-900/30 backdrop-blur-3xl rounded-[4rem] border border-white/20 dark:border-white/5 overflow-hidden shadow-2xl">
         {/* Animated background circles */}
         <div className="absolute top-0 left-0 w-64 h-64 bg-primary-500/20 blur-[100px] -ml-32 -mt-32"></div>
         <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary-600/20 blur-[100px] -mr-32 -mb-32"></div>
         
         <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 bg-primary-600/10 text-primary-600 rounded-[2.5rem] flex items-center justify-center mb-8 animate-bounce shadow-xl border border-primary-500/20">
               <Droplets size={48} />
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase mb-6 bg-gradient-to-b from-primary-400 to-primary-700 bg-clip-text text-transparent">
               FAUCETS
            </h1>
            <p className="text-2xl font-black tracking-[0.3em] uppercase text-primary-600/70 animate-pulse">
               Coming Soon...
            </p>
            <div className="mt-12 flex gap-4">
               {[1,2,3].map(i => (
                  <div key={i} className={`w-3 h-3 rounded-full bg-primary-600/30 animate-pulse`} style={{ animationDelay: `${i * 200}ms` }}></div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};
