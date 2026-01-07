
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { useAccount, useDisconnect, useSignMessage } from 'wagmi';
import { verifyMessage } from 'viem';
import { Language, User, Airdrop, Claim, CalendarEvent, Comment, TodoItem, UserClaim, Guide, InboxMessage, Toast, AirdropRequest, OnChainActivity, Chain, InfoFiPlatform, Announcement, Investor, Tool } from './types';
import { RANDOM_AVATARS } from './constants';
import { translations, TranslationKey } from './i18n';
import { supabase } from './supabaseClient'; // Import our new client

interface AppContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: TranslationKey) => string;
  user: User | null;
  isVerified: boolean;
  verifyWallet: () => Promise<void>;
  logout: () => void;
  setUsername: (name: string) => Promise<boolean>; // Async now
  updateAvatar: (url: string) => Promise<void>; // Async now

  isDataLoaded: boolean;

  // Data States
  airdrops: Airdrop[];
  setAirdrops: React.Dispatch<React.SetStateAction<Airdrop[]>>;
  activities: OnChainActivity[];
  setActivities: React.Dispatch<React.SetStateAction<OnChainActivity[]>>;
  chains: Chain[];
  setChains: React.Dispatch<React.SetStateAction<Chain[]>>;
  claims: Claim[];
  setClaims: React.Dispatch<React.SetStateAction<Claim[]>>;
  events: CalendarEvent[];
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  comments: Comment[];
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
  userTasks: TodoItem[];
  setUserTasks: React.Dispatch<React.SetStateAction<TodoItem[]>>;
  userClaims: UserClaim[];
  setUserClaims: React.Dispatch<React.SetStateAction<UserClaim[]>>;
  guides: Guide[];
  setGuides: React.Dispatch<React.SetStateAction<Guide[]>>;
  inbox: InboxMessage[];
  setInbox: React.Dispatch<React.SetStateAction<InboxMessage[]>>;
  requests: AirdropRequest[];
  setRequests: React.Dispatch<React.SetStateAction<AirdropRequest[]>>;
  infofiPlatforms: InfoFiPlatform[];
  setInfofiPlatforms: React.Dispatch<React.SetStateAction<InfoFiPlatform[]>>;
  investors: Investor[];
  setInvestors: React.Dispatch<React.SetStateAction<Investor[]>>;
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  tools: Tool[];
  setTools: React.Dispatch<React.SetStateAction<Tool[]>>;

  // UI Utils
  addToast: (msg: string, type?: Toast['type']) => void;
  toasts: Toast[];
  removeToast: (id: string) => void;

  // User Actions
  usersList: User[];
  setUsersList: React.Dispatch<React.SetStateAction<User[]>>;
  toggleTrackProject: (airdropId: string) => Promise<void>;
  gainXP: (amount: number, activityId?: string) => Promise<void>;
  logActivity: (activityId: string) => Promise<void>;
  resetAllXPs: () => Promise<void>;
  banUser: (address: string, until: number | 'perma') => Promise<void>;

  // Helper to trigger refetch
  refreshData: () => Promise<void>;
  manageTodo: (action: 'add' | 'remove' | 'toggle', item: any) => Promise<void>;
  manageUserClaim: (action: 'add' | 'update' | 'remove', item: any) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as any) || 'dark');
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('lang') as any) || 'en');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // States initialized empty, populated via Supabase
  const [usersList, setUsersList] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const [airdrops, setAirdrops] = useState<Airdrop[]>([]);
  const [activities, setActivities] = useState<OnChainActivity[]>([]);
  const [chains, setChains] = useState<Chain[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [userTasks, setUserTasks] = useState<TodoItem[]>([]);
  const [userClaims, setUserClaims] = useState<UserClaim[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [inbox, setInbox] = useState<InboxMessage[]>([]);
  const [requests, setRequests] = useState<AirdropRequest[]>([]);
  const [infofiPlatforms, setInfofiPlatforms] = useState<InfoFiPlatform[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);

  // 1. Theme & Lang (Local Only)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const t = useCallback((key: TranslationKey) => {
    return translations[lang][key] || key;
  }, [lang]);

  const addToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5100);
  };



  // Inside AppProvider
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // 2. Fetch All Data from Supabase
  const refreshData = async () => {
    try {
      const results = await Promise.all([
        supabase.from('airdrops').select('*'),
        supabase.from('activities').select('*'),
        supabase.from('chains').select('*'),
        supabase.from('claims').select('*'),
        supabase.from('comments').select('*'),
        supabase.from('guides').select('*'),
        supabase.from('infofi_platforms').select('*'),
        supabase.from('investors').select('*'),
        supabase.from('announcements').select('*'),
        supabase.from('tools').select('*'),
        supabase.from('users').select('*')
      ]);

      if (results[0].data) setAirdrops(results[0].data as any);
      if (results[1].data) setActivities(results[1].data as any);
      if (results[2].data) setChains(results[2].data as any);
      if (results[3].data) setClaims(results[3].data as any);
      if (results[4].data) setComments(results[4].data as any);
      if (results[5].data) setGuides(results[5].data as any);
      if (results[6].data) setInfofiPlatforms(results[6].data as any);
      if (results[7].data) setInvestors(results[7].data as any);
      if (results[8].data) setAnnouncements(results[8].data as any);
      if (results[9].data) setTools(results[9].data as any);
      if (results[10].data) setUsersList(results[10].data as any);

      setIsDataLoaded(true);

    } catch (e) {
      console.error("Data Sync Error", e);
      addToast("Failed to sync with Supabase Protocol", "error");
      setIsDataLoaded(true); // Stop spinner even on error
    }
  };

  // Initial Load
  useEffect(() => {
    refreshData();
  }, []);

  // 3. User Sync (Upsert on Connect)
  const syncUser = async (addr: string) => {
    const { data: existing, error } = await supabase.from('users').select('*').eq('address', addr).single();

    if (existing) {
      setUser(existing as any);
      fetchUserData(existing.id);
      return;
    }

    // Create new user if not exists
    if (!existing) {
      const newUser = {
        address: addr,
        avatar: RANDOM_AVATARS[Math.floor(Math.random() * RANDOM_AVATARS.length)],
        username: `Hunter_${addr.substring(2, 6)}`,
        role: 'user', // Default role
        "memberStatus": "Hunter", // Legacy field compat
        registeredAt: Date.now()
      };
      const { data: created, error: insertErr } = await supabase.from('users').insert(newUser).select().single();
      if (created) {
        setUser(created as any);
        fetchUserData(created.id);
      }
      else console.error("User Creation Failed", insertErr);
    }
  };

  const fetchUserData = async (uid: string) => {
    const [tData, cData] = await Promise.all([
      supabase.from('todos').select('*').eq('userId', uid),
      supabase.from('user_claims').select('*').eq('userId', uid)
    ]);
    if (tData.data) setUserTasks(tData.data as any);
    if (cData.data) setUserClaims(cData.data as any);
  };

  // CRUD Wrappers
  const manageTodo = async (action: 'add' | 'remove' | 'toggle', item: any) => {
    if (!user) return;
    if (action === 'add') {
      const { data, error } = await supabase.from('todos').insert({ ...item, userId: user.id }).select().single();
      if (data) setUserTasks(prev => [...prev, data as any]);
    } else if (action === 'remove') {
      await supabase.from('todos').delete().eq('id', item.id);
      setUserTasks(prev => prev.filter(t => t.id !== item.id));
    } else if (action === 'toggle') {
      await supabase.from('todos').update({ completed: !item.completed }).eq('id', item.id);
      setUserTasks(prev => prev.map(t => t.id === item.id ? { ...t, completed: !t.completed } : t));
    }
  };

  const manageUserClaim = async (action: 'add' | 'update' | 'remove', item: any) => {
    if (!user) return;
    if (action === 'add') {
      const { data } = await supabase.from('user_claims').insert({ ...item, userId: user.id }).select().single();
      if (data) setUserClaims(prev => [...prev, data as any]);
    } else if (action === 'update') {
      await supabase.from('user_claims').update(item).eq('id', item.id);
      setUserClaims(prev => prev.map(c => c.id === item.id ? { ...c, ...item } : c));
    } else if (action === 'remove') {
      await supabase.from('user_claims').delete().eq('id', item.id);
      setUserClaims(prev => prev.filter(c => c.id !== item.id));
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      syncUser(address.toLowerCase());
      // Check session
      const sessionKey = `verified_session_${address.toLowerCase()}`;
      setIsVerified(sessionStorage.getItem(sessionKey) === 'true');
    } else {
      setUser(null);
      setUserTasks([]);
      setUserClaims([]);
      setIsVerified(false);
    }
  }, [isConnected, address]);


  // 4. Actions (Updated to Async / DB)

  const verifyWallet = async () => {
    if (!address) return;
    try {
      const nonce = Math.random().toString(36).substring(2, 15);
      const message = `Sign to verify ownership.\nNonce: ${nonce}`;
      const signature = await signMessageAsync({ account: address as `0x${string}`, message });
      const isValid = await verifyMessage({ address: address as `0x${string}`, message, signature });

      if (isValid) {
        sessionStorage.setItem(`verified_session_${address.toLowerCase()}`, 'true');
        setIsVerified(true);
        addToast("Wallet verified.");
      }
    } catch (err: any) {
      addToast("Verification failed.", "error");
    }
  };

  const setUsername = async (name: string) => {
    if (!user) return false;
    const { error } = await supabase.from('users').update({ username: name, "lastUsernameChange": Date.now() }).eq('id', user.id);
    if (error) {
      addToast("Username taken or limit reached.", "error");
      return false;
    }
    setUser({ ...user, username: name });
    addToast("Username updated.");
    return true;
  };

  const updateAvatar = async (url: string) => {
    if (!user) return;
    await supabase.from('users').update({ avatar: url }).eq('id', user.id);
    setUser({ ...user, avatar: url });
  };

  const banUser = async (addr: string, until: number | 'perma') => {
    // Admin Only Check handled by RLS, but optimistic check:
    await supabase.from('users').update({
      "isPermaBanned": until === 'perma',
      "bannedUntil": until === 'perma' ? null : until
    }).eq('address', addr);
    addToast("User penalized.");
    refreshData(); // Refresh list
  };

  const toggleTrackProject = async (aid: string) => {
    // Implementation simplified for brevity - in real app, update array in DB
    if (!user) return;
    let current = user.trackedProjectIds || [];
    const updated = current.includes(aid) ? current.filter(x => x !== aid) : [...current, aid];
    await supabase.from('users').update({ "trackedProjectIds": updated }).eq('id', user.id);
    setUser({ ...user, trackedProjectIds: updated });
  };

  const gainXP = async (amount: number, activityId?: string) => {
    if (!user) return;
    const newXP = user.xp + amount;
    // ... logic for level up ...
    // For now, simple update
    await supabase.from('users').update({ xp: newXP }).eq('id', user.id);
    setUser({ ...user, xp: newXP });
  };

  const logActivity = async (activityId: string) => {
    if (!user) return;
    const now = Date.now();
    const updated = { ...user.lastActivities, [activityId]: now };
    await supabase.from('users').update({ lastActivities: updated }).eq('id', user.id);
    setUser({ ...user, lastActivities: updated });
  };

  const resetAllXPs = async () => {
    await supabase.from('users').update({ xp: 0, level: 1 });
    refreshData();
  };


  return (
    <AppContext.Provider value={{
      theme, toggleTheme: () => setTheme(t => t === 'light' ? 'dark' : 'light'),
      lang, setLang, t, isDataLoaded,
      user, isVerified, verifyWallet, logout: () => { disconnect(); },
      setUsername, updateAvatar, banUser, toggleTrackProject, gainXP, logActivity, resetAllXPs, refreshData, manageTodo, manageUserClaim,

      // Data Props (Read Only mostly, write via specific actions or direct supabase calls in AdminPanel)
      // We pass the "setters" to maintain compatibility with AdminPanel, 
      // but AdminPanel really should use direct DB calls. 
      // For now, these setters only update LOCAL state. 
      // AdminPanel refactor is needed to make "Save" buttons call Supabase.
      airdrops, setAirdrops, activities, setActivities, chains, setChains, claims, setClaims,
      events, setEvents, comments, setComments, userTasks, setUserTasks, userClaims, setUserClaims,
      guides, setGuides, inbox, setInbox, requests, setRequests, infofiPlatforms, setInfofiPlatforms,
      investors, setInvestors, announcements, setAnnouncements, tools, setTools,
      addToast, toasts, removeToast: (id) => setToasts(p => p.filter(t => t.id !== id)),
      usersList, setUsersList
    }}>
      {children}
    </AppContext.Provider>
  );
};