import React from 'react';
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
  return <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="pl-64">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20 px-8 py-4 flex justify-between items-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <div className="flex items-center space-x-6">
            <Notifications />
            {actions}
          </div>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>;
}