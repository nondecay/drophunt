
import React from 'react';
import { useApp } from '../AppContext';
import { ExternalLink, Clock, AlertTriangle, ArrowRight, ShieldCheck, Calendar, Coins } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

// Image Proxy Helper
const getImgUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `https://bxklsejtopzevituoaxk.supabase.co/storage/v1/object/public/${path}`;
};

const ensureHttp = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `https://${url}`;
};

export const Claims: React.FC<{ type: 'claims' | 'presales' }> = ({ type }) => {
  const { claims, t, isDataLoaded } = useApp();

  if (!isDataLoaded) return <LoadingSpinner />;

  // Use claims collection and filter by the type specified in the route
  const targetType = type === 'claims' ? 'claim' : 'presale';
  const data = claims.filter(c => c.type === targetType);

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="mb-12">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-3">
          {type === 'claims' ? 'Claims' : t('presalePortalTitle')}
        </h1>
        <p className="text-slate-500 font-medium text-lg tracking-wide">
          {type === 'claims' ? 'Explore Airdrop Claims' : t('presalePortalSub')}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-4 border-dashed border-slate-100 dark:border-slate-800">
            <p className="text-slate-300 font-black uppercase text-xl tracking-widest">No active windows</p>
          </div>
        ) : (
          data.map((item: any) => (
            <div key={item.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col h-full group hover:shadow-2xl transition-all border-b-8 border-b-primary-600">
              <div className="flex items-center gap-4 mb-6">
                <img src={getImgUrl(item.icon)} className="w-16 h-16 rounded-2xl object-cover ring-4 ring-primary-50 dark:ring-slate-800 shadow-xl" alt="" />
                <div>
                  <h3 className="text-xl font-black tracking-tight">{item.projectName}</h3>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase">
                      {type === 'claims' ? <Coins size={10} /> : <Clock size={10} />}
                      {item.isUpcoming ? 'Starting Soon' : (item.deadline ? `Ending: ${item.deadline}` : (type === 'claims' ? 'Claim Available' : t('goPresaleSite')))}
                    </div>
                    {type === 'presales' && item.startDate && (
                      <div className="flex items-center gap-1 text-[9px] font-black text-primary-500 uppercase">
                        <Calendar size={10} />
                        Start at: {item.startDate}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {type === 'presales' && (
                <div className="grid grid-cols-2 gap-2 mb-6">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <p className="text-[8px] font-black text-slate-400 uppercase">Sale FDV</p>
                    <p className="text-xs font-black text-primary-600">{item.fdv || 'TBA'}</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <p className="text-[8px] font-black text-slate-400 uppercase">Status</p>
                    <p className={`text-xs font-black ${item.whitelist === 'Whitelist' ? 'text-emerald-500' : 'text-primary-500'}`}>{item.whitelist || 'Public'}</p>
                  </div>
                </div>
              )}

              <div className="mt-auto">
                <a
                  href={item.isUpcoming ? undefined : ensureHttp(item.link)}
                  target="_blank"
                  rel="noreferrer"
                  className={`w-full py-3.5 rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-xl text-[10px] uppercase tracking-widest ${item.isUpcoming
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-500/20 active:scale-95'
                    }`}
                >
                  {item.isUpcoming ? 'Upcoming' : (type === 'claims' ? 'Go Claim Site' : 'Join Presale')}
                  {!item.isUpcoming && <ExternalLink size={14} />}
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
