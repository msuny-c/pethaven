import React, { useState, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Notifications } from '../Notifications';
interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  actions?: ReactNode;
}
export function DashboardLayout({
  children,
  title,
  actions
}: DashboardLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="min-h-screen bg-gray-50">
      <div className="md:hidden fixed inset-0 z-40" style={{ pointerEvents: menuOpen ? 'auto' : 'none' }}>
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMenuOpen(false)}
        />
        <Sidebar isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      </div>
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="md:pl-64">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 text-gray-600"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="sr-only">Меню</span>
              ☰
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h1>
          </div>
          <div className="flex items-center space-x-4 md:space-x-6">
            <Notifications />
            {actions}
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>;
}
