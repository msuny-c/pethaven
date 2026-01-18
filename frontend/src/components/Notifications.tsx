import React, { useEffect, useRef, useState } from 'react';
import { Bell, Check, Trash2, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Notification } from '../types';
import { getNotifications, markAllNotificationsRead, markNotificationRead, deleteAllNotifications } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
export function Notifications() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    if (user) {
      getNotifications().then(setNotifications).catch(() => setNotifications([]));
      const apiBase = (import.meta.env.VITE_API_BASE as string | undefined);
      const wsEnv = (import.meta.env.VITE_WS_BASE as string | undefined);
      let wsBase: string;
      if (wsEnv) {
        wsBase = wsEnv;
      } else if (apiBase && apiBase.startsWith('http')) {
        wsBase = new URL(apiBase).origin.replace(/^http/, 'ws');
      } else {
        wsBase = window.location.origin.replace(/^http/, 'ws');
      }
      const ws = new WebSocket(`${wsBase.replace(/\/$/, '')}/ws/notifications?token=${encodeURIComponent(user.accessToken)}`);
      socketRef.current = ws;
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as Notification | { type: string };
          if ((data as any).type === 'connected') return;
          setNotifications(prev => [data as Notification, ...prev]);
        } catch {
          // ignore
        }
      };
      ws.onerror = () => {
        ws.close();
      };
      return () => {
        ws.close();
      };
    }
  }, [user]);
  const unreadCount = notifications.filter(n => !n.read).length;
  const markAsRead = async (id: number) => {
    if (!user) return;
    setNotifications(notifications.map(n => n.id === id ? {
      ...n,
      read: true
    } : n));
    await markNotificationRead(id);
  };
  const markAllAsRead = async () => {
    if (!user) return;
    setNotifications(notifications.map(n => ({
      ...n,
      read: true
    })));
    await markAllNotificationsRead();
  };
  const clearAll = async () => {
    if (!user) return;
    setNotifications([]);
    await deleteAllNotifications();
  };
  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };
  return <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>}
      </button>

      <AnimatePresence>
        {isOpen && <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div initial={{
          opacity: 0,
          y: 10,
          scale: 0.95
        }} animate={{
          opacity: 1,
          y: 0,
          scale: 1
        }} exit={{
          opacity: 0,
          y: 10,
          scale: 0.95
        }} className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-900">Уведомления</h3>
                <div className="flex space-x-2">
                  <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:text-blue-800 font-medium" title="Прочитать все">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={clearAll} className="text-xs text-gray-500 hover:text-red-600" title="Очистить">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? <div className="divide-y divide-gray-50">
                    {notifications.map(notification => <div key={notification.id} className={`p-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50/50' : ''}`} onClick={() => markAsRead(notification.id)}>
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mr-3 mt-1">
                            {getIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className={`text-sm font-medium ${!notification.read ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
                                {notification.title}
                              </h4>
                              <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ''}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 leading-snug">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 ml-2"></div>}
                        </div>
                      </div>)}
                  </div> : <div className="p-8 text-center text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Нет новых уведомлений</p>
                  </div>}
              </div>
            </motion.div>
          </>}
      </AnimatePresence>
    </div>;
}
