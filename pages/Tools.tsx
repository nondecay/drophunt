
import React, { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import { ExternalLink, Search, Filter } from 'lucide-react';
import { ToolCategory } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Tools: React.FC = () => {
  const { tools, t, isDataLoaded } = useApp();
  const [search, setSearch] = useState('');

  if (!isDataLoaded) return <LoadingSpinner />;
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'All'>('All');

  const categories: (ToolCategory | 'All')[] = ['All', 'Research', 'Security', 'Dex Data', 'Wallets', 'Bots', 'Track Assets'];

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const categoryMatch = activeCategory === 'All' || tool.category === activeCategory;
      const searchMatch = tool.name.toLowerCase().includes(search.toLowerCase()) ||
        tool.description.toLowerCase().includes(search.toLowerCase());
      return categoryMatch && searchMatch;
    });
  }, [tools, activeCategory, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 pb-24 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">{t('tools')}</h1>
          <p className="text-slate-500 font-medium text-lg tracking-wide mt-3">{t('toolsPortalSub')}</p>
        </div>

        <div className="relative group min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder={t('search')}
            className="w-full pl-12 pr-6 py-4 rounded-[1.5rem] bg-white dark:bg-slate-900 border dark:border-slate-800 outline-none font-bold text-sm focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-12">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeCategory === cat
              ? 'bg-primary-600 text-white shadow-xl shadow-primary-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-primary-50 dark:hover:bg-slate-800'
              }`}
          >
            {cat === 'All' ? t('allCategories') : cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTools.map(tool => (
          <div key={tool.id} className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center group hover:shadow-xl transition-all border-b-4 border-b-primary-600 h-[300px]">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 p-3 mb-4 group-hover:scale-110 transition-transform shadow-inner flex items-center justify-center">
              <img src={tool.logo || '/logo.png'} className="w-full h-full object-contain" />
            </div>
            <span className="text-[9px] font-black uppercase text-primary-600 tracking-[0.2em] mb-2">{tool.category}</span>
            <h3 className="text-lg font-black mb-2 line-clamp-1">{tool.name}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-medium leading-relaxed mb-4 line-clamp-3">
              {tool.description}
            </p>
            <div className="mt-auto w-full">
              <a
                href={tool.link}
                target="_blank"
                rel="noreferrer"
                className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-primary-500/20 hover:bg-primary-700 active:scale-95 transition-all"
              >
                Go Website! <ExternalLink size={12} />
              </a>
            </div>
          </div>
        ))}
        {filteredTools.length === 0 && (
          <div className="col-span-full py-24 text-center border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem]">
            <p className="text-slate-300 font-black uppercase tracking-widest">No tools found in this sector.</p>
          </div>
        )}
      </div>
    </div>
  );
};
