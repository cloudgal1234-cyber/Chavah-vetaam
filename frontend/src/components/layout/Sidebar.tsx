'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { cn, formatCredits } from '@/lib/utils';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/campaigns', label: 'Campaigns', icon: '📁' },
  { href: '/campaigns/new', label: 'New Campaign', icon: '✨' },
  { href: '/gallery', label: 'Gallery', icon: '🖼️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    router.push('/');
  };

  return (
    <aside className="flex h-full w-60 flex-col border-r border-gray-200 bg-white px-4 py-6">
      <Link href="/" className="mb-8 px-2 text-xl font-bold text-brand-600">
        Presenter AI
      </Link>

      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-brand-50 text-brand-700'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <span>{icon}</span>
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-gray-100 pt-4 space-y-3">
        <div className="rounded-lg bg-brand-50 px-3 py-2">
          <p className="text-xs text-brand-600 font-medium">Credits Balance</p>
          <p className="text-2xl font-bold text-brand-700">{formatCredits(user?.credits ?? 0)}</p>
        </div>

        <div className="flex items-center gap-3 px-2">
          <div className="h-8 w-8 rounded-full bg-brand-200 flex items-center justify-center text-sm font-bold text-brand-700">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>

        <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
          Sign out
        </button>
      </div>
    </aside>
  );
}
