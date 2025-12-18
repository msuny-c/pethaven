import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getVolunteerApplications } from '../../services/api';
import { VolunteerApplication } from '../../types';

export function VolunteerPending() {
  const [latest, setLatest] = useState<VolunteerApplication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVolunteerApplications().then(apps => {
      const sorted = [...apps].sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
      setLatest(sorted[0] || null);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Заявка волонтера">
      <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-6 max-w-3xl">
        <div className="flex items-center space-x-3 mb-4">
          {latest?.status === 'approved' ? (
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          )}
          <div>
            <h3 className="text-lg font-bold text-gray-900">Статус волонтерской заявки</h3>
            <p className="text-sm text-gray-600">
              Функции волонтера станут доступны после одобрения администратором.
            </p>
          </div>
        </div>

        {loading && <p className="text-gray-500">Загружаем данные...</p>}
        {!loading && (
          <div className="space-y-2 text-gray-800">
            <p>
              Текущий статус:&nbsp;
              <span className="font-semibold">
                {latest?.status === 'approved'
                  ? 'Одобрена'
                  : latest?.status === 'rejected'
                    ? 'Отклонена'
                    : latest?.status === 'under_review'
                      ? 'На рассмотрении'
                      : 'Отправлена'}
              </span>
            </p>
            {latest?.decisionComment && (
              <p className="text-sm text-gray-600">Комментарий: {latest.decisionComment}</p>
            )}
            {!latest && (
              <p className="text-sm text-gray-600">
                Активная заявка не найдена. Если вы только что отправили анкету, подождите пару минут.
              </p>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
