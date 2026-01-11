
import React, { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import { Search, ChevronDown, Check, ArrowUpDown, ChevronLeft, ChevronRight, Users, ExternalLink, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

import { LoadingSpinner } from '../components/LoadingSpinner';

// Image Proxy Helper
const getImgUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `https://bxklsejtopzevituoaxk.supabase.co/storage/v1/object/public/${path}`;
};

export const Investors: React.FC = () => {
  const { investors = [], airdrops = [], t, isDataLoaded } = useApp();
  const [search, setSearch] = useState('');

  const [sortBy, setSortBy] = useState('most_projects');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const investorData = useMemo(() => {
    return investors.map(inv => {
      const supportedProjects = airdrops.filter(a => a.backerIds?.includes(inv.id));
      const sorted = supportedProjects.sort((a, b) => b.createdAt - a.createdAt);
      const latestProject = sorted.length > 0 ? sorted[0] : null;

      return {
        ...inv,
        projectCount: supportedProjects.length,
        latestInvestmentDate: latestProject ? new Date(latestProject.createdAt).toLocaleDateString() : 'N/A',
      };
    });
  }, [investors, airdrops]);

  const filteredAndSortedAll = useMemo(() => {
    return investorData.filter(inv =>
      inv.name.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => {
      if (sortBy === 'most_projects') return b.projectCount - a.projectCount;
      if (sortBy === 'newest') return b.createdAt - a.createdAt;
      return 0;
    });
  }, [investorData, search, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedAll.length / itemsPerPage);
  const currentItems = filteredAndSortedAll.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (!isDataLoaded) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">{t('investors')}</h1>
          <p className="text-slate-500 font-medium text-sm tracking-wide mt-2">{t('investorPortalSub')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder={t('investorSearch')}
              className="pl-12 pr-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 outline-none w-full sm:w-64 font-bold focus:ring-4 focus:ring-primary-500/10 transition-all text-sm"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div className="relative">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-5 pr-12 py-3 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl font-black text-xs uppercase tracking-wider shadow-sm hover:border-primary-500 transition-all outline-none cursor-pointer text-slate-600 dark:text-slate-300 focus:ring-4 focus:ring-primary-500/10"
              >
                <option value="most_projects">Most Projects</option>
                <option value="newest">Newest Added</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <Filter size={12} className="text-slate-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] w-16"># Rank</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{t('investors')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{t('totalProjects')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{t('latestInvestment')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right">View Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-slate-400 font-black uppercase tracking-widest">No capital entities found.</td>
                </tr>
              ) : (
                currentItems.map((inv, index) => (
                  <tr key={inv.id} className="group hover:bg-primary-50/30 dark:hover:bg-primary-900/5 transition-all">
                    <td className="px-6 py-5">
                      <span className="font-black text-slate-400 text-xs tracking-tight">#{(currentPage - 1) * itemsPerPage + index + 1}</span>
                    </td>
                    <td className="px-6 py-5">
                      <Link to={`/investor/${inv.id}`} className="flex items-center gap-4">
                        <img src={getImgUrl(inv.logo) || 'https://picsum.photos/seed/' + inv.id + '/200'} className="w-12 h-12 rounded-xl object-cover shadow-lg group-hover:scale-110 transition-transform" alt="" />
                        <span className="font-black text-base uppercase group-hover:text-primary-600 transition-colors">{inv.name}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-5">
                      <div className="inline-flex items-center px-4 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl font-black text-xs text-primary-600">
                        {inv.projectCount} Projects
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-black text-slate-400 uppercase">{inv.latestInvestmentDate}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link to={`/investor/${inv.id}`} className="p-3 inline-flex rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary-600 transition-all shadow-sm">
                        <ExternalLink size={18} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }} className="p-3 rounded-2xl bg-white dark:bg-slate-900 border dark:border-slate-800 text-slate-400 hover:text-primary-600 shadow-sm transition-all"><ChevronLeft size={20} /></button>
          <div className="flex gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => { setCurrentPage(i + 1); window.scrollTo(0, 0); }}
                className={`w-11 h-11 rounded-2xl font-black text-xs transition-all ${currentPage === i + 1 ? 'bg-primary-600 text-white shadow-xl shadow-primary-500/30 scale-110' : 'bg-white dark:bg-slate-900 border dark:border-slate-800 text-slate-400'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }} className="p-3 rounded-2xl bg-white dark:bg-slate-900 border dark:border-slate-800 text-slate-400 hover:text-primary-600 shadow-sm transition-all"><ChevronRight size={20} /></button>
        </div>
      )}
    </div>
  );
};
