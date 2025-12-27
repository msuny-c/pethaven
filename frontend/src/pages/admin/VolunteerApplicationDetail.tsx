import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { VolunteerApplication, UserProfile } from '../../types';
import { decideVolunteerApplication, getUsers, getVolunteerApplication } from '../../services/api';
import { Check, X, Clock, Phone, Mail } from 'lucide-react';

export function AdminVolunteerApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const appId = Number(id);
  const [application, setApplication] = useState<VolunteerApplication | null>(null);
  const [users, setUsers] = useState<Record<number, UserProfile>>({});
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!appId) return;
      const [app, usersList] = await Promise.all([getVolunteerApplication(appId), getUsers()]);
      const map: Record<number, UserProfile> = {};
      usersList.forEach((u) => (map[u.id] = u));
      setUsers(map);
      setApplication(app);
      setComment(app.decisionComment || '');
    };
    load();
  }, [appId]);

  const decide = async (status: VolunteerApplication['status']) => {
    if (!application) return;
    setLoading(true);
    try {
      await decideVolunteerApplication(application.id, status, comment);
      setApplication({ ...application, status, decisionComment: comment });
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Не удалось обновить заявку';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!appId) {
    return (
      <DashboardLayout title="Анкета волонтёра">
        <div className="p-6 text-gray-500">Анкета не найдена</div>
      </DashboardLayout>
    );
  }

  if (!application) {
    return (
      <DashboardLayout title="Анкета волонтёра">
        <div className="p-6 text-gray-500">Загрузка...</div>
      </DashboardLayout>
    );
  }

  const person = users[application.personId];
  const status = application.status;
  const isFinal = status === 'approved' || status === 'rejected';

  return (
    <DashboardLayout
      title="Анкета волонтёра"
      actions={
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300"
        >
          Назад
        </button>
      }
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-lg font-bold text-gray-900">
              {application.firstName || person?.firstName || '—'} {application.lastName || person?.lastName || ''}
            </div>
            <div className="text-sm text-gray-500">Анкета #{application.id}</div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                status === 'approved'
                  ? 'bg-green-100 text-green-700'
                  : status === 'rejected'
                    ? 'bg-red-100 text-red-700'
                    : status === 'under_review'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
              }`}
            >
              {status === 'approved'
                ? 'Одобрена'
                : status === 'rejected'
                  ? 'Отклонена'
                  : status === 'under_review'
                    ? 'В работе'
                    : 'Отправлена'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-100 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Контакты</div>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                {application.email || person?.email || '—'}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                {application.phone || person?.phoneNumber || '—'}
              </div>
            </div>
          </div>
          <div className="p-4 border border-gray-100 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Доступность</div>
            <div className="text-sm text-gray-800">{application.availability || 'Не указана'}</div>
          </div>
        </div>

        <div className="p-4 border border-gray-100 rounded-lg">
          <div className="text-xs text-gray-500 mb-2">Мотивация</div>
          <div className="text-sm text-gray-800 whitespace-pre-line">{application.motivation}</div>
        </div>

        <div className="space-y-3">
          <label className="text-xs text-gray-500 block">Комментарий решения</label>
          <textarea
            className="w-full rounded-lg border-gray-200 px-3 py-2 text-sm focus:ring-amber-500 focus:border-amber-500"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isFinal}
          />
          <div className="flex flex-wrap gap-2 justify-end">
            {!isFinal && (
              <>
                {status === 'submitted' && (
                  <button
                    onClick={() => decide('under_review')}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 disabled:opacity-50"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    В работу
                  </button>
                )}
                <button
                  onClick={() => decide('approved')}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 disabled:opacity-50"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Одобрить
                </button>
                <button
                  onClick={() => decide('rejected')}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 disabled:opacity-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Отклонить
                </button>
              </>
            )}
            {isFinal && <span className="text-xs text-gray-500">Решение зафиксировано</span>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
