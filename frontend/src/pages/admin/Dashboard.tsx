import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { StatCard } from '../../components/dashboard/StatCard';
import { Users, PawPrint, FileText, AlertCircle } from 'lucide-react';
import { getAnimals, getUsers, getApplications, getNotifications } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Notification } from '../../types';
import { Link } from 'react-router-dom';
export function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState([{
    title: 'Всего пользователей',
    value: 0,
    icon: Users,
    color: 'bg-blue-500'
  }, {
    title: 'Животных в приюте',
    value: 0,
    icon: PawPrint,
    color: 'bg-amber-500'
  }, {
    title: 'Активных заявок',
    value: 0,
    icon: FileText,
    color: 'bg-green-500'
  }, {
    title: 'На карантине',
    value: 0,
    icon: AlertCircle,
    color: 'bg-red-500'
  }]);

  const [activity, setActivity] = useState<Notification[]>([]);

  useEffect(() => {
    Promise.all([getUsers(), getAnimals(), getApplications()]).then(([usersData, animalsData, apps]) => {
      setStats(current => {
        const copy = [...current];
        copy[0] = { ...copy[0], value: usersData.length };
        copy[1] = { ...copy[1], value: animalsData.length };
        copy[2] = { ...copy[2], value: apps.filter(a => a.status === 'submitted').length };
        copy[3] = { ...copy[3], value: animalsData.filter(a => a.status === 'quarantine').length };
        return copy;
      });
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    getNotifications().then(setActivity).catch(() => setActivity([]));
  }, [user]);
  return <DashboardLayout title="Панель администратора">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => <StatCard key={i} {...stat} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Последние действия
          </h3>
          {activity.length > 0 ? <div className="space-y-4">
              {activity.slice(0, 5).map(item => <div key={item.id} className="flex items-start pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 mr-3"></div>
                    <div>
                      <p className="text-sm text-gray-900">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>)}
            </div> : <div className="text-sm text-gray-500">Пока нет событий</div>}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-between">
            <div>
              <div className="font-semibold text-amber-800">Заявки волонтёров</div>
              <div className="text-sm text-amber-700">Проверьте анкеты и назначьте наставника</div>
            </div>
            <Link to="/admin/volunteers" className="px-3 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600">
              Открыть
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>;
}
