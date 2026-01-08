
import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { Mail, MessageSquare, Shield, Info, Trash2, CheckCircle, Target, Layers } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Inbox: React.FC = () => {
  const { inbox, setInbox, airdrops, addToast, user, t, markMessageRead, isDataLoaded } = useApp();
  const [filter, setFilter] = useState<'all' | 'tracked' | 'system'>('all');

  // Ensure inbox is an array before proceeding
  const currentInbox = Array.isArray(inbox) ? inbox : [];

  if (!isDataLoaded) return <LoadingSpinner />;

  useEffect(() => {
    // Mark all visible messages as read
    if (currentInbox.length > 0) {
      currentInbox.forEach(m => {
        if (!m.isRead) markMessageRead(m.id);
      });
    }
  }, [currentInbox, markMessageRead]);

  const deleteMessage = (id: string) => {
    setInbox(prev => prev.filter(m => m.id !== id));
    addToast("Message removed.");
  };

  const clearInbox = () => {
    if (confirm("Clear current view?")) {
      setInbox(prev => {
        if (filter === 'all') return [];
        if (filter === 'tracked') return prev.filter(m => !m.relatedAirdropId || !user?.trackedProjectIds?.includes(m.relatedAirdropId));
        return prev.filter(m => m.relatedAirdropId);
      });
      addToast("Inbox cleared.");
    }
  };

  const filteredMessages = useMemo(() => {
    return inbox.filter(m => {
      const isTracked = m.relatedAirdropId && user?.trackedProjectIds?.includes(m.relatedAirdropId);
      if (filter === 'tracked') return isTracked;
      if (filter === 'system') return !isTracked;
      return true;
    });
  }, [inbox, filter, user]);

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-5xl font-black tracking-tighter mb-2">{t('hunterInbox')}</h1>
          <p className="text-slate-500 font-medium tracking-wide">{t('inboxSub')}</p>
        </div>
        {inbox.length > 0 && (
          <button onClick={clearInbox} className="text-xs font-black uppercase tracking-widest text-red-500 hover:underline flex items-center gap-2">
            <Trash2 size={16} /> {t('clearAll')}
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-8 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border dark:border-slate-800 shadow-sm w-fit">
        <TabBtn active={filter === 'all'} label="All" icon={<Layers size={14} />} onClick={() => setFilter('all')} />
        <TabBtn active={filter === 'tracked'} label="Tracked Projects" icon={<Target size={14} />} onClick={() => setFilter('tracked')} />
        <TabBtn active={filter === 'system'} label="System" icon={<Shield size={14} />} onClick={() => setFilter('system')} />
      </div>

      <div className="space-y-6">
        {filteredMessages.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-24 text-center border-4 border-dashed border-slate-100 dark:border-slate-800">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-300">
              <Mail size={48} />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-xl">{t('noTransmissions')}</p>
            <p className="text-slate-300 font-medium mt-2">Current sector filter is quiet.</p>
          </div>
        ) : (
          filteredMessages.map(msg => {
            const related = airdrops.find(a => a.id === msg.relatedAirdropId);
            return (
              <div key={msg.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative group hover:border-primary-500 transition-all">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${msg.type === 'system' ? 'bg-primary-50 text-primary-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {msg.type === 'system' ? <MessageSquare size={24} /> : <Info size={24} />}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">System</p>
                      <h3 className="text-2xl font-black tracking-tighter">{msg.title}</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{msg.createdAt ? new Date(Number(msg.createdAt)).toLocaleString() : 'Just now'}</span>
                        {related && (
                          <span className="text-[10px] font-black uppercase text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                            Related Project: {related.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => deleteMessage(msg.id)} className="p-3 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={20} />
                  </button>
                </div>
                <div className="pl-16">
                  <p className="text-slate-600 dark:text-slate-400 font-medium text-lg leading-relaxed">
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const TabBtn: React.FC<{ active: boolean, label: string, icon: any, onClick: () => void }> = ({ active, label, icon, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${active ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
    {icon} {label}
  </button>
);
