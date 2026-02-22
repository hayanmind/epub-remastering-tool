'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { WifiOff, LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { getHealth } from '@/lib/api';
import LoginModal from '@/components/auth/login-modal';

const PAGE_TITLES: Record<string, string> = {
  '/': '대시보드',
  '/upload': '파일 업로드',
  '/convert': '변환 관리',
  '/preview': '미리보기',
  '/report': '검증 리포트',
  '/settings': '설정',
  '/guide': '사용 가이드',
};

export default function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, isDemo, logout } = useAuth();
  const [apiStatus, setApiStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        await getHealth();
        setApiStatus('connected');
      } catch {
        setApiStatus('disconnected');
      }
    }
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  const pageTitle = PAGE_TITLES[pathname] || '페이지';

  return (
    <>
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
        <h2 className="text-sm font-semibold text-gray-800">{pageTitle}</h2>
        <div className="flex items-center gap-2.5">
          {/* Demo mode badge */}
          {isDemo && (
            <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">
              데모
            </span>
          )}

          {/* API status */}
          {apiStatus === 'connected' ? (
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 px-2.5 py-1 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              연결됨
            </div>
          ) : apiStatus === 'disconnected' ? (
            <div className="flex items-center gap-1.5 text-[11px] text-red-500 px-2.5 py-1 rounded-md">
              <WifiOff className="w-3 h-3" />
              오프라인
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 px-2.5 py-1 rounded-md">
              확인 중...
            </div>
          )}

          {/* User / Auth */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50">
                <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
                <span className="text-[11px] font-medium text-gray-700">{user?.name}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md hover:bg-gray-50 transition-colors"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              로그인
            </button>
          )}
        </div>
      </header>

      <LoginModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
}
