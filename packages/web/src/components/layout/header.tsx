'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Wifi, WifiOff, LogIn, LogOut, User } from 'lucide-react';
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
      <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <h2 className="text-sm font-semibold text-gray-800">{pageTitle}</h2>
        <div className="flex items-center gap-3">
          {/* Demo mode badge */}
          {isDemo && (
            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-xs font-medium border border-amber-200">
              데모 모드
            </div>
          )}

          {/* API status */}
          {apiStatus === 'connected' ? (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              연결됨
            </div>
          ) : apiStatus === 'disconnected' ? (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-xs font-medium">
              <WifiOff className="w-3 h-3" />
              오프라인
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-gray-50 text-gray-500 px-3 py-1.5 rounded-full text-xs font-medium">
              <Wifi className="w-3 h-3" />
              확인 중...
            </div>
          )}

          {/* User / Auth */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
                <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700">{user?.name}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                로그아웃
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-full text-xs font-medium shadow-sm hover:shadow-md transition-all"
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
