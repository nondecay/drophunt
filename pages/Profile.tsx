
import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { User as UserIcon, Shield, Edit3, Check, X, Hash, CheckCircle, Wallet } from 'lucide-react';
import { RANDOM_AVATARS } from '../constants';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Profile: React.FC = () => {
   const { user, setUsername, updateAvatar, t, isDataLoaded } = useApp();

   if (!isDataLoaded) return <LoadingSpinner />;

   const [isEditing, setIsEditing] = useState(false);
   const [newUsername, setNewUsername] = useState(user?.username || '');
   const [showAvatarModal, setShowAvatarModal] = useState(false);

   const handleSaveUsername = () => {
      if (newUsername.trim()) {
         const success = setUsername(newUsername.trim());
         if (success) setIsEditing(false);
      }
   };

   return (
      <div className="max-w-5xl mx-auto pb-20 px-4">
         <div className="mb-12">
            <h1 className="text-4xl font-black tracking-tighter mb-2">{t('profile')}</h1>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5 space-y-8">
               <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center text-center">
                  <div className="relative group mb-8">
                     <img src={user?.avatar} className="w-40 h-40 rounded-[2.5rem] object-cover ring-8 ring-primary-50 dark:ring-slate-800 shadow-2xl transition-transform" />
                     <button onClick={() => setShowAvatarModal(true)} className="absolute bottom-[-5px] right-[-5px] p-3.5 bg-primary-600 text-white rounded-xl shadow-xl border-4 border-white dark:border-slate-900"><Edit3 size={20} /></button>
                  </div>

                  <div className="w-full">
                     {isEditing ? (
                        <div className="flex flex-col gap-3">
                           <input type="text" className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-lg text-center outline-none border-2 border-primary-500" value={newUsername} onChange={e => setNewUsername(e.target.value)} />
                           <div className="flex gap-2">
                              <button onClick={handleSaveUsername} className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl font-black"><Check className="mx-auto" size={20} /></button>
                              <button onClick={() => setIsEditing(false)} className="flex-1 py-2.5 bg-slate-200 text-slate-500 rounded-xl font-black"><X className="mx-auto" size={20} /></button>
                           </div>
                        </div>
                     ) : (
                        <div className="flex flex-col items-center">
                           <h2 className="text-3xl font-black tracking-tighter mb-1">{user?.username || 'Hunter Anonymous'}</h2>
                           <button onClick={() => setIsEditing(true)} className="text-[9px] font-black text-primary-600 uppercase tracking-widest mb-6 flex items-center gap-1.5 hover:underline"><Edit3 size={10} /> {t('changeUsername')}</button>
                        </div>
                     )}
                  </div>

                  <div className="w-full flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl mt-4">
                     <div className="text-left">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('protocolRank')}</p>
                        <p className="text-lg font-black text-primary-600">{user?.memberStatus}</p>
                     </div>
                     {user?.isAdmin ? <Shield className="text-primary-600" size={28} /> : <UserIcon className="text-slate-400" size={28} />}
                  </div>

                  <div className="w-full mt-6 p-4 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1"><Wallet size={10} /> {t('walletAddress')}</p>
                     <p className="text-[10px] font-mono text-slate-500 truncate">{user?.address}</p>
                  </div>
               </div>
            </div>

            <div className="lg:col-span-7 space-y-8">
               <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-2xl font-black tracking-tighter mb-8 flex items-center gap-3"><Hash className="text-primary-600" /> {t('accountStats')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('onChainJoined')}</p>
                        <p className="text-lg font-black">{new Date(user?.registeredAt || Date.now()).toLocaleDateString()}</p>
                     </div>
                     <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('hunterUid')}</p>
                        <p className="text-lg font-black text-primary-600">#{user?.uid}</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {showAvatarModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
               <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl relative">
                  <button onClick={() => setShowAvatarModal(false)} className="absolute top-6 right-6 p-2 text-slate-400"><X size={24} /></button>
                  <h3 className="text-2xl font-black mb-8 tracking-tighter">Choose Avatar</h3>
                  <div className="grid grid-cols-4 gap-4">
                     {RANDOM_AVATARS.map((url, i) => (
                        <button key={i} onClick={() => { updateAvatar(url); setShowAvatarModal(false); }} className={`relative rounded-2xl overflow-hidden aspect-square border-4 transition-all hover:scale-105 active:scale-95 ${user?.avatar === url ? 'border-primary-600' : 'border-transparent'}`}><img src={url} className="w-full h-full object-cover" /></button>
                     ))}
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};
