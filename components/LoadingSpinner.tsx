import React from 'react';

export const LoadingSpinner: React.FC = () => (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-8">
        <div className="relative w-24 h-24 sm:w-32 sm:h-32">
            <svg
                viewBox="0 0 100 100"
                className="w-full h-full stroke-primary-600 dark:stroke-primary-500"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {/* Recurve Bow Body */}
                <path
                    d="M35 15 C 55 15, 60 35, 50 50 C 60 65, 55 85, 35 85"
                    className="opacity-90"
                    strokeWidth="3"
                />

                {/* Bow String - Initial state has 3 points to match animation state */}
                <path d="M35 15 L 35 50 L 35 85" className="animate-bow-string opacity-40" strokeWidth="1.5" />

                {/* Arrow */}
                <g className="animate-arrow will-change-transform">
                    {/* Shaft - Flat Left End (Just a line) */}
                    <line x1="20" y1="50" x2="82" y2="50" strokeWidth="3" strokeLinecap="butt" />

                    {/* Sharp Arrowhead (Right) */}
                    <path d="M75 42 L 85 50 L 75 58" strokeWidth="3" strokeLinecap="round" strokeLinejoin="miter" />
                </g>
            </svg>
            <style>{`
                @keyframes bowString {
                    /* Start: Straight (3 points) */
                    0%, 100% { d: path("M35 15 L 35 50 L 35 85"); }
                    /* Middle: Bent (3 points) - Now interpolation works on mobile */
                    40% { d: path("M35 15 L 10 50 L 35 85"); }
                }
                @keyframes arrowShoot {
                    0%, 100% { transform: translateX(0); opacity: 0; }
                    10% { transform: translateX(0); opacity: 1; }
                    40% { transform: translateX(-25px); }
                    45% { transform: translateX(-25px); }
                    60% { transform: translateX(120px); opacity: 0; }
                }
                .animate-bow-string {
                    animation: bowString 1s ease-in-out infinite;
                }
                .animate-arrow {
                    animation: arrowShoot 1s ease-in-out infinite;
                }
                .will-change-transform {
                    will-change: transform;
                }
            `}</style>
        </div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">Loading...</p>
    </div>
);
