import { DecagonLogo } from './DecagonLogo';

interface HeaderProps {
  onNavigate: (view: 'feed' | 'impact') => void;
  activeView: string;
}

export function Header({ onNavigate, activeView }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button onClick={() => onNavigate('feed')} className="cursor-pointer">
            <DecagonLogo />
          </button>
          <nav className="flex items-center gap-1">
            <button
              onClick={() => onNavigate('feed')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeView === 'feed'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Issue Tracker
            </button>
            <button
              onClick={() => onNavigate('impact')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeView === 'impact'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Impact Tracker
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">ShopCo Trial</span>
          <span className="h-6 w-6 rounded-full bg-brand-purple flex items-center justify-center text-white text-xs font-semibold">
            S
          </span>
        </div>
      </div>
    </header>
  );
}
