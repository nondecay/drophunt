import React from 'react';
import { useApp } from '../AppContext';
import { Crown } from 'lucide-react';
import { isPremiumUser } from '../types';

const Premium: React.FC = () => {
    const { user, isAuthLoading } = useApp();

    if (isAuthLoading) {
        return <div className="flex justify-center p-12 text-gray-500">Loading...</div>;
    }

    // If not logged in or no user
    if (!user) {
        return (
            <div className="max-w-4xl mx-auto p-6 md:p-12 text-center text-gray-400">
                <Crown className="w-16 h-16 mx-auto mb-4 text-[#FFD700] opacity-50" />
                <h1 className="text-3xl font-bold text-white mb-4">DropHunt Premium</h1>
                <p className="mb-8">Connect your wallet to view Premium features.</p>
            </div>
        );
    }

    const isPremium = isPremiumUser(user);

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-12">
            <div className="text-center mb-12">
                <Crown className="w-20 h-20 mx-auto mb-6 text-[#FFD700]" />
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#FFD700] to-yellow-200">
                    DropHunt Premium Pass
                </h1>
                <p className="text-xl text-gray-300">Unlock the ultimate alpha tools for power hunters.</p>
            </div>

            {isPremium ? (
                <div className="bg-[#1e1e1e] border border-[#FFD700] rounded-xl p-8 mb-12 text-center shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                    <div className="inline-flex items-center gap-2 bg-[#FFD700]/20 text-[#FFD700] px-4 py-2 rounded-full mb-4">
                        <Crown className="w-5 h-5" />
                        <span className="font-bold">Premium Active</span>
                    </div>
                    <h2 className="text-2xl font-semibold text-white mb-2">You are a DropHunt Pro!</h2>
                    <p className="text-gray-400">All premium features are currently unlocked for your account.</p>
                </div>
            ) : (
                <div className="bg-[#1e1e1e] border border-gray-800 hover:border-gray-700 transition-colors rounded-xl p-8 mb-12 text-center">
                    <h2 className="text-2xl font-semibold text-white mb-4">Mint Your Pro Pass</h2>
                    <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                        Get lifetime access to exclusive alpha guides, unlimited tracking, and VIP community perks by holding the DropHunt Pro Pass Soulbound NFT.
                    </p>
                    <button className="bg-[#FFD700] hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto">
                        <Crown className="w-5 h-5" />
                        Mint Premium Pass (Coming Soon)
                    </button>

                    <div className="mt-8 pt-6 border-t border-gray-800">
                        <p className="text-sm text-gray-500 mb-4">Already hold the pass but it's not active?</p>
                        <button className="text-[#FFD700] cursor-pointer hover:underline text-sm opacity-80" onClick={() => alert('Verification check initiated... (Coming soon)')}>
                            Verify Pro Pass (Restore)
                        </button>
                    </div>
                </div>
            )}

            {/* Perks List */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-[#1e1e1e] p-6 rounded-xl border border-gray-800">
                    <h3 className="text-xl font-bold text-white mb-3">Unlimited Tracking</h3>
                    <p className="text-gray-400">Bypass the restrictive 3-project limit. Track, manage and hunt down an unlimited number of airdrops.</p>
                </div>
                <div className="bg-[#1e1e1e] p-6 rounded-xl border border-gray-800">
                    <h3 className="text-xl font-bold text-white mb-3">Unlock Secret Alpha</h3>
                    <p className="text-gray-400">Access blurred projects and exclusive "Alpha" tagged early-stage opportunities before the crowd.</p>
                </div>
                <div className="bg-[#1e1e1e] p-6 rounded-xl border border-gray-800">
                    <h3 className="text-xl font-bold text-white mb-3">Rate & Reviews</h3>
                    <p className="text-gray-400">Join the discussion by writing reviews and rating projects. Shape the community consensus.</p>
                </div>
                <div className="bg-[#1e1e1e] p-6 rounded-xl border border-gray-800">
                    <h3 className="text-xl font-bold text-white mb-3">All In-Depth Guides</h3>
                    <p className="text-gray-400">Read every single hidden tutorial, task walkthrough and contract interaction without blur limits.</p>
                </div>
            </div>
        </div>
    );
};

export default Premium;
