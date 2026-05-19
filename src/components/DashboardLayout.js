"use client";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { LogOut, LayoutDashboard, Database, Settings, Users } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="flex h-screen items-center justify-center bg-gray-950 text-white">Loading...</div>;
  }

  const isAdmin = user.role === 'Admin';

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-gray-800 bg-gray-900/50 backdrop-blur-xl">
        <div className="flex h-16 items-center px-6 border-b border-gray-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Chat System</h1>
        </div>
        <nav className="mt-6 flex flex-col gap-2 px-4">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link href="/dashboard/apps" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <Database size={20} />
            My Apps
          </Link>

          {isAdmin && (
            <>
              <div className="mt-6 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Admin</div>
              <Link href="/admin" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
                <Users size={20} />
                Overview
              </Link>
            </>
          )}

        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-800">
          <div className="mb-4 px-3">
            <div className="text-sm font-medium text-white">{user.email}</div>
            <div className="text-xs text-gray-500">{user.role}</div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-red-400 hover:bg-red-950/50 hover:text-red-300 transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="h-16 flex items-center justify-between px-8 border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl sticky top-0 z-10">
          <h2 className="text-lg font-medium text-white">Workspace</h2>
        </div>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
