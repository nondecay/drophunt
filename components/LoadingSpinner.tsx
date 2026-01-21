import React from 'react';

export const LoadingSpinner: React.FC = () => (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-8">
        <div className="relative w-24 h-24">
            <svg
                viewBox="0 0 100 100"
                className="w-full h-full stroke-primary-600 dark:stroke-primary-500"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {/* Bow (Curve facing Right) */}
                <path d="M30 15 C 70 15, 85 50, 85 50 C 85 50, 70 85, 30 85" className="opacity-80" />

                {/* Bow String (Connects ends, pulls Left) */}
                <path d="M30 15 L 30 85" className="animate-bow-string opacity-40" />

                {/* Arrow (Points Right) */}
                <g className="animate-arrow">
                    <line x1="30" y1="50" x2="75" y2="50" strokeWidth="3" />
                    <path d="M68 44 L 75 50 L 68 56" strokeWidth="3" />
                    {/* Feather/Nock */}
                    <line x1="30" y1="50" x2="25" y2="50" strokeWidth="2" opacity="0.6" />
                </g>
            </svg>
            <style>{`
                @keyframes bowString {
                    0%, 100% { d: path("M30 15 L 30 85"); }
                    50% { d: path("M30 15 L 5 50 L 30 85"); }
                }
                @keyframes arrowShoot {
                    0%, 100% { transform: translateX(0); opacity: 0; }
                    5% { transform: translateX(0); opacity: 1; }
                    50% { transform: translateX(-25px); } /* Pull Back */
                    55% { transform: translateX(-25px); } /* Hold */
                    80% { transform: translateX(100px); opacity: 0; } /* Shoot */
                }
                .animate-bow-string {
                    animation: bowString 1.5s ease-in-out infinite;
                }
                .animate-arrow {
                    animation: arrowShoot 1.5s ease-in-out infinite;
                }
            `}</style>
        </div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">Loading...</p>
    </div>
);
