import React from 'react';

export type WasteBinType = 'YELLOW' | 'BIO' | 'PAPER' | 'REST' | string;

interface WasteWheelieBinProps {
  type: WasteBinType;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
}

interface BinColorProfile {
  lid: string;
  lidHighlight: string;
  lidHandle: string;
  body: string;
  bodyHighlight: string;
  bodyRibs: string;
  badgeBg: string;
  badgeText: string;
  glowColor: string;
  label: string;
}

const COLOR_MAP: Record<string, BinColorProfile> = {
  YELLOW: {
    lid: '#eab308', // amber-500
    lidHighlight: '#fde047', // yellow-300
    lidHandle: '#ca8a04',
    body: '#ca8a04', // amber-600
    bodyHighlight: '#eab308',
    bodyRibs: '#a16207',
    badgeBg: 'rgba(234, 179, 8, 0.15)',
    badgeText: '#facc15',
    glowColor: 'rgba(234, 179, 8, 0.35)',
    label: 'Gelbe Tonne',
  },
  BIO: {
    lid: '#78350f', // amber-900 brown
    lidHighlight: '#92400e', // amber-800 warm brown
    lidHandle: '#451a03',
    body: '#542508', // rich bin brown
    bodyHighlight: '#78350f',
    bodyRibs: '#2a1002',
    badgeBg: 'rgba(120, 53, 15, 0.2)',
    badgeText: '#d97706',
    glowColor: 'rgba(146, 64, 14, 0.35)',
    label: 'Biotonne',
  },
  PAPER: {
    lid: '#2563eb', // blue-600
    lidHighlight: '#60a5fa', // blue-400
    lidHandle: '#1d4ed8',
    body: '#1d4ed8', // blue-700
    bodyHighlight: '#2563eb',
    bodyRibs: '#1e40af',
    badgeBg: 'rgba(59, 130, 246, 0.15)',
    badgeText: '#60a5fa',
    glowColor: 'rgba(59, 130, 246, 0.35)',
    label: 'Papiertonne',
  },
  REST: {
    lid: '#475569', // slate-600
    lidHighlight: '#94a3b8', // slate-400
    lidHandle: '#334155',
    body: '#334155', // slate-700
    bodyHighlight: '#475569',
    bodyRibs: '#1e293b',
    badgeBg: 'rgba(148, 163, 184, 0.15)',
    badgeText: '#cbd5e1',
    glowColor: 'rgba(148, 163, 184, 0.25)',
    label: 'Restmüll',
  },
};

const SIZE_MAP = {
  xs: { width: 22, height: 28 },
  sm: { width: 32, height: 40 },
  md: { width: 44, height: 56 },
  lg: { width: 64, height: 80 },
  xl: { width: 88, height: 110 },
};

export const WasteWheelieBin: React.FC<WasteWheelieBinProps> = ({
  type,
  size = 'md',
  className = '',
  animate = false,
}) => {
  const normType = type ? type.toUpperCase() : 'REST';
  const colors = COLOR_MAP[normType] || COLOR_MAP.REST;
  const dim = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div
      className={`inline-flex items-center justify-center relative select-none ${
        animate ? 'hover:scale-105 transition-transform duration-300' : ''
      } ${className}`}
      style={{ width: dim.width, height: dim.height }}
      title={colors.label}
    >
      <svg
        viewBox="0 0 64 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md overflow-visible"
      >
        <defs>
          <linearGradient id={`lid-grad-${normType}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.lidHighlight} />
            <stop offset="100%" stopColor={colors.lid} />
          </linearGradient>
          <linearGradient id={`body-grad-${normType}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colors.bodyHighlight} />
            <stop offset="85%" stopColor={colors.body} />
          </linearGradient>
          {/* Wheel radial gradient */}
          <radialGradient id="wheel-grad" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
        </defs>

        <g>
          {/* Left Wheel */}
          <circle cx="10" cy="69" r="6" fill="url(#wheel-grad)" stroke="#0f172a" strokeWidth="1" />
          <circle cx="10" cy="69" r="2.5" fill="#94a3b8" />

          {/* Right Wheel */}
          <circle cx="54" cy="69" r="6" fill="url(#wheel-grad)" stroke="#0f172a" strokeWidth="1" />
          <circle cx="54" cy="69" r="2.5" fill="#94a3b8" />

          {/* Wheel Axle Bar */}
          <rect x="14" y="67.5" width="36" height="3" rx="1.5" fill="#334155" />

          {/* Tapered Bin Body */}
          {/* Top width: from x=14 to x=50 (width 36), Bottom width: from x=17 to x=47 (width 30) */}
          <path
            d="M 13 22 L 17 68 C 17 71 19 72 22 72 L 42 72 C 45 72 47 71 47 68 L 51 22 Z"
            fill={`url(#body-grad-${normType})`}
            stroke={colors.bodyRibs}
            strokeWidth="1.2"
          />

          {/* Vertical Ribs for authentic Wheelie Bin Texture */}
          <line x1="26" y1="26" x2="27.5" y2="66" stroke={colors.bodyRibs} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          <line x1="32" y1="26" x2="32" y2="66" stroke={colors.bodyRibs} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          <line x1="38" y1="26" x2="36.5" y2="66" stroke={colors.bodyRibs} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

          {/* Bin Collar / Rim */}
          <rect
            x="11"
            y="18"
            width="42"
            height="5"
            rx="1.5"
            fill={colors.lid}
            stroke={colors.bodyRibs}
            strokeWidth="1"
          />

          {/* Front Lid Catch / Edge */}
          <rect
            x="8"
            y="12"
            width="48"
            height="7"
            rx="2.5"
            fill={`url(#lid-grad-${normType})`}
            stroke={colors.lidHandle}
            strokeWidth="1.2"
          />

          {/* Rear Lid Hinge & Top Crest */}
          <path
            d="M 12 13 C 12 8 20 6 32 6 C 44 6 52 8 52 13 Z"
            fill={`url(#lid-grad-${normType})`}
            stroke={colors.lidHandle}
            strokeWidth="1"
          />

          {/* Sturdy Lid Grab Handle */}
          <rect
            x="24"
            y="3"
            width="16"
            height="4"
            rx="2"
            fill={colors.lidHandle}
            stroke="#0f172a"
            strokeWidth="0.8"
          />

          {/* Small modern symbol icon on the bin front */}
          <g transform="translate(26, 38)" opacity="0.85">
            {normType === 'YELLOW' && (
              /* Recycling arrows */
              <path
                d="M 6 0 L 8 4 L 4 4 Z M 11 8 L 10 12 L 7 9 Z M 1 9 L 2 12 L 5 9 Z"
                fill="#fef08a"
              />
            )}
            {normType === 'BIO' && (
              /* Leaf */
              <path
                d="M 6 1 C 10 1 11 5 11 9 C 9 9 7 9 5 7 C 3 5 2 3 6 1 Z"
                fill="#fed7aa"
              />
            )}
            {normType === 'PAPER' && (
              /* Sheet / Box */
              <path
                d="M 3 2 H 9 V 10 H 3 Z"
                fill="#bfdbfe"
              />
            )}
            {normType === 'REST' && (
              /* Flame / Waste */
              <circle cx="6" cy="6" r="3" fill="#cbd5e1" />
            )}
          </g>
        </g>
      </svg>
    </div>
  );
};
