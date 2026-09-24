import React, { useState } from 'react';
import { APP_VERSION } from '../../../../shared/version.js';
import { ChangelogModal } from '../ChangelogModal.js';

export const Footer: React.FC = () => {
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);

  return (
    <>
      <footer className="hidden sm:block w-full border-t border-surface-border/50 bg-transparent mt-10 pt-4 pb-4 px-4 text-xs text-slate-400 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-1.5 flex-wrap justify-start text-xs">
            <span className="text-slate-300">© 2026 •︎ Deine WG: Alltagsplaner</span>
            <button
              type="button"
              onClick={() => setIsChangelogOpen(true)}
              title="Changelog ansehen"
              className="px-2 py-0.5 rounded-lg bg-surface-elevated hover:bg-surface-card text-slate-300 hover:text-theme-primary font-mono text-[11px] border border-surface-border font-medium transition-colors cursor-pointer"
            >
              v{APP_VERSION}
            </button>
            <span className="text-slate-600">·</span>
            <a
              href="https://timovorwald.de"
              target="_blank"
              rel="noopener noreferrer"
              className="text-theme hover:underline font-medium transition-colors"
            >
              timovorwald.de
            </a>
            <span className="text-slate-600">·</span>
            <button
              type="button"
              onClick={() => setIsChangelogOpen(true)}
              className="text-theme hover:underline font-medium transition-colors cursor-pointer"
            >
              Changelog
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500 hover:text-theme transition-colors text-[11px] font-mono tracking-wider font-semibold">
            <span>fcknzs</span>
          </div>
        </div>
      </footer>

      {/* Interactive In-App Changelog Modal */}
      {isChangelogOpen && <ChangelogModal onClose={() => setIsChangelogOpen(false)} />}
    </>
  );
};
