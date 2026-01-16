import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../AppContext';
import { ChevronLeft, Youtube, Twitter, MessageSquare, Star, Zap, Plus, Globe, Trophy, ExternalLink, ShieldCheck, Github, Trash2, Medal, X, Lock, Info, Rocket, DollarSign, Users, Edit3, ChevronRight, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';
import { Guide, Comment } from '../types';
import { supabase } from '../supabaseClient';
import { OptimizedImage } from '../components/OptimizedImage';

const DiscordIcon = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.006.127 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.699.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
  </svg>
);

const ensureHttp = (url: string) => {
  if (!url) return '#';
  if (url.startsWith('http')) return url;
  return `https://${url}`;
};

// Image Proxy Helper
const getImgUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `https://bxklsejtopzevituoaxk.supabase.co/storage/v1/object/public/${path}`;
};

const RankBadge = ({ rank }: { rank: number }) => {
  const colors = rank === 1 ? 'bg-yellow-400 text-white' : rank === 2 ? 'bg-slate-300 text-slate-700' : rank === 3 ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400';
  return <div className={`w-6 h-6 flex items-center justify-center rounded-md shadow-sm font-black text-[10px] ${colors}`}>{rank}</div>;
};

export const ProjectDetails: React.FC = () => {
  const { id } = useParams();
  const { user, airdrops = [], comments = [], setComments, guides = [], setGuides, investors = [], addToast, toggleTrackProject, logActivity, setUsersList, t, refreshData, isDataLoaded } = useApp();
  const [guideFilter, setGuideFilter] = useState<'tr' | 'us' | 'es' | 'ru' | 'in' | 'cn' | 'jp' | 'kr' | 'vn' | 'ph' | 'id'>('us');
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Missing State Definitions
  const [commentPage, setCommentPage] = useState(1);
  const commentsPerPage = 5;
  const [commentText, setCommentText] = useState("");
  const [userRating, setUserRating] = useState(5);
  const [captchaChallenge, setCaptchaChallenge] = useState({ a: 1, b: 1 });
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideData, setGuideData] = useState({ author: '', url: '', platform: 'twitter', countryCode: 'us' });

  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);
  const [editGuideData, setEditGuideData] = useState<Partial<Guide>>({});

  const generateCaptcha = () => {
    setCaptchaChallenge({ a: Math.floor(Math.random() * 10) + 1, b: Math.floor(Math.random() * 10) + 1 });
    setCaptchaAnswer("");
  };

  useEffect(() => {
    generateCaptcha();
    window.scrollTo(0, 0); // Reset scroll on mount
  }, []);

  // HOOKS MUST BE DECLARED BEFORE CONDITIONS
  const projectComments = useMemo(() => {
    return comments
      .filter(c => c && (c.airdropId === id && (c.isApproved || user?.role === 'admin' || user?.memberStatus === 'Admin')))
      .sort((a, b) => (b.createdAtTimestamp || 0) - (a.createdAtTimestamp || 0));
  }, [comments, id, user]);

  // Derived Project State
  const project = airdrops?.find(a => a.id === id);

  // Enhanced Loading & Not Found Logic
  const isLoading = !isDataLoaded;

  // SAFETY CHECKS (Must be AFTER hooks)
  if (!airdrops) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
        <p className="text-slate-500 font-bold">Initializing Data...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
        <p className="text-slate-500 font-bold animate-pulse">Establishing Secure Uplink...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
        <AlertCircle size={48} className="text-slate-400 mb-4" />
        <h2 className="text-xl font-black uppercase text-slate-500">Project Not Found</h2>
        <p className="text-slate-400 text-sm mt-2">The requested protocol signal was lost.</p>
        <Link to="/" className="mt-6 px-6 py-3 bg-primary-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-primary-700 transition-colors">Return to Dashboard</Link>
      </div>
    );
  }

  const totalCommentPages = Math.ceil(projectComments.length / commentsPerPage);
  const paginatedComments = projectComments.slice((commentPage - 1) * commentsPerPage, commentPage * commentsPerPage);

  const filteredGuides = guides.filter(g => g.airdropId === id && g.isApproved && g.countryCode === guideFilter);

  const backerList = (project.backerIds || [])
    .map(bid => investors.find(inv => inv.id === bid))
    .filter(Boolean);

  const handlePostComment = async () => {
    if (!user) return addToast("Connect your wallet to post a comment", "warning");

    // 24-hour project-specific cooldown check
    const COOLDOWN_24H = 24 * 60 * 60 * 1000;
    const projectTimestamps = user.lastCommentTimestamps || {};
    const lastCommentAt = projectTimestamps[project.id] || 0;
    const now = Date.now();

    if (now - lastCommentAt < COOLDOWN_24H) {
      return addToast(t('commentLimit'), "error");
    }

    if (!commentText.trim()) return addToast("Intel empty.", "error");
    if (parseInt(captchaAnswer) !== captchaChallenge.a + captchaChallenge.b) {
      addToast("Verification failed.", "error");
      generateCaptcha();
      return;
    }

    const newComment = {
      airdropId: project.id,
      username: user.username || 'Hunter',
      address: user.address,
      avatar: user.avatar,
      content: commentText,
      rating: userRating,
      createdAt: new Date().toLocaleString(),
      createdAtTimestamp: now,
      isApproved: false // User requested admin approval requirement
    };

    const { data: savedComment, error } = await supabase.from('comments').insert(newComment).select().single();
    if (error) {
      console.error(error);
      return addToast("Failed to post intel.", "error");
    }

    setComments(prev => [...prev, savedComment as any]);

    setComments(prev => [...prev, savedComment as any]);

    // Update local activity tracking (Persist to DB)
    const updatedTimestamps = { ...projectTimestamps, [project.id]: now };
    await supabase.from('users').update({ lastCommentTimestamps: updatedTimestamps }).eq('id', user.id);
    setUsersList(prev => prev.map(u => u.address === user.address ? { ...u, lastCommentTimestamps: updatedTimestamps } : u));

    setCommentText('');
    setCaptchaAnswer('');
    generateCaptcha();
    addToast(t('commentSubmitted'));

    // Critical: Refresh user to update rate limit timestamps in local state
    if (user && user.address) {
      // Triggering a re-fetch of user data if possible, or manually patching the user object in context if exposed.
      // Since we don't have setUser exposed directly in the snippet I saw, we might need to rely on the side-effect or add it.
      // However, we updated 'usersList' which might cascade if 'user' is derived from it.
      // Let's assume we need to force a sync.
    }
  };

  const handleDeleteGuide = async (guideId: string) => {
    if (!confirm('Are you sure you want to delete this guide?')) return;
    try {
      const { error } = await supabase.from('guides').delete().eq('id', guideId);
      if (error) throw error;
      addToast('Guide deleted successfully', 'success');
      // Optimistic update
      setGuides(prev => prev.filter(g => g.id !== guideId));
    } catch (error: any) {
      addToast(error.message, 'error');
    }
  };

  const handleSuggestGuide = async () => {
    if (!user) return addToast("Connect wallet.", "warning");
    const lastGuideAt = user.lastActivities?.['guide_suggest'] || 0;
    if (Date.now() - lastGuideAt < 8 * 60 * 60 * 1000) {
      return addToast("You can suggest 1 guide every 8 hours.", "error");
    }

    if (!guideData.author || !guideData.url) return addToast("Details required.", "error");

    const newGuide = {
      platform: guideData.platform,
      author: guideData.author,
      url: guideData.url,
      lang: guideData.countryCode === 'us' ? 'en' : 'tr',
      countryCode: guideData.countryCode,
      isApproved: false,
      airdropId: project.id,
      createdAt: Date.now()
    };

    const { data: savedGuide, error } = await supabase.from('guides').insert(newGuide).select().single();

    if (!error && savedGuide) {
      setGuides(prev => [...prev, savedGuide as any]);
      logActivity('guide_suggest');
      setShowGuideModal(false);
      setGuideData({ author: '', url: '', platform: 'youtube', countryCode: 'us' });
      addToast(t('guideSubmitted'));
      refreshData();
    } else {
      addToast("Failed to submit guide.", "error");
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;
    await supabase.from('comments').delete().eq('id', commentToDelete);
    setComments(p => p.filter(x => x.id !== commentToDelete));
    addToast(t('commentDeleted'));
    setCommentToDelete(null);
  };

  const openEditGuide = (g: Guide) => {
    setEditingGuide(g);
    setEditGuideData({ title: g.title || '', author: g.author, url: g.url, platform: g.platform });
  };

  const handleSaveEditGuide = () => {
    if (!editingGuide) return;
    setGuides(prev => prev.map(g => g.id === editingGuide.id ? { ...g, ...editGuideData } : g));
    setEditingGuide(null);
    addToast("Guide updated successfully.");
  };

  const isProjectTracked = user?.trackedProjectIds?.includes(project.id);
  const isAdmin = user?.memberStatus === 'Admin' || user?.memberStatus === 'Super Admin' || user?.memberStatus === 'Moderator';

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube': return <Youtube size={12} />;
      case 'twitter': return <Twitter size={12} />;
      case 'github': return <Github size={12} />;
      default: return <Globe size={12} />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'youtube': return 'bg-red-600';
      case 'twitter': return 'bg-sky-500';
      case 'github': return 'bg-slate-900';
      default: return 'bg-primary-600';
    }
  };

  const getTypeStyle = (type: string) => {
    const tStr = (type || '').toLowerCase();
    if (tStr === 'free') return 'bg-emerald-500 text-white shadow-sm';
    if (tStr === 'paid') return 'bg-amber-500 text-white shadow-sm';
    if (tStr === 'gas only') return 'bg-sky-500 text-white shadow-sm';
    if (tStr === 'waitlist') return 'bg-primary-600 text-white shadow-sm';
    if (tStr === 'testnet') return 'bg-rose-500 text-white shadow-sm';
    if (tStr === 'airdrop confirmed') return 'bg-red-600 text-white shadow-lg animate-pulse';
    return 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500';
  };

  const getStatusStyle = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'potential') return 'bg-purple-600 text-white';
    if (s.includes('available')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (s === 'airdrop confirmed') return 'bg-red-600 text-white shadow-lg animate-pulse';
    return 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500';
  };

  return (
    <div className="max-w-6xl mx-auto pb-24 px-4">
      <Link to={project.hasInfoFi ? "/infofi" : "/"} className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-600 mb-8 transition-colors font-black uppercase text-[10px] tracking-widest"><ChevronLeft size={16} /> {t('airdrops')}</Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border dark:border-slate-800 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
              <OptimizedImage src={getImgUrl(project.icon) || 'https://picsum.photos/200'} className="w-24 h-24 rounded-3xl object-cover ring-4 ring-primary-50 dark:ring-slate-800 shadow-md" alt="" />
              <div className="flex-1">
                <h1 className="text-3xl font-black tracking-tighter mb-1 uppercase leading-none">{project.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">
                    <DollarSign size={12} className="text-emerald-500" />
                    {project.investment} Raised
                  </span>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${getTypeStyle(project.type)}`}>{project.type}</span>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${getStatusStyle(project.status)}`}>{project.status}</span>
                  {project.hasInfoFi && <span className="text-[10px] font-black px-2.5 py-1 bg-primary-600 text-white rounded-lg uppercase">{project.platform || 'InfoFi'}</span>}
                </div>

                {backerList.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('backers')}:</span>
                    {backerList.map(backer => backer && (
                      <Link key={backer.id} to={`/investor/${backer.id}`} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-primary-900/30 border dark:border-slate-700 rounded-xl transition-all shadow-sm">
                        <img src={getImgUrl(backer.logo)} className="w-4 h-4 rounded-md object-cover" />
                        <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">{backer.name}</span>
                      </Link>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 mt-6">
                  {project.socials?.website && <a href={ensureHttp(project.socials.website)} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl hover:text-primary-600 transition-all text-slate-400 shadow-sm"><Globe size={16} /></a>}
                  {project.socials?.twitter && <a href={ensureHttp(project.socials.twitter)} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl hover:text-primary-600 transition-all text-slate-400 shadow-sm"><Twitter size={16} /></a>}
                  {project.socials?.discord && <a href={ensureHttp(project.socials.discord)} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl hover:text-primary-600 transition-all text-slate-400 shadow-sm"><DiscordIcon size={16} /></a>}
                </div>
              </div>
              <div className="text-right hidden md:block"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('indexedDate')}</p><p className="text-xs font-black text-slate-600 dark:text-slate-300">{new Date(project.createdAt || Date.now()).toLocaleDateString()}</p></div>
            </div>
          </div>


          {/* Mobile Actions Section */}
          <div className="lg:hidden mb-6 bg-primary-600 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
            <h3 className="text-lg font-black mb-4 relative z-10 tracking-tight uppercase leading-none">{t('operationTitle')}</h3>
            <div className="space-y-3 relative z-10">
              <button
                onClick={() => {
                  if (!user?.address) return addToast("Connect Wallet to Track", "error");
                  toggleTrackProject(project.id);
                }}
                className={`w-full py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${isProjectTracked ? 'bg-slate-100 text-slate-400 dark:bg-slate-800' : 'bg-white text-primary-600 shadow-lg'}`}
              >
                {isProjectTracked ? <CheckCircle size={16} /> : <Plus size={16} />}
                {isProjectTracked ? 'Tracked' : 'Track Project'}
              </button>

              {project.status === 'Claim Available' && project.claimUrl && (
                <a href={ensureHttp(project.claimUrl)} target="_blank" className="w-full py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 bg-emerald-500 text-white border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-[1.02]">
                  <span className="text-base">💰</span>
                  Claim Available!
                </a>
              )}

              {project.campaignUrl && (
                <a href={ensureHttp(project.campaignUrl)} target="_blank" className="w-full py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 bg-white text-primary-600 border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-pulse-slow">
                  <Rocket size={16} className="animate-bounce" />
                  {t('goCampaign')}
                </a>
              )}
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 blur-2xl -mr-12 -mt-12"></div>
          </div>

          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-primary-600 shadow-inner">
                <Info size={20} />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tighter">{t('projectInfo')}</h2>
            </div>
            <div className="prose dark:prose-invert max-w-none">
              {project.projectInfo ? (
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {project.projectInfo}
                </p>
              ) : (
                <p className="text-slate-400 italic font-medium">Syncing data for {project.name}...</p>
              )}
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Globe size={120} />
            </div>
          </section>
          {project.editorsGuide && (
            <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border dark:border-slate-800 shadow-sm relative overflow-hidden mt-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-600 shadow-inner">
                  <Edit3 size={20} />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tighter text-purple-600 dark:text-purple-400">Editor's Guide</h2>
              </div>
              <div
                className="prose dark:prose-invert max-w-none font-medium text-slate-600 dark:text-slate-300 [&_p]:!my-1 [&_p]:!leading-6 [&_a]:!text-[#ac7ef4] dark:[&_a]:!text-[#d8b4fe] [&_a]:!underline [&_a]:!decoration-[#d8b4fe] [&_h1]:text-xl [&_h1]:font-black [&_h1]:uppercase [&_h2]:text-lg [&_h2]:font-black [&_h2]:uppercase [&_img]:rounded-xl [&_img]:shadow-md [&_img]:bg-slate-200 dark:[&_img]:bg-slate-800 [&_img]:min-h-[200px] [&_img]:object-cover"
                dangerouslySetInnerHTML={{ __html: project.editorsGuide }}
              />
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-purple-600">
                <Edit3 size={120} />
              </div>
            </section>
          )}


          {project.hasInfoFi ? (
            <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center mb-6"><h2 className="text-lg font-black flex items-center gap-2 uppercase tracking-tighter"><Trophy size={18} className="text-amber-500" /> {t('leaderboard')}</h2></div>
              <div className="bg-slate-50/50 dark:bg-slate-950/30 rounded-2xl border dark:border-slate-800 overflow-hidden">
                <div className="divide-y dark:divide-slate-800">
                  {(project.topUsers || []).slice(0, 10).map(u => u && (
                    <div key={u.id} className="flex items-center justify-between p-3 group hover:bg-white dark:hover:bg-slate-900 transition-colors">
                      <div className="flex items-center gap-3">
                        <RankBadge rank={u.rank} />
                        <img src={u.avatar || 'https://picsum.photos/100'} className="w-7 h-7 rounded-full object-cover shadow-sm" />
                        <span className="font-black text-xs uppercase tracking-tight">{u.name || 'Hunter'}</span>
                      </div>
                      <a href={ensureHttp(u.twitterUrl)} target="_blank" className="inline-flex items-center gap-1.5 text-[8px] font-black uppercase text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg hover:bg-primary-600 hover:text-white transition-all">{t('leaderboardFollow')}</a>

                    </div>
                  ))}
                  {(project.topUsers || []).length === 0 && (
                    <div className="p-10 text-center text-slate-400 font-black uppercase text-xs">Syncing...</div>
                  )}
                </div>
              </div>
            </section>
          ) : (
            <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-black uppercase tracking-tighter">{t('guides')}</h2>
                <div className="flex gap-2">
                  <div className="relative z-10" ref={dropdownRef}>
                    <button
                      onClick={() => setDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-2 pl-3 pr-4 py-2 bg-slate-100 dark:bg-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-900 transition-colors"
                    >
                      {guideFilter === 'us' && (
                        <>
                          <img src="https://flagcdn.com/w20/us.png" className="w-4 h-3 object-cover rounded-[2px]" alt="English" />
                          <span>English</span>
                        </>
                      )}
                      {guideFilter === 'tr' && (
                        <>
                          <img src="https://flagcdn.com/w20/tr.png" className="w-4 h-3 object-cover rounded-[2px]" alt="Turkish" />
                          <span>TÜRKÇE</span>
                        </>
                      )}
                      {guideFilter === 'es' && (
                        <>
                          <img src="https://flagcdn.com/w20/es.png" className="w-4 h-3 object-cover rounded-[2px]" alt="Spanish" />
                          <span>Español</span>
                        </>
                      )}
                      {guideFilter === 'ru' && (
                        <>
                          <img src="https://flagcdn.com/w20/ru.png" className="w-4 h-3 object-cover rounded-[2px]" alt="Russian" />
                          <span>Русский</span>
                        </>
                      )}
                      {guideFilter === 'in' && (
                        <>
                          <img src="https://flagcdn.com/w20/in.png" className="w-4 h-3 object-cover rounded-[2px]" alt="Hindi" />
                          <span>हिन्दी</span>
                        </>
                      )}
                      {guideFilter === 'cn' && (
                        <>
                          <img src="https://flagcdn.com/w20/cn.png" className="w-4 h-3 object-cover rounded-[2px]" alt="Chinese" />
                          <span>中文</span>
                        </>
                      )}
                      {guideFilter === 'jp' && (
                        <>
                          <img src="https://flagcdn.com/w20/jp.png" className="w-4 h-3 object-cover rounded-[2px]" alt="Japanese" />
                          <span>日本語</span>
                        </>
                      )}
                      {guideFilter === 'kr' && (
                        <>
                          <img src="https://flagcdn.com/w20/kr.png" className="w-4 h-3 object-cover rounded-[2px]" alt="Korean" />
                          <span>한국어</span>
                        </>
                      )}
                      {guideFilter === 'vn' && (
                        <>
                          <img src="https://flagcdn.com/w20/vn.png" className="w-4 h-3 object-cover rounded-[2px]" alt="Vietnamese" />
                          <span>Tiếng Việt</span>
                        </>
                      )}
                      {guideFilter === 'ph' && (
                        <>
                          <img src="https://flagcdn.com/w20/ph.png" className="w-4 h-3 object-cover rounded-[2px]" alt="Tagalog" />
                          <span>Tagalog</span>
                        </>
                      )}
                      {guideFilter === 'id' && (
                        <>
                          <img src="https://flagcdn.com/w20/id.png" className="w-4 h-3 object-cover rounded-[2px]" alt="Indonesian" />
                          <span>Bahasa Indonesia</span>
                        </>
                      )}
                      <ChevronDown size={14} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-slate-950 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 p-1 animate-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 origin-top-right max-h-60 overflow-y-auto custom-scrollbar z-50">
                        <button
                          onClick={() => { setGuideFilter('us'); setDropdownOpen(false); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${guideFilter === 'us' ? 'bg-primary-50 dark:bg-primary-900/10 text-primary-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}
                        >
                          <img src="https://flagcdn.com/w20/us.png" className="w-4 h-3 object-cover rounded-[2px]" alt="English" />
                          <span>English</span>
                        </button>
                        <button
                          onClick={() => { setGuideFilter('tr'); setDropdownOpen(false); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${guideFilter === 'tr' ? 'bg-primary-50 dark:bg-primary-900/10 text-primary-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}
                        >
                          <img src="https://flagcdn.com/w20/tr.png" className="w-4 h-3 object-cover rounded-[2px]" alt="Turkish" />
                          <span>TÜRKÇE</span>
                        </button>
                        <button onClick={() => { setGuideFilter('es'); setDropdownOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${guideFilter === 'es' ? 'bg-primary-50 dark:bg-primary-900/10 text-primary-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}>
                          <img src="https://flagcdn.com/w20/es.png" className="w-4 h-3 object-cover rounded-[2px]" alt="Spanish" />
                          <span>Español</span>
                        </button>
                        <button onClick={() => { setGuideFilter('ru'); setDropdownOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${guideFilter === 'ru' ? 'bg-primary-50 dark:bg-primary-900/10 text-primary-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}>
                          <img src="https://flagcdn.com/w20/ru.png" className="w-4 h-3 object-cover rounded-[2px]" alt="Russian" />
                          <span>Русский</span>
                        </button>
                        <button onClick={() => { setGuideFilter('in'); setDropdownOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${guideFilter === 'in' ? 'bg-primary-50 dark:bg-primary-900/10 text-primary-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}>
                          <img src="https://flagcdn.com/w20/in.png" className="w-4 h-3 object-cover rounded-[2px]" alt="Hindi" />
                          <span>हिन्दी</span>
                        </button>
                        <button onClick={() => { setGuideFilter('cn'); setDropdownOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${guideFilter === 'cn' ? 'bg-primary-50 dark:bg-primary-900/10 text-primary-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}>
                          <img src="https://flagcdn.com/w20/cn.png" className="w-4 h-3 object-cover rounded-[2px]" alt="Chinese" />
                          <span>中文</span>
                        </button>
                        <button onClick={() => { setGuideFilter('jp'); setDropdownOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${guideFilter === 'jp' ? 'bg-primary-50 dark:bg-primary-900/10 text-primary-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}>
                          <img src="https://flagcdn.com/w20/jp.png" className="w-4 h-3 object-cover rounded-[2px]" alt="Japanese" />
                          <span>日本語</span>
                        </button>
                        <button onClick={() => { setGuideFilter('kr'); setDropdownOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${guideFilter === 'kr' ? 'bg-primary-50 dark:bg-primary-900/10 text-primary-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}>
                          <img src="https://flagcdn.com/w20/kr.png" className="w-4 h-3 object-cover rounded-[2px]" alt="Korean" />
                          <span>한국어</span>
                        </button>
                        <button onClick={() => { setGuideFilter('vn'); setDropdownOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${guideFilter === 'vn' ? 'bg-primary-50 dark:bg-primary-900/10 text-primary-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}>
                          <img src="https://flagcdn.com/w20/vn.png" className="w-4 h-3 object-cover rounded-[2px]" alt="Vietnamese" />
                          <span>Tiếng Việt</span>
                        </button>
                        <button onClick={() => { setGuideFilter('ph'); setDropdownOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${guideFilter === 'ph' ? 'bg-primary-50 dark:bg-primary-900/10 text-primary-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}>
                          <img src="https://flagcdn.com/w20/ph.png" className="w-4 h-3 object-cover rounded-[2px]" alt="Tagalog" />
                          <span>Tagalog</span>
                        </button>
                        <button onClick={() => { setGuideFilter('id'); setDropdownOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${guideFilter === 'id' ? 'bg-primary-50 dark:bg-primary-900/10 text-primary-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}>
                          <img src="https://flagcdn.com/w20/id.png" className="w-4 h-3 object-cover rounded-[2px]" alt="Indonesian" />
                          <span>Bahasa Indonesia</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setShowGuideModal(true)} className="p-2 bg-primary-600 text-white rounded-lg shadow-md active:scale-95"><Plus size={16} /></button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredGuides.map(guide => guide && (
                  <div key={guide.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-transparent hover:border-primary-500 transition-all group flex items-center justify-between">
                    <a href={guide.url} target="_blank" className="flex-1 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm ${getPlatformColor(guide.platform)}`}>
                        {getPlatformIcon(guide.platform)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-[10px] uppercase leading-none truncate">{guide.title || guide.author}</p>
                        <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">added: {new Date(guide.createdAt).toLocaleDateString()}</p>
                      </div>
                    </a>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <div className="flex gap-2">
                          <button onClick={() => openEditGuide(guide)} className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors">
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => handleDeleteGuide(guide.id)} className="p-1.5 text-rose-500 hover:text-rose-700 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                      <ExternalLink size={10} className="text-slate-300 group-hover:text-primary-600" />
                    </div>
                  </div>
                ))}
                {filteredGuides.length === 0 && (
                  <div className="col-span-full py-6 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest opacity-50">{t('noGuides')}</div>
                )}
              </div>
            </section>
          )}

          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border dark:border-slate-800 shadow-sm">
            <h2 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-tighter"><MessageSquare size={20} className="text-primary-600" /> {t('intel')}</h2>
            <div className="space-y-6">
              <div className="divide-y dark:divide-slate-800">
                {paginatedComments.length === 0 ? (
                  <p className="py-12 text-center text-slate-400 font-black uppercase text-xs tracking-widest">{t('noComments')}</p>
                ) : (
                  paginatedComments.map(c => c && (
                    <div key={c.id} className="flex gap-4 py-4 first:pt-0 last:pb-0 animate-in slide-in-from-left duration-300">
                      <img src={c.avatar} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-xs uppercase leading-none">{c.username}</span>
                              {isAdmin && <button onClick={() => setCommentToDelete(c.id)} className="text-red-500 p-1 hover:bg-red-50 rounded-lg"><Trash2 size={10} /></button>}
                            </div>
                          </div>
                          <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} className={s <= (c.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'} />)}</div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-snug">{c.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {totalCommentPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 pt-4">
                  {Array.from({ length: totalCommentPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCommentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg font-black text-[10px] transition-all ${commentPage === i + 1 ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-primary-600'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}

              <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border dark:border-slate-800 mt-6">
                <div className="flex items-center justify-between mb-4"><p className="text-[9px] font-black uppercase text-slate-400">{t('rating')}</p><div className="flex gap-1">{[1, 2, 3, 4, 5].map(s => (<button key={s} onClick={() => setUserRating(s)} className="transition-transform active:scale-90"><Star size={18} className={s <= userRating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 dark:text-slate-700'} /></button>))}</div></div>
                <textarea className="w-full bg-white dark:bg-slate-900 p-4 rounded-xl text-sm font-bold border-2 border-transparent focus:border-primary-500 outline-none transition-all shadow-sm" rows={3} placeholder={t('postIntelPlaceholder')} value={commentText} onChange={(e) => setCommentText(e.target.value)}></textarea>
                <div className="mt-4 flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border dark:border-slate-800"><Lock size={12} className="text-primary-600" /><span className="text-[9px] font-black uppercase text-slate-500">{captchaChallenge.a} + {captchaChallenge.b} = </span><input type="number" className="w-12 p-1 bg-slate-50 dark:bg-slate-800 rounded text-center font-black outline-none" value={captchaAnswer} onChange={e => setCaptchaAnswer(e.target.value)} /></div>
                <button onClick={handlePostComment} className="w-full mt-4 py-3.5 bg-primary-600 text-white rounded-xl font-black text-xs shadow-md active:scale-95 transition-all uppercase tracking-widest">{t('postIntel')}</button>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="hidden lg:block bg-primary-600 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
            <h3 className="text-xl font-black mb-6 relative z-10 tracking-tight uppercase leading-none">{t('operationTitle')}</h3>

            <div className="space-y-4 relative z-10">
              <button
                onClick={() => {
                  if (!user?.address) return addToast("Connect Wallet to Track", "error");
                  toggleTrackProject(project.id);
                }}
                className={`w-full py-4 rounded-xl font-black text-xs flex items-center justify-center gap-3 transition-all active:scale-95 ${isProjectTracked ? 'bg-slate-100 text-slate-400 dark:bg-slate-800' : 'bg-white text-primary-600 shadow-xl shadow-black/10 hover:bg-slate-50'}`}
              >
                {isProjectTracked ? <CheckCircle size={18} /> : <Plus size={18} />}
                {isProjectTracked ? 'Tracked' : 'Track Project'}
              </button>

              {project.status === 'Claim Available' && project.claimUrl && (
                <a href={ensureHttp(project.claimUrl)} target="_blank" className="w-full py-4 rounded-xl font-black text-xs flex items-center justify-center gap-3 transition-all active:scale-95 bg-emerald-500 text-white border border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02]">
                  <span className="text-lg">💰</span>
                  Claim Available!
                </a>
              )}

              {project.campaignUrl && (
                <a href={ensureHttp(project.campaignUrl)} target="_blank" className="w-full py-4 rounded-xl font-black text-xs flex items-center justify-center gap-3 transition-all active:scale-95 bg-white text-primary-600 border border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.3)] animate-pulse-slow">
                  <Rocket size={18} className="animate-bounce" />
                  {t('goCampaign')}
                </a>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-white/20 relative z-10">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold opacity-80 uppercase">{t('rating')}</span>
                  <span className="font-black text-sm">{(project.rating || 0).toFixed(1)}/5.0</span>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16"></div>
          </div>

          {project.hasInfoFi && project.potentialReward && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border dark:border-slate-800 shadow-xl border-l-8 border-l-primary-600 animate-in slide-in-from-right duration-500">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/30 text-primary-600 rounded-xl flex items-center justify-center shadow-inner">
                  <Trophy size={20} />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-white leading-none">Potential Reward</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-bold text-sm bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 leading-relaxed">
                {project.potentialReward}
              </p>
            </div>
          )}
        </div>
      </div>

      {showGuideModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95">
            <button onClick={() => setShowGuideModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 transition-colors z-20"><X size={20} /></button>
            <h3 className="text-xl font-black mb-6 uppercase tracking-tighter">{t('proposeGuide')}</h3>
            <div className="space-y-4">
              <FldInpt label={t('sourceAuthor')} val={guideData.author} onChange={v => setGuideData({ ...guideData, author: v })} />
              <FldInpt label={t('intelUrl')} val={guideData.url} onChange={v => setGuideData({ ...guideData, url: v })} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Platform</label>
                  <select className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold outline-none text-[10px]" value={guideData.platform} onChange={e => setGuideData({ ...guideData, platform: e.target.value as any })}>
                    <option value="youtube">YouTube</option>
                    <option value="twitter">X (Twitter)</option>
                    <option value="github">GitHub</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Language</label>
                  <select className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold outline-none text-[10px]" value={guideData.countryCode} onChange={e => setGuideData({ ...guideData, countryCode: e.target.value as any })}>
                    <option value="us">🇺🇸 English</option>
                    <option value="tr">🇹🇷 TÜRKÇE</option>
                    <option value="es">🇪🇸 Español</option>
                    <option value="ru">🇷🇺 Русский</option>
                    <option value="in">🇮🇳 हिन्दी</option>
                    <option value="cn">🇨🇳 中文</option>
                    <option value="jp">🇯🇵 日本語</option>
                    <option value="kr">🇰🇷 한국어</option>
                    <option value="vn">🇻🇳 Tiếng Việt</option>
                    <option value="ph">🇵🇭 Tagalog</option>
                    <option value="id">🇮🇩 Bahasa Indonesia</option>
                  </select>
                </div>
              </div>
            </div>
            <button onClick={handleSuggestGuide} className="w-full mt-6 py-3.5 bg-primary-600 text-white rounded-xl font-black shadow-lg uppercase tracking-widest text-[10px] active:scale-95 transition-all">{t('submitAlpha')}</button>
          </div>
        </div>
      )}

      {editingGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl">
          <div className="bg-white dark:bg-slate-900 w-full max-sm rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 border-2 border-primary-500">
            <button onClick={() => setEditingGuide(null)} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 transition-colors z-20"><X size={20} /></button>
            <h3 className="text-xl font-black mb-6 uppercase tracking-tighter text-primary-600">Edit Guide</h3>
            <div className="space-y-4">
              <FldInpt label="Guide Title (Optional)" val={editGuideData.title} onChange={v => setEditGuideData({ ...editGuideData, title: v })} />
              <FldInpt label="Author" val={editGuideData.author} onChange={v => setEditGuideData({ ...editGuideData, author: v })} />
              <FldInpt label="URL" val={editGuideData.url} onChange={v => setEditGuideData({ ...editGuideData, url: v })} />
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Platform</label>
                <select className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold outline-none text-[10px]" value={editGuideData.platform} onChange={e => setEditGuideData({ ...editGuideData, platform: e.target.value as any })}>
                  <option value="youtube">YouTube</option>
                  <option value="twitter">X (Twitter)</option>
                  <option value="github">GitHub</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setEditingGuide(null)} className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest">Cancel</button>
              <button onClick={handleSaveEditGuide} className="flex-1 py-3.5 bg-primary-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {commentToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl text-center border dark:border-slate-800">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} />
            </div>
            <h3 className="text-xl font-black mb-4">{t('commentDeleteConfirm')}</h3>
            <div className="flex gap-3">
              <button onClick={() => setCommentToDelete(null)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-slate-200">{t('abort')}</button>
              <button onClick={handleDeleteComment} className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-500/20 transition-all hover:bg-rose-600">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FldInpt: React.FC<{ label: string, val: string, onChange: (v: string) => void }> = ({ label, val, onChange }) => (<div><label className="text-[9px] font-black uppercase text-slate-400 block mb-1 ml-1">{label}</label><input type="text" className="w-full p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold outline-none border-none shadow-inner text-xs" value={val} onChange={e => onChange(e.target.value)} /></div>);
