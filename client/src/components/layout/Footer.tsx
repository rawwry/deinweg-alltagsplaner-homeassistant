import React, { useState } from 'react';
import { APP_VERSION } from '../../../../shared/version.js';
import { ChangelogModal } from '../ChangelogModal.js';

export const Footer: React.FC = () => {
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);

  return (
    <>
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md py-2.5 px-4 sm:px-6 lg:px-8 text-xs text-slate-400 flex-shrink-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2.5 text-center sm:text-left">
          <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-start text-[11px] sm:text-xs">
            <span>© 2026 Dein Weg Planner Tool</span>
            <button
              type="button"
              onClick={() => setIsChangelogOpen(true)}
              title="Changelog ansehen"
              className="px-1.5 py-0.5 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-mono text-[10px] sm:text-[11px] border border-slate-700/60 font-medium transition-colors cursor-pointer"
            >
              v{APP_VERSION}
            </button>
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
            <button
              type="button"
              onClick={() => setIsChangelogOpen(true)}
              className="text-sky-400 hover:text-sky-300 hover:underline font-medium transition-colors cursor-pointer"
            >
              Changelog
            </button>
            <span>·</span>
            <span className="text-slate-400 hidden xs:inline">Alle Rechte vorbehalten.</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] sm:text-[11px] font-mono tracking-wider font-semibold">
            <span>fcknzs</span>
          </div>
        </div>
      </footer>

      {/* Interactive In-App Changelog Modal */}
      {isChangelogOpen && <ChangelogModal onClose={() => setIsChangelogOpen(false)} />}
    </>
  );
};
