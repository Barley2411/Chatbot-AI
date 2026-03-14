import { Menu, LogIn, LogOut } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut, User } from 'firebase/auth';

interface HeaderProps {
  onMenuClick: () => void;
  user: User | null;
  currentChatTitle?: string;
}

export function Header({ 
  onMenuClick, 
  user, 
  currentChatTitle
}: HeaderProps) {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white px-4 py-3 flex items-center justify-between border-b border-slate-100">
      <div className="flex items-center gap-6 min-w-0">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors md:hidden flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-4 min-w-0">
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

      <div className="flex items-center gap-2">
        {user ? (
          <div className="flex items-center gap-2 ml-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shadow-sm" title={user.displayName || 'User'}>
              <img 
                src={user.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=DangVien&backgroundColor=ffb3b3"} 
                alt="User avatar"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="ml-2 flex items-center gap-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span className="hidden sm:inline">Đăng nhập</span>
          </button>
        )}
      </div>
    </header>
  );
}
