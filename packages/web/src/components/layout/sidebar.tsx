'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Upload,
  RefreshCw,
  Eye,
  Settings,
  FileCheck,
  BookOpen,
  HelpCircle,
} from 'lucide-react';

const navItems = [
  { href: '/', icon: LayoutDashboard, label: '대시보드' },
  { href: '/upload', icon: Upload, label: '파일 업로드' },
  { href: '/convert', icon: RefreshCw, label: '변환 관리' },
  { href: '/preview', icon: Eye, label: '미리보기' },
  { href: '/report', icon: FileCheck, label: '검증 리포트' },
  { href: '/settings', icon: Settings, label: '설정' },
  { href: '/guide', icon: HelpCircle, label: '가이드' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/30 blur-lg rounded-full" />
            <div className="relative w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight">ePub 3.0</h1>
            <p className="text-xs text-gray-400 font-medium">리마스터링 도구</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-indigo-500/15 text-indigo-300 border-l-[3px] border-indigo-500 pl-[13px]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] ${active ? 'text-indigo-400' : ''}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-5 border-t border-white/10">
        <p className="text-gray-300 text-xs font-medium">(주)하얀마인드</p>
        <p className="text-gray-400 text-[11px] mt-1">한국출판문화산업진흥원 지원</p>
        <p className="text-gray-500 text-[10px] mt-2 font-mono">v1.0.0</p>
      </div>
    </aside>
  );
}
