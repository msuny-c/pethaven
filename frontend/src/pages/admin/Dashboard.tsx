import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { StatCard } from '../../components/dashboard/StatCard';
import { TrendingUp, PawPrint, CheckCircle, Calendar } from 'lucide-react';
import { getAnimals, getApplications, getShifts, getUsers } from '../../services/api';
import { Animal, Application, UserProfile } from '../../types';

export function AdminDashboard() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [shifts, setShifts] = useState<number>(0);

  useEffect(() => {
    Promise.all([getAnimals(), getApplications(), getUsers(), getShifts()]).then(
      ([animalsData, apps, usersData, shiftsData]) => {
        setAnimals(animalsData);
        setApplications(apps);
        setUsers(usersData);
        setShifts(shiftsData.length);
      }
    );
  }, []);

  const adoptionRate = useMemo(() => {
    if (animals.length === 0) return '0';
    const adopted = animals.filter((a) => a.status === 'adopted').length;
    return ((adopted / animals.length) * 100).toFixed(0);
  }, [animals]);

  const statsAnimals = useMemo(() => {
    const translate = (status: Animal['status']) => {
      switch (status) {
        case 'available':
          return 'Доступен';
        case 'quarantine':
          return 'Карантин';
        case 'reserved':
          return 'Зарезервирован';
        case 'adopted':
          return 'Пристроен';
        default:
          return status;
      }
    };
    const counts: Record<string, number> = {};
    animals.forEach((a) => {
      const key = translate(a.status);
      counts[key] = (counts[key] || 0) + 1;
    });
    return {
      available: animals.filter((a) => a.status === 'available').length,
      quarantine: animals.filter((a) => a.status === 'quarantine').length,
      reserved: animals.filter((a) => a.status === 'reserved').length,
      adopted: animals.filter((a) => a.status === 'adopted').length,
      labels: counts
    };
  }, [animals]);

  const statsApplications = useMemo(
    () => ({
      submitted: applications.filter((a) => a.status === 'submitted').length,
      review: applications.filter((a) => a.status === 'under_review').length,
      approved: applications.filter((a) => a.status === 'approved').length,
      rejected: applications.filter((a) => a.status === 'rejected').length
    }),
    [applications]
  );

  const volunteers = users.filter((u) => u.roles.includes('volunteer')).length;

  return (
    <DashboardLayout title="Обзор">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Всего животных"
          value={animals.length}
          icon={PawPrint}
          color="bg-amber-500"
          trend={`Доступны: ${statsAnimals.available}`}
        />
        <StatCard
          title="Успешных адопций"
          value={`${adoptionRate}%`}
          icon={CheckCircle}
          color="bg-green-500"
          trend={`Пристроено: ${statsAnimals.adopted}`}
        />
        <StatCard
          title="Активных заявок"
          value={applications.filter((a) => a.status !== 'rejected').length}
          icon={TrendingUp}
          color="bg-blue-500"
        />
        <StatCard title="Волонтёрских смен" value={shifts} icon={Calendar} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Статистика по животным</h3>
          <div className="space-y-4">
            {[
              { label: 'Доступны для адопции', value: statsAnimals.available, color: 'bg-green-500' },
              { label: 'Карантин', value: statsAnimals.quarantine, color: 'bg-red-500' },
              { label: 'Зарезервированы', value: statsAnimals.reserved, color: 'bg-amber-500' },
              { label: 'Пристроены', value: statsAnimals.adopted, color: 'bg-blue-500' }
            ].map((stat, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${stat.color} mr-3`}></div>
                  <span className="text-sm text-gray-600">{stat.label}</span>
                </div>
                <span className="font-bold text-gray-900">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Статистика по заявкам</h3>
          <div className="space-y-4">
            {[
              { label: 'Новые заявки', value: statsApplications.submitted, color: 'bg-blue-500' },
              { label: 'На рассмотрении', value: statsApplications.review, color: 'bg-amber-500' },
              { label: 'Одобрено', value: statsApplications.approved, color: 'bg-green-500' },
              { label: 'Отклонено', value: statsApplications.rejected, color: 'bg-red-500' }
            ].map((stat, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${stat.color} mr-3`}></div>
                  <span className="text-sm text-gray-600">{stat.label}</span>
                </div>
                <span className="font-bold text-gray-900">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Ключевые метрики</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gray-50 rounded-xl">
            <div className="text-3xl font-bold text-gray-900 mb-2">—</div>
            <div className="text-sm text-gray-500">Среднее время обработки заявки</div>
          </div>
          <div className="text-center p-6 bg-gray-50 rounded-xl">
            <div className="text-3xl font-bold text-gray-900 mb-2">{volunteers}</div>
            <div className="text-sm text-gray-500">Активных волонтёров</div>
          </div>
          <div className="text-center p-6 bg-gray-50 rounded-xl">
            <div className="text-3xl font-bold text-gray-900 mb-2">{statsAnimals.adopted}</div>
            <div className="text-sm text-gray-500">Животных пристроено</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
