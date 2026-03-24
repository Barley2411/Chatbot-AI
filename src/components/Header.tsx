import { Menu } from 'lucide-react';
import { clsx } from 'clsx';

interface HeaderProps {
  onMenuClick: () => void;
  currentChatTitle?: string;
  isSidebarOpen?: boolean;
}

export function Header({ 
  onMenuClick, 
  currentChatTitle,
  isSidebarOpen
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full bg-white px-4 py-3 flex items-center justify-between border-b border-slate-100">
      <div className="flex items-center gap-6 min-w-0">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors md:hidden flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className={clsx(
          "flex items-center gap-4 min-w-0 transition-all duration-300",
          !isSidebarOpen && "md:ml-14"
        )}>
          <h1 className="text-lg font-semibold text-slate-800 hidden sm:block truncate">
            Trung ương Đoàn TNCS Hồ Chí Minh AI
          </h1>
          {currentChatTitle && (
            <>
              <span className="hidden md:block text-slate-300 flex-shrink-0">|</span>
              <span className="text-base font-medium text-slate-600 truncate max-w-[120px] md:max-w-[300px]">
                {currentChatTitle}
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
