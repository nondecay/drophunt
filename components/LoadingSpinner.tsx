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

                {/* Bow String - Using SMIL <animate> for reliable mobile support */}
                <path d="M35 15 L 35 50 L 35 85" className="opacity-40" strokeWidth="1.5">
                    <animate
                        attributeName="d"
                        values="M35 15 L 35 50 L 35 85; M35 15 L 10 50 L 35 85; M35 15 L 10 50 L 35 85; M35 15 L 35 50 L 35 85; M35 15 L 35 50 L 35 85"
                        keyTimes="0; 0.4; 0.5; 0.6; 1"
                        dur="1s"
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.2 1; 0 0 1 1; 0.4 0 0.2 1; 0 0 1 1"
                    />
                </path>

                {/* Arrow - Tail aligned to String Rest Position (x=35) */}
                <g className="animate-arrow will-change-transform">
                    {/* Shaft - Starts at x=35 (String position) */}
                    <line x1="35" y1="50" x2="82" y2="50" strokeWidth="3" strokeLinecap="butt" />

                    {/* Sharp Arrowhead (Right) */}
                    <path d="M75 42 L 85 50 L 75 58" strokeWidth="3" strokeLinecap="round" strokeLinejoin="miter" />

                    {/* Flat Nock (Left) - Aligned exactly at x=35 */}
                    <line x1="35" y1="44" x2="35" y2="56" strokeWidth="3" strokeLinecap="butt" opacity="0.8" />
                </g>
            </svg>
            <style>{`
                @keyframes arrowShoot {
                    0% { transform: translateX(0); opacity: 0; }
                    10% { transform: translateX(0); opacity: 1; }
                    40% { transform: translateX(-25px); } /* Sync with String Pull (35 -> 10) */
                    50% { transform: translateX(-25px); } /* Hold */
                    60% { transform: translateX(120px); opacity: 0; } /* Release */
                    100% { transform: translateX(120px); opacity: 0; }
                }
                .animate-arrow {
                    animation: arrowShoot 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
                .will-change-transform {
                    will-change: transform;
                }
            `}</style>
        </div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">Loading...</p>
    </div>
);
