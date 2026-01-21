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
                {/* Recurve Bow Body - More complex curve */}
                <path
                    d="M35 15 C 55 15, 60 35, 50 50 C 60 65, 55 85, 35 85"
                    className="opacity-90"
                    strokeWidth="3"
                />

                {/* Bow String */}
                <path d="M35 15 L 35 85" className="animate-bow-string opacity-40" strokeWidth="1.5" />

                {/* Arrow */}
                <g className="animate-arrow">
                    {/* Shaft */}
                    <line x1="35" y1="50" x2="80" y2="50" strokeWidth="2.5" />
                    {/* Arrowhead */}
                    <path d="M72 44 L 80 50 L 72 56" strokeWidth="2.5" />
                    {/* Fletching */}
                    <path d="M40 46 L 35 50 L 40 54" strokeWidth="1.5" opacity="0.8" />
                </g>
            </svg>
            <style>{`
                @keyframes bowString {
                    0%, 100% { d: path("M35 15 L 35 85"); }
                    40% { d: path("M35 15 L 10 50 L 35 85"); } /* Pull Back phase */
                }
                @keyframes arrowShoot {
                    0%, 100% { transform: translateX(0); opacity: 0; }
                    10% { transform: translateX(0); opacity: 1; } /* Appear */
                    40% { transform: translateX(-25px); } /* Full Draw */
                    45% { transform: translateX(-25px); } /* Hold briefly */
                    60% { transform: translateX(120px); opacity: 0; } /* Fast Release */
                }
                .animate-bow-string {
                    animation: bowString 1s ease-in-out infinite;
                }
                .animate-arrow {
                    animation: arrowShoot 1s ease-in-out infinite;
                }
            `}</style>
        </div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">Loading...</p>
    </div>
);
