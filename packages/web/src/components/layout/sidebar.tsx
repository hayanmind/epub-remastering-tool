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
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-[18px] h-[18px] text-white" />
          </div>
          <div>
            <h1 className="font-bold text-[15px] leading-tight tracking-tight text-gray-900">ePub 3.0</h1>
            <p className="text-[11px] text-gray-500 font-medium">리마스터링 도구</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-1 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                active
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className={`w-[16px] h-[16px] ${active ? 'text-indigo-600' : 'text-gray-400'}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <p className="text-gray-600 text-xs font-medium">(주)하얀마인드</p>
        <p className="text-gray-400 text-[11px] mt-0.5">한국출판문화산업진흥원 지원</p>
        <p className="text-gray-400 text-[10px] mt-1.5 font-mono">v1.0.0</p>
      </div>
    </aside>
  );
}
