import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Users, PawPrint, FileText, Calendar, ClipboardList, Activity, LogOut, Home, Settings, FileCheck, User } from 'lucide-react';
import { PersonAvatar } from '../PersonAvatar';
interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}
export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const { user, primaryRole, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const isActive = (path: string) => location.pathname === path;
  const getLinks = () => {
    switch (primaryRole) {
      case 'admin':
        return [{
          path: '/admin/dashboard',
          label: 'Обзор',
          icon: LayoutDashboard
        }, {
          path: '/admin/volunteers',
          label: 'Волонтёры',
          icon: Users
        }, {
          path: '/admin/users',
          label: 'Пользователи',
          icon: Users
        }, {
          path: '/admin/animals',
          label: 'Животные',
          icon: PawPrint
        }, {
          path: '/admin/settings',
          label: 'Настройки',
          icon: Settings
        }, {
          path: '/profile',
          label: 'Профиль',
          icon: User
        }];
      case 'coordinator':
        return [{
          path: '/coordinator/dashboard',
          label: 'Обзор',
          icon: LayoutDashboard
        }, {
          path: '/coordinator/applications',
          label: 'Заявки',
          icon: FileText
        }, {
          path: '/coordinator/interviews',
          label: 'Интервью',
          icon: Calendar
        }, {
          path: '/coordinator/transfers',
          label: 'Передачи',
          icon: ClipboardList
        }, {
          path: '/coordinator/post-adoption',
          label: 'Постсопровождение',
          icon: Activity
        }, {
          path: '/coordinator/animals',
          label: 'Животные',
          icon: PawPrint
        }, {
          path: '/coordinator/tasks',
          label: 'Задачи',
          icon: ClipboardList
        }, {
          path: '/coordinator/shift-management',
          label: 'Смены',
          icon: Calendar
        }, {
          path: '/profile',
          label: 'Профиль',
          icon: Settings
        }];
      case 'veterinar':
        return [{
          path: '/veterinar/dashboard',
          label: 'Обзор',
          icon: LayoutDashboard
        }, {
          path: '/veterinar/animals',
          label: 'Животные',
          icon: PawPrint
        }, {
          path: '/profile',
          label: 'Профиль',
          icon: Settings
        }];
      case 'volunteer':
        return [{
          path: '/volunteer/dashboard',
          label: 'Обзор',
          icon: LayoutDashboard
        }, {
          path: '/volunteer/animals',
          label: 'Животные',
          icon: PawPrint
        }, {
          path: '/volunteer/shifts',
          label: 'Смены',
          icon: Calendar
        }, {
          path: '/profile',
          label: 'Профиль',
          icon: Settings
        }];
      case 'candidate':
        return [{
          path: '/candidate/dashboard',
          label: 'Обзор',
          icon: LayoutDashboard
        }, {
          path: '/candidate/applications',
          label: 'Мои заявки',
          icon: FileText
        }, {
          path: '/candidate/agreements',
          label: 'Договоры',
          icon: FileText
        }, {
          path: '/candidate/animals',
          label: 'Животные',
          icon: PawPrint
        }, {
          path: '/candidate/reports',
          label: 'Отчёты',
          icon: FileCheck
        }, {
          path: '/candidate/profile',
          label: 'Профиль',
          icon: Settings
        }];
      default:
        return [];
    }
  };
  const roleLabels: Record<string, string> = {
    admin: 'Администратор',
    coordinator: 'Координатор',
    volunteer: 'Волонтер',
    candidate: 'Кандидат',
    veterinar: 'Ветеринар'
  };
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.email || 'Пользователь';
  const roleLabel = primaryRole ? (roleLabels[primaryRole] || primaryRole) : 'Роль не указана';
  return <div className={`${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200 w-64 bg-gray-900 text-white min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-30 md:translate-x-0`}>
      <div className="p-6 flex items-center space-x-3 border-b border-gray-800">
        <div className="bg-amber-500 p-1.5 rounded-lg">
          <PawPrint className="h-6 w-6 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight">Pet Haven</span>
      </div>

      <div className="p-4">
        <div className="flex items-center space-x-3 mb-6 px-2">
          <PersonAvatar src={user?.avatarUrl} name={displayName} className="border-2 border-amber-500" />
          <div>
            <div className="font-medium text-sm">{displayName}</div>
            <div className="text-xs text-gray-400 capitalize">
              {roleLabel}
            </div>
          </div>
        </div>

        <nav className="space-y-1">
          {getLinks().map(link => <Link key={link.path} to={link.path} className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(link.path) ? 'bg-amber-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              <link.icon className="w-5 h-5 mr-3" />
              {link.label}
            </Link>)}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-gray-800 space-y-1">
        <Link to="/" className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
          <Home className="w-5 h-5 mr-3" />
          На сайт
        </Link>
        <button onClick={handleLogout} className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-gray-800 transition-colors">
          <LogOut className="w-5 h-5 mr-3" />
          Выйти
        </button>
      </div>
    </div>;
}
