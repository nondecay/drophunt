import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { supabase } from '../supabaseClient';
import { ChevronLeft, ChevronRight, Plus, X, ExternalLink } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

const ensureHttp = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `https://${url}`;
};

export const Calendar: React.FC = () => {
  const { events, user, setEvents, addToast, t, isDataLoaded } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', description: '', url: '' });
  const [currentDate, setCurrentDate] = useState(new Date());

  if (!isDataLoaded) return <LoadingSpinner />;

  // Safety check to prevent blank page crash
  if (!events) return <div className="p-10 text-center">Loading Calendar...</div>;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const prefixDays = Array.from({ length: (firstDay + 6) % 7 }, (_, i) => null);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1));

  const handleDeleteEvent = async (id: string) => {
    if (!confirm(t('deleteConfirmation') || 'Delete event?')) return;

    const { error } = await supabase.rpc('delete_admin_event', { p_event_id: id });

    if (error) {
      console.error("Delete Error:", error);
      addToast("Failed: " + error.message, "error");
    } else {
      setEvents(prev => prev.filter(e => e.id !== id));
      addToast("Deleted.");
    }
  };

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.date) return;
    const eventObj = {
      title: newEvent.title,
      date: newEvent.date,
      description: newEvent.description || 'Protocol Event',
      url: newEvent.url
    };

    // RPC Call to bypass RLS
    const { error } = await supabase.rpc('create_admin_event', {
      p_title: eventObj.title,
      p_date: eventObj.date,
      p_description: eventObj.description,
      p_url: eventObj.url
    });

    if (error) {
      console.error("RPC Error:", error);
      addToast("Failed to index: " + error.message, "error");
    } else {
      setEvents(prev => [...prev, eventObj]);
      setShowAdd(false);
      setNewEvent({ title: '', date: '', description: '', url: '' });
      addToast("Event indexed.");
    }
  };

  /* DEBUG: REMOVE BEFORE PRODUCTION */
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* DEBUG PANEL */}
      {/* DEBUG PANEL REMOVED */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">{t('calendarMainTitle')}</h1>
          <p className="text-slate-500 font-medium text-xs">{t('calendarMainSub')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"><ChevronLeft size={18} /></button>
            <button onClick={handleNextMonth} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"><ChevronRight size={18} /></button>
          </div>
          {(user?.role === 'admin' || user?.memberStatus === 'Admin') && <button onClick={() => setShowAdd(true)} className="p-3 bg-primary-600 text-white rounded-xl shadow-md"><Plus size={18} /></button>}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-4 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <h2 className="text-xl font-black mb-6 uppercase text-center">{monthNames[month]} {year}</h2>

        {/* Mobile Scroll Wrapper */}
        {/* Mobile Calendar Grid */}
        {/* Mobile Calendar Grid */}
        <div className="pb-2 overflow-x-auto">
          <div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 min-w-[300px]">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="bg-slate-50 dark:bg-slate-950 p-2 sm:p-3 text-center font-black text-[8px] sm:text-[9px] uppercase text-slate-400 tracking-widest truncate">{day}</div>
            ))}
            {prefixDays.map((_, i) => <div key={`p-${i}`} className="bg-white dark:bg-slate-900/50 min-h-[60px] sm:min-h-[100px]" />)}
            {days.map(day => {
              const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
              const dayEvents = events.filter(e => e.date === dateStr);
              const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
              return (
                <div key={day} className="min-h-[70px] sm:min-h-[100px] p-1 sm:p-1.5 bg-white dark:bg-slate-900 flex flex-col gap-1 border-t border-slate-50 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <span className={`text-[9px] sm:text-[10px] font-black w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-lg ${isToday ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-400'}`}>{day}</span>
                  <div className="flex flex-col gap-1 overflow-y-auto max-h-[45px] sm:max-h-[60px] custom-scrollbar">
                    {dayEvents.map((ev, index) => {
                      // Distinct colors for 1st, 2nd, and 3rd+ events
                      const colors = [
                        "bg-primary-50 dark:bg-primary-900/40 text-primary-600 border-primary-100 dark:border-primary-800/50",
                        "bg-violet-50 dark:bg-violet-900/40 text-violet-600 border-violet-100 dark:border-violet-800/50",
                        "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 border-emerald-100 dark:border-emerald-800/50"
                      ];
                      const colorClass = colors[index] || colors[2];

                      return (
                        <div key={ev.id} className={`px-1 py-0.5 sm:px-1.5 sm:py-1 rounded-md text-[7px] sm:text-[8px] font-black border flex justify-between items-center group ${colorClass}`}>
                          <div className="truncate flex-1 leading-tight">
                            {ev.url ? <a href={ensureHttp(ev.url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline"><span>{ev.title}</span><ExternalLink size={6} /></a> : ev.title}
                          </div>
                          {(user?.role === 'admin' || user?.memberStatus === 'Admin') && (
                            <button onClick={() => handleDeleteEvent(ev.id)} className="ml-1 text-red-400 hover:text-red-600 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <X size={8} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative">
            <button onClick={() => setShowAdd(false)} className="absolute top-8 right-8 text-slate-400"><X size={20} /></button>
            <h3 className="text-2xl font-black mb-6 uppercase tracking-tighter">{t('newEventTitle')}</h3>
            <div className="space-y-4">
              <FldInpt label="Title" val={newEvent.title} onChange={v => setNewEvent({ ...newEvent, title: v })} />
              <div className="grid grid-cols-2 gap-3">
                <FldInpt label="Date" type="date" val={newEvent.date} onChange={v => setNewEvent({ ...newEvent, date: v })} />
                <FldInpt label="Link" val={newEvent.url} onChange={v => setNewEvent({ ...newEvent, url: v })} />
              </div>
              <FldInpt label="Details" val={newEvent.description} onChange={v => setNewEvent({ ...newEvent, description: v })} />
            </div>
            <button onClick={handleAddEvent} className="w-full mt-8 py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg">Index Event</button>
          </div>
        </div>
      )}
    </div>
  );
};
const FldInpt: React.FC<{ label: string, val: string, type?: string, onChange: (v: string) => void }> = ({ label, val, type = "text", onChange }) => (<div><label className="text-[9px] font-black uppercase text-slate-400 block mb-1">{label}</label><input type={type} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold outline-none text-xs" value={val} onChange={e => onChange(e.target.value)} /></div>);
