
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../AppContext';
import { ChevronLeft, ExternalLink, Globe, LayoutDashboard, Target, Users } from 'lucide-react';

export const InvestorDetails: React.FC = () => {
  const { id } = useParams();
  const { investors = [], airdrops = [], t } = useApp();

  const investor = investors.find(i => i.id === id);
  const supportedProjects = airdrops.filter(a => a.backerIds?.includes(id || ''));
  const sorted = [...supportedProjects].sort((a,b) => b.createdAt - a.createdAt);

  if (!investor) return <div className="p-20 text-center font-black uppercase text-slate-500 tracking-widest">{t('loading')}</div>;

  return (
    <div className="max-w-6xl mx-auto pb-24 px-4 animate-in fade-in duration-500">
      <Link to="/investors" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-600 mb-8 transition-colors font-black uppercase text-[10px] tracking-widest">
        <ChevronLeft size={16} /> BACK TO LIST
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden text-center">
              <img src={investor.logo || 'https://picsum.photos/seed/' + investor.id + '/200'} className="w-32 h-32 rounded-[2.5rem] object-cover shadow-xl mx-auto mb-6 ring-8 ring-primary-50 dark:ring-slate-800" />
              <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">{investor.name}</h1>
              <div className="inline-flex px-4 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 rounded-xl text-xs font-black uppercase mb-8">
                {t('investorLabel')}
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                 <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl text-left border dark:border-slate-700">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Portfolio Size</p>
                    <p className="text-3xl font-black text-primary-600">{supportedProjects.length}</p>
                 </div>
                 <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl text-left border dark:border-slate-700">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Latest Investment Date</p>
                    <p className="text-sm font-black uppercase text-slate-600 dark:text-slate-400">
                       {sorted.length > 0 ? new Date(sorted[0].createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                 </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
           <section className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 border dark:border-slate-800 shadow-sm">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-10 flex items-center gap-4">
                <Target size={28} className="text-primary-600" /> {t('backedProjectsLabel')}
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {supportedProjects.map(project => (
                    <Link key={project.id} to={`/project/${project.id}`} className="group p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border dark:border-slate-700 hover:border-primary-500 transition-all flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <img src={project.icon} className="w-12 h-12 rounded-xl object-cover shadow-sm group-hover:scale-110 transition-transform" />
                          <div>
                             <p className="font-black text-sm uppercase leading-none mb-1 group-hover:text-primary-600 transition-colors">{project.name}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{project.investment} Raise</p>
                          </div>
                       </div>
                       <ExternalLink size={16} className="text-slate-300 group-hover:text-primary-600" />
                    </Link>
                 ))}
                 {supportedProjects.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-400 font-black uppercase tracking-widest border-2 border-dashed rounded-3xl border-slate-200">
                       No public investments recorded.
                    </div>
                 )}
              </div>
           </section>
        </div>
      </div>
    </div>
  );
};
