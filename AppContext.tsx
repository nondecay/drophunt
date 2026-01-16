
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { useAccount, useDisconnect, useWalletClient } from 'wagmi';
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
  user: User | null;
  verifyWallet: () => Promise<void>;
  // username: string; // REMOVED: relied on user.username
  updateAvatar: (url: string) => Promise<void>;
  showUsernameModal: boolean;
  setShowUsernameModal: React.Dispatch<React.SetStateAction<boolean>>;
  setUsername: (username: string) => Promise<boolean>;

  isDataLoaded: boolean;
  isAuthLoading: boolean;

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
  unreadCount?: number;
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
  markMessageRead: (msgId: string) => void;
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
  const { data: walletClient } = useWalletClient();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as any) || 'dark');
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('lang') as any) || 'en');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // States initialized empty, populated via Supabase
  const [usersList, setUsersList] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  // Remove isVerified - we rely on user presence or modal
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [isVerified, setIsVerified] = useState(false); // Kept for backwards compat if needed, but redundant

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
  const [isAuthLoading, setIsAuthLoading] = useState(true);

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
        supabase.from('users').select('*'),
        supabase.from('events').select('*')
        // Messages are now fetched per-user in fetchUserData to ensure privacy
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
      if (results[11].data) setEvents(results[11].data as any);

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
    // We only check existence here, NOT login. Login requires signature.
    const { data: existing } = await supabase.from('users').select('*').eq('address', addr).single();
    if (existing) {
      // User exists, but we wait for valid session to login
    }
  };

  const registerUsername = async (username: string) => {
    if (!address) return;

    const newUser = {
      address: address,
      avatar: RANDOM_AVATARS[Math.floor(Math.random() * RANDOM_AVATARS.length)],
      username: username,
      role: 'user',
      "memberStatus": "Hunter",
      registeredAt: Date.now()
    };

    const { data: created, error: insertErr } = await supabase.from('users').insert(newUser).select().single();

    if (created) {
      setUser(created as any);
      fetchUserData(created.id);
      setShowUsernameModal(false);
      // Auto-verify on registration since they just signed to verify (context dependant, but usually safe if flow assumes verify first)
      sessionStorage.setItem(`verified_session_${address.toLowerCase()}`, 'true');
      setIsVerified(true);
      addToast("Welcome, Hunter!", "success");
    } else {
      console.error("User Creation Failed", insertErr);
      // Check for duplicate username
      if (insertErr?.code === '23505') {
        throw new Error("Username already taken.");
      }
      throw new Error("Registration failed.");
    }
  };



  const fetchUserData = async (uid: string) => {
    const [tData, cData, mData] = await Promise.all([
      supabase.from('todos').select('*').eq('user_id', uid),
      supabase.from('user_claims').select('*').eq('user_id', uid),
      supabase.from('inbox_messages').select('*').eq('userId', uid).order('timestamp', { ascending: false })
    ]);
    if (tData.data) {
      setUserTasks(tData.data as any);
      checkRecurringTasks(tData.data, uid);
    }
    if (cData.data) {
      console.log("Fetched Claims for UID:", uid, "Count:", cData.data.length); // DEBUG
      // Normalize data to handle potential casing mismatches (DB might return lowercase, frontend expects camelCase)
      const normalizedClaims = cData.data.map((c: any) => ({
        ...c,
        projectName: c.projectName || c.projectname,
        claimedToken: c.claimedToken || c.claimedtoken,
        tokenCount: c.tokenCount || c.tokencount,
        claimedDate: c.claimedDate || c.claimeddate,
        earning: c.earning // usually simple enough
      }));
      setUserClaims(normalizedClaims as any);
    } else {
      console.error("Fetched Claims Error or Empty:", cData.error);
    }
    if (mData.data) {
      const readIds = JSON.parse(localStorage.getItem('read_messages') || '[]');
      const processedInbox = (mData.data as any[]).map(m => ({
        ...m,
        isRead: readIds.includes(m.id) || m.isRead
      }));
      setInbox(processedInbox);
    }
  };

  // Helper to persist read messages
  const markMessageRead = (msgId: string) => {
    const currentRead = JSON.parse(localStorage.getItem('read_messages') || '[]');
    if (!currentRead.includes(msgId)) {
      const updated = [...currentRead, msgId];
      localStorage.setItem('read_messages', JSON.stringify(updated));
      setInbox(prev => prev.map(m => m.id === msgId ? { ...m, isRead: true } : m));
    }
  };

  // CRUD Wrappers
  const checkRecurringTasks = async (tasks: any[], userId: string) => {
    const now = Date.now();
    const updates: any[] = [];

    tasks.forEach(t => {
      if (t.completed && t.reminder && t.reminder !== 'none') {
        const completedAt = t.createdAt; // Assuming createdAt was updated on completion or we use a separate field. 
        // Logic: if completed, we check if enough time passed to reset.
        // Simplified: We rely on 'createdAt' as the last interaction or add a new 'lastCompletedAt' field.
        // For this fix, let's assume 'createdAt' tracks the cycle.

        let reset = false;
        if (t.reminder === 'daily' && (now - completedAt) > 86400000) reset = true;
        if (t.reminder === 'weekly' && (now - completedAt) > 604800000) reset = true;
        if (t.reminder === 'monthly' && (now - completedAt) > 2592000000) reset = true;

        if (reset) {
          updates.push({ ...t, completed: false, createdAt: now });
        }
      }
    });

    if (updates.length > 0) {
      for (const up of updates) {
        await supabase.from('todos').update({ completed: false, createdAt: up.createdAt }).eq('id', up.id);
      }
      // Refresh local state
      const { data } = await supabase.from('todos').select('*').eq('user_id', userId);
      if (data) setUserTasks(data as any);
    }
  };

  // CRUD Wrappers
  const manageTodo = async (action: 'add' | 'remove' | 'toggle', payload: any) => {
    if (!user) return;

    if (action === 'add') {
      const newTodo = { ...payload, "userId": user.id };
      const { data, error } = await supabase.from('todos').insert(newTodo).select().single();
      if (!error && data) {
        setUserTasks(prev => [data as any, ...prev]);
      } else {
        console.error("Add Task Error", error);
        addToast("Failed to add task: " + (error.message || "Unknown error"), "error");
      }
    } else if (action === 'remove') {
      // payload is expected to be ID string
      await supabase.from('todos').delete().eq('id', payload);
      setUserTasks(prev => prev.filter(t => t.id !== payload));
    } else if (action === 'toggle') {
      // payload is expected to be full task object or ID? 
      // The calling code passes the object usually. Let's handle both or standardized.
      // Current MyAirdrops passes the OBJECT.
      const task = userTasks.find(t => t.id === payload.id);
      if (task) {
        // Update DB
        // If completing, we might update createdAt to track the cycle start for recurring?
        // Let's just update 'completed'.
        await supabase.from('todos').update({ completed: !task.completed }).eq('id', task.id);
        setUserTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
      }
    }
  };

  const manageUserClaim = async (action: 'add' | 'remove', payload: any) => {
    if (!user) return;

    if (action === 'add') {
      const newClaim = { ...payload, "userId": user.id };
      const { data, error } = await supabase.from('user_claims').insert(newClaim).select().single();
      if (!error && data) {
        setUserClaims(prev => [data as any, ...prev]);
      } else {
        console.error("Add Claim Error", error);
        addToast(`Add Claim Failed: ${error?.message || 'Unknown error'}`, "error");
      }
    } else if (action === 'remove') {
      await supabase.from('user_claims').delete().eq('id', payload);
      setUserClaims(prev => prev.filter(c => c.id !== payload));
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      // If we're not connected, we aren't "loading auth" in the sense of verifying a user.
      // But if we ARE connected, we are verifying.
      if (!isConnected) {
        setIsAuthLoading(false);
        // Clear user state
        setUser(null);
        setUserTasks([]);
        setUserClaims([]);
        setInbox([]);
        setIsVerified(false);
        setShowUsernameModal(false);
        return;
      }

      setIsAuthLoading(true);

      if (isConnected && address) {
        try {
          const sessionKey = `verified_session_${address.toLowerCase()}`;
          const verified = sessionStorage.getItem(sessionKey) === 'true';

          if (verified) {
            // Restore Session
            const { data: existing } = await supabase.from('users').select('*').eq('address', address.toLowerCase()).single();
            if (existing) {
              setUser(existing as any);
              fetchUserData(existing.id);
              setIsVerified(true);
            } else {
              // Verified but no user? Anomalous, ask to verify/register again
              setIsVerified(false);
              sessionStorage.removeItem(sessionKey);
              // If user is verified but not in DB, something is wrong. Re-verify.
              verifyWallet();
            }
          } else {
            // Not verified - User must sign.
            // Do NOT set user.
            setIsVerified(false);
            setUser(null);
            // Prompt verification immediately
            verifyWallet();
          }
        } catch (e) {
          console.error("Auth check failed", e);
        } finally {
          setIsAuthLoading(false);
        }
      } else {
        setIsAuthLoading(false);
      }
    };
    checkSession();
  }, [isConnected, address]);


  // 4. Actions (Updated to Async / DB)

  const verifyWallet = async () => {
    if (!address || !walletClient) return;
    try {
      const nonce = Math.random().toString(36).substring(2, 15);
      const chainId = 1;

      // EIP-4361 Message Format
      const message = `${window.location.host} wants you to sign in with your Ethereum account:
${address}

Welcome to drophunt.io! Please sign this message to verify your identity.

URI: ${window.location.origin}
Version: 1
Chain ID: ${chainId}
Nonce: ${nonce}
Issued At: ${new Date().toISOString()}`;

      const signature = await walletClient.signMessage({ message });

      // Call Supabase Edge Function to Verify & Log In
      const { data: session, error: funcError } = await supabase.functions.invoke('siwe-login', {
        body: { message, signature, address }
      });

      if (funcError || !session) {
        throw new Error(funcError?.message || "Login failed");
      }

      // Set Supabase Session (True Auth)
      const { error: authError } = await supabase.auth.setSession(session);
      if (authError) throw authError;

      // Persist Verified State (Vital for Refresh)
      sessionStorage.setItem(`verified_session_${address.toLowerCase()}`, 'true');

      setIsVerified(true);
      addToast(t('walletVerified') || "Wallet verified securely.", "success");

      // Check User Profile in DB
      const { data: existing } = await supabase.from('users').select('*').eq('address', address.toLowerCase()).single();

      if (!existing) {
        // Auto-Register via DB if not exists (Note: Edge function might have created the Auth User, but maybe not the Public Profile if triggers aren't set up perfectly. 
        // We tried to create user in Edge Function, so Auth User exists. 
        // Let's ensure Public Profile exists.)
        const newUser = {
          id: session.user.id, // Important: Match Auth ID
          address: address.toLowerCase(),
          avatar: RANDOM_AVATARS[Math.floor(Math.random() * RANDOM_AVATARS.length)],
          username: `Hunter_${address.substring(2, 6)}`,
          role: 'user',
          "memberStatus": "Hunter",
          registeredAt: Date.now()
        };

        // Try insert public profile
        const { data: created, error } = await supabase.from('users').insert(newUser).select().single();

        if (created) {
          setUser(created as any);
          fetchUserData(created.id);
          setShowUsernameModal(true);
        } else {
          // If insert failed, maybe it already exists (race condition with edge function logic?)
          // Fetch again
          const { data: retry } = await supabase.from('users').select('*').eq('address', address.toLowerCase()).single();
          if (retry) {
            setUser(retry as any);
            fetchUserData(retry.id);
          }
        }
      } else {
        setUser(existing as any);
        fetchUserData(existing.id);
      }

    } catch (err: any) {
      console.error("SIWE Error:", err);
      // Safe guard: Do NOT disconnect here, as it triggers the useEffect loop again if verification fails.
      // Just showing the error toast is sufficient. User can retry manually.
      addToast("Verification failed: " + (err.message || "Unknown"), "error");

      // If we really want to reset state:
      setIsVerified(false);
      setUser(null);
    }
  };


  const setUsername = async (name: string) => {
    if (!user) return false;

    // Check 24-hour Cooldown
    if (user.lastUsernameChange) {
      const msSinceLastChange = Date.now() - user.lastUsernameChange;
      const hoursSinceLastChange = msSinceLastChange / (1000 * 60 * 60);
      if (hoursSinceLastChange < 24) {
        addToast("You can change your username every 24 hours.", "error");
        return false;
      }
    }

    const { error } = await supabase.from('users').update({ username: name, "lastUsernameChange": Date.now() }).eq('id', user.id);
    if (error) {
      addToast("Username taken or limit reached.", "error");
      return false;
    }
    // Update local state with new name and new timestamp
    setUser({ ...user, username: name, lastUsernameChange: Date.now() });
    addToast("Username changed.", "success");
    setShowUsernameModal(false);
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
      lang, setLang, t, isDataLoaded, isAuthLoading,
      user, isVerified, verifyWallet, logout: () => { disconnect(); },
      setUsername, updateAvatar, banUser, toggleTrackProject, gainXP, logActivity, resetAllXPs, refreshData, manageTodo, manageUserClaim, showUsernameModal, markMessageRead,

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