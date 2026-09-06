import React from 'react';
import { APP_VERSION } from '../../../../shared/version.js';
import { Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md py-4 px-4 sm:px-6 lg:px-8 text-xs text-slate-400 mt-auto z-10 pb-20 md:pb-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
        <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
          <span>© 2026 Dein Weg Planner Tool</span>
          <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700/60 font-medium">
            v{APP_VERSION}
          </span>
          <span>·</span>
          <a
            href="https://timovorwald.de"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 hover:text-sky-300 hover:underline font-medium transition-colors"
          >
            timovorwald.de
          </a>
          <span>·</span>
          <span className="text-slate-400">Alle Rechte vorbehalten.</span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
          <span>Gemeinsam stark im Alltag</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
        </div>
      </div>
    </footer>
  );
};
