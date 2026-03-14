'use client';
import { LogOut, CheckSquare } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface NavbarProps {
  userName?: string;
  onLogout: () => void;
}

export function Navbar({ userName, onLogout }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare size={20} style={{ color: 'var(--accent)' }} />
          <span className="font-semibold text-sm tracking-tight">TaskFlow</span>
        </div>

        <div className="flex items-center gap-2">
          {userName && (
            <span className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
              {userName}
            </span>
          )}
          <ThemeToggle />
          <button onClick={onLogout} className="btn-ghost text-sm gap-1.5 px-3" title="Logout">
            <LogOut size={15} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
