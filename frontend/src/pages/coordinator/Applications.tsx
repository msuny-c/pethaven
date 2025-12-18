import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Check, X, User, FileText, Calendar } from 'lucide-react';
import { ApplicationReviewModal } from '../../components/modals/ApplicationReviewModal';
import { Application, Animal, UserProfile } from '../../types';
import { getApplications, getAnimals, getUsers, updateApplicationStatus, scheduleInterview } from '../../services/api';
export function CoordinatorApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [animalMap, setAnimalMap] = useState<Record<number, Animal>>({});
  const [userMap, setUserMap] = useState<Record<number, UserProfile>>({});
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [modalType, setModalType] = useState<'approve' | 'reject'>('approve');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scheduleFor, setScheduleFor] = useState<number | null>(null);
  const [scheduleDatetime, setScheduleDatetime] = useState('');
  const [savingSchedule, setSavingSchedule] = useState(false);
  useEffect(() => {
    Promise.all([getApplications(), getAnimals(), getUsers()]).then(([apps, animals, users]) => {
      setApplications(apps);
      const map: Record<number, Animal> = {};
      animals.forEach(a => map[a.id] = a);
      setAnimalMap(map);
      const uMap: Record<number, UserProfile> = {};
      users.forEach(u => uMap[u.id] = u);
      setUserMap(uMap);
    });
  }, []);
  const handleAction = (id: number, type: 'approve' | 'reject') => {
    setSelectedAppId(id);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleSchedule = async () => {
    if (!scheduleFor || !scheduleDatetime) return;
    setSavingSchedule(true);
    try {
      const isoWithOffset = toOffsetIso(scheduleDatetime);
      await scheduleInterview(scheduleFor, isoWithOffset);
      setScheduleFor(null);
      setScheduleDatetime('');
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Не удалось назначить интервью';
      alert(msg);
    } finally {
      setSavingSchedule(false);
    }
  };
  const handleConfirm = (status: 'approved' | 'rejected', notes: string) => {
    if (selectedAppId) {
      updateApplicationStatus(selectedAppId, status, notes).then(() => {
        setApplications(apps => apps.map(app => app.id === selectedAppId ? {
          ...app,
          status,
          notes
        } : app));
      });
    }
    setIsModalOpen(false);
  };
  return <DashboardLayout title="Заявки на адопцию">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-3">Кандидат</th>
              <th className="px-6 py-3">Животное</th>
              <th className="px-6 py-3">Дата</th>
              <th className="px-6 py-3">Статус</th>
              <th className="px-6 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {applications.map(app => {
            const animal = animalMap[app.animalId];
            const user = userMap[app.candidateId];
            return <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/coordinator/candidate/${app.candidateId}`} className="group flex items-center">
                      <div className="p-2 bg-gray-100 rounded-full mr-3 group-hover:bg-amber-100 transition-colors">
                        <User className="w-4 h-4 text-gray-500 group-hover:text-amber-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 group-hover:text-amber-600 transition-colors">
                          {(user?.firstName || user?.lastName) ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() : `Кандидат #${app.candidateId}`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user?.email || app.details?.email || ''}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <img src={(animal?.photos && animal.photos[0]) || 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=100&q=80'} alt="" className="w-8 h-8 rounded-full object-cover mr-2" />
                      <span className="text-sm text-gray-900">
                        {animal?.name || `Животное #${app.animalId}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : ''}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${app.status === 'approved' ? 'bg-green-100 text-green-800' : app.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                      {app.status === 'submitted' ? 'Новая' : app.status === 'under_review' ? 'На рассмотрении' : app.status === 'approved' ? 'Одобрена' : 'Отклонена'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end space-x-2">
                    <Link to={`/coordinator/applications/${app.id}`} className="p-1 text-gray-400 hover:text-amber-600" title="Страница заявки">
                      <FileText className="w-5 h-5" />
                    </Link>
                    {app.status !== 'approved' && app.status !== 'rejected' && (
                      <button
                        onClick={() => setScheduleFor(app.id)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Назначить интервью"
                      >
                        <Calendar className="w-5 h-5" />
                      </button>
                    )}
                    {app.status === 'submitted' && <>
                        <button onClick={() => handleAction(app.id, 'approve')} className="p-1 text-gray-400 hover:text-green-600" title="Одобрить">
                          <Check className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleAction(app.id, 'reject')} className="p-1 text-gray-400 hover:text-red-600" title="Отклонить">
                          <X className="w-5 h-5" />
                        </button>
                      </>}
                  </td>
                </tr>;
          })}
          </tbody>
        </table>
      </div>

      <ApplicationReviewModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleConfirm} type={modalType} />

      {scheduleFor && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Назначить интервью для заявки #{scheduleFor}</h3>
              <button onClick={() => setScheduleFor(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Дата и время</label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full rounded-xl border border-amber-200 bg-amber-50/60 shadow-inner px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    value={scheduleDatetime}
                    onChange={(e) => setScheduleDatetime(e.target.value)}
                  />
                  <Calendar className="w-4 h-4 text-amber-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Время указывается в часовом поясе браузера</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setScheduleFor(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700">Отмена</button>
              <button
                onClick={handleSchedule}
                disabled={savingSchedule}
                className="px-4 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 disabled:opacity-50"
              >
                {savingSchedule ? 'Сохраняем...' : 'Назначить'}
              </button>
            </div>
          </div>
        </div>}
    </DashboardLayout>;
}

function toOffsetIso(localValue: string) {
  // localValue: "YYYY-MM-DDTHH:MM" (datetime-local)
  const value = localValue.length === 16 ? `${localValue}:00` : localValue;
  const date = new Date(value);
  const tz = -date.getTimezoneOffset();
  const sign = tz >= 0 ? '+' : '-';
  const hh = String(Math.floor(Math.abs(tz) / 60)).padStart(2, '0');
  const mm = String(Math.abs(tz) % 60).padStart(2, '0');
  return `${value}${sign}${hh}:${mm}`;
}
