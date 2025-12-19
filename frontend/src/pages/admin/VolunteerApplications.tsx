import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Check, X, Clock } from 'lucide-react';
import { VolunteerApplication, UserProfile } from '../../types';
import { decideVolunteerApplication, getVolunteerApplications, getUsers } from '../../services/api';

export function AdminVolunteerApplications() {
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<Record<number, boolean>>({});
  const [users, setUsers] = useState<Record<number, UserProfile>>({});

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const [apps, usersList] = await Promise.all([getVolunteerApplications(), getUsers()]);
      const map: Record<number, UserProfile> = {};
      usersList.forEach((u) => {
        map[u.id] = u;
      });
      setApplications(apps);
      setUsers(map);
    } finally {
      setLoading(false);
    }
  };

  const decide = async (id: number, status: VolunteerApplication['status']) => {
    setBusy((prev) => ({ ...prev, [id]: true }));
    try {
      await decideVolunteerApplication(id, status, comment[id]);
      await refresh();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Не удалось обновить заявку';
      alert(msg);
    } finally {
      setBusy((prev) => ({ ...prev, [id]: false }));
    }
  };

  const statusChip = (status: VolunteerApplication['status']) => {
    switch (status) {
      case 'approved':
        return { text: 'Одобрена', className: 'bg-green-100 text-green-700' };
      case 'rejected':
        return { text: 'Отклонена', className: 'bg-red-100 text-red-700' };
      case 'under_review':
        return { text: 'На рассмотрении', className: 'bg-blue-100 text-blue-700' };
      default:
        return { text: 'Отправлена', className: 'bg-amber-100 text-amber-700' };
    }
  };

  return (
    <DashboardLayout title="Заявки волонтёров">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">Новые анкеты</h3>
            <p className="text-sm text-gray-500">Проверьте мотивацию и примите решение</p>
          </div>
          {loading && <span className="text-sm text-gray-500">Обновляем...</span>}
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-3">Волонтёр</th>
              <th className="px-6 py-3">Мотивация</th>
              <th className="px-6 py-3">Статус</th>
              <th className="px-6 py-3">Комментарий</th>
              <th className="px-6 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {applications.map((app) => {
              const chip = statusChip(app.status);
              const person = users[app.personId];
              const isFinal = app.status === 'approved' || app.status === 'rejected';
              return (
                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {person ? `${person.firstName} ${person.lastName}` : `Волонтёр #${app.personId}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      Email: {person?.email || '—'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Телефон: {person?.phoneNumber || '—'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Доступность: {app.availability || 'не указана'}
                    </div>
                    {app.createdAt && (
                      <div className="text-xs text-gray-400">Создано: {new Date(app.createdAt).toLocaleString()}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{app.motivation}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${chip.className}`}>
                      {chip.text}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      placeholder="Комментарий решения"
                      value={comment[app.id] || app.decisionComment || ''}
                      onChange={(e) => setComment((prev) => ({ ...prev, [app.id]: e.target.value }))}
                      disabled={isFinal}
                      className="w-full rounded-lg border-gray-200 px-3 py-2 text-sm focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-50"
                    />
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {!isFinal ? (
                      <>
                        <button
                          onClick={() => decide(app.id, 'approved')}
                          disabled={!!busy[app.id]}
                          className="inline-flex items-center px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 disabled:opacity-50"
                        >
                          <Check className="w-4 h-4 mr-1" /> Одобрить
                        </button>
                        <button
                          onClick={() => decide(app.id, 'rejected')}
                          disabled={!!busy[app.id]}
                          className="inline-flex items-center px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 disabled:opacity-50"
                        >
                          <X className="w-4 h-4 mr-1" /> Отклонить
                        </button>
                        {app.status === 'submitted' && (
                          <button
                            onClick={() => decide(app.id, 'under_review')}
                            disabled={!!busy[app.id]}
                            className="inline-flex items-center px-3 py-1 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 disabled:opacity-50"
                          >
                            <Clock className="w-4 h-4 mr-1" /> В работу
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-gray-500">Решение зафиксировано</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {applications.length === 0 && (
              <tr>
                <td className="px-6 py-6 text-center text-gray-500" colSpan={5}>
                  Нет заявок в очереди
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
