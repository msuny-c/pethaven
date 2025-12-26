import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { StatCard } from '../../components/dashboard/StatCard';
import { FileText, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getApplications, getNotifications } from '../../services/api';
import { Application, Notification } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
export function CandidateDashboard() {
  const {
    user
  } = useAuth();
  const [myApps, setMyApps] = useState<Application[]>([]);
  const [myNotifications, setMyNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (user) {
      getApplications().then(apps => setMyApps(apps.filter(a => a.candidateId === user.id)));
      getNotifications().then(setMyNotifications);
    }
  }, [user]);
  return <DashboardLayout title="Личный кабинет">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatCard title="Мои заявки" value={myApps.length} icon={FileText} color="bg-blue-500" />
        <StatCard title="Уведомления" value={myNotifications.filter(n => !n.read).length} icon={Bell} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Статус заявок
          </h3>
          {myApps.length > 0 ? <div className="space-y-4">
              {myApps.map(app => <div key={app.id} className="p-4 border border-gray-100 rounded-lg flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">
                      Заявка на животное #{app.animalId}
                    </div>
                    <div className="text-sm text-gray-500">{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : ''}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${app.status === 'approved' ? 'bg-green-100 text-green-700' : app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {app.status === 'submitted'
                      ? 'Отправлено'
                      : app.status === 'under_review'
                        ? 'На рассмотрении'
                        : app.status === 'approved'
                          ? 'Одобрено'
                          : app.status === 'cancelled'
                            ? 'Отменено'
                            : 'Отклонено'}
                  </span>
                </div>)}
            </div> : <p className="text-gray-500">У вас пока нет активных заявок</p>}
          <div className="mt-4">
            <Link to="/candidate/animals" className="text-amber-600 font-medium hover:underline text-sm">
              Перейти в каталог животных →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Последние уведомления
          </h3>
          <div className="space-y-4">
            {myNotifications.slice(0, 3).map(notification => <div key={notification.id} className="flex items-start">
                <div className="w-2 h-2 mt-2 rounded-full mr-3 bg-blue-500"></div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </div>
                  <div className="text-sm text-gray-600">
                    {notification.message}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ''}
                  </div>
                </div>
              </div>)}
          </div>
        </div>
      </div>
    </DashboardLayout>;
}
