import React, { useState, useEffect } from 'react';
import { Share, Plus, X, Phone } from 'lucide-react';

export const InstallPWA: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showIOSPrompt, setShowIOSPrompt] = useState(false);
    const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
            setIsStandalone(true);
            return;
        }

        // Android / Desktop - beforeinstallprompt
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Check if user dismissed it recently
            const dismissed = localStorage.getItem('install_dismissed_ts');
            if (!dismissed || Date.now() - parseInt(dismissed) > 86400000) { // Show again after 24h
                setShowAndroidPrompt(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // iOS Detection - Safari Only (exclude Chrome/Firefox on iOS)
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        const isSafari = userAgent.includes('safari') && !userAgent.includes('crios') && !userAgent.includes('fxios');

        if (isIOS && isSafari && !isStandalone) {
            // Check if user dismissed it recently
            const dismissed = localStorage.getItem('install_dismissed_ts');
            if (!dismissed || Date.now() - parseInt(dismissed) > 86400000) {
                setShowIOSPrompt(true);
            }
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowAndroidPrompt(false);
        }
        setDeferredPrompt(null);
    };

    const dismiss = () => {
        setShowIOSPrompt(false);
        setShowAndroidPrompt(false);
        localStorage.setItem('install_dismissed_ts', Date.now().toString());
    };

    if (isStandalone) return null;

    return (
        <>
            {/* iOS Prompt */}
            {showIOSPrompt && (
                <div className="fixed bottom-4 left-4 right-4 z-[250] animate-bounce-in-up">
                    <div className="bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-3xl shadow-2xl border border-white/10 relative">
                        <button onClick={dismiss} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white"><X size={16} /></button>
                        <div className="flex items-start gap-4 pr-6">
                            <img src="/logo.jpg" className="w-12 h-12 rounded-2xl shrink-0 shadow-lg object-cover" alt="App Icon" />
                            <div>
                                <h4 className="font-bold text-sm mb-1">Install App</h4>
                                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                                    Install DropHunt for the best experience.
                                    <br />
                                    1. Tap the <Share size={12} className="inline mx-1" /> <strong>Share</strong> button below.
                                    <br />
                                    2. Select <Plus size={12} className="inline mx-1" /> <strong>Add to Home Screen</strong>.
                                </p>
                            </div>
                        </div>
                        {/* Arrow pointing down to the browser toolbar */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900/90 rotate-45 border-r border-b border-white/10"></div>
                    </div>
                </div>
            )}

            {/* Android / Chrome Prompt */}
            {showAndroidPrompt && (
                <div className="fixed bottom-4 left-4 right-4 z-[250]">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-2xl border dark:border-slate-700 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <img src="/logo.jpg" className="w-10 h-10 rounded-xl shrink-0 object-cover" alt="App Icon" />
                            <div>
                                <p className="font-bold text-sm dark:text-white">Add to Home Screen</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Get the App</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={dismiss} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><X size={18} /></button>
                            <button onClick={handleInstallClick} className="px-4 py-2 bg-primary-600 text-white text-xs font-bold rounded-xl shadow-lg active:scale-95 transition-all">Install</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
