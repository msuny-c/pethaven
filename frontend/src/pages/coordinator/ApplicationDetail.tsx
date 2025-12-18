import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Application, Animal, UserProfile } from '../../types';
import { getAnimal, getApplicationById, getUsers, updateApplicationStatus, scheduleInterview } from '../../services/api';
import { ArrowLeft, Calendar, PawPrint, Mail, Phone, User, Check, X, CalendarPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function CoordinatorApplicationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [candidate, setCandidate] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [scheduleState, setScheduleState] = useState<{ datetime: string }>({ datetime: '' });
  const [decisionComment, setDecisionComment] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const app = await getApplicationById(Number(id));
        setApplication(app);
        setDecisionComment(app.decisionComment || '');
        const [pet, users] = await Promise.all([getAnimal(app.animalId), getUsers()]);
        setAnimal(pet);
        setCandidate(users.find((u) => u.id === app.candidateId) || null);
      } catch (e) {
        console.error(e);
        setError('Не удалось загрузить заявку');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const candidateName = useMemo(() => {
    if (!candidate) return `Кандидат #${application?.candidateId || ''}`;
    return `${candidate.firstName} ${candidate.lastName}`.trim();
  }, [candidate, application]);

  const statusLabel = (status: Application['status']) => {
    switch (status) {
      case 'approved':
        return { text: 'Одобрена', className: 'bg-green-100 text-green-700' };
      case 'rejected':
        return { text: 'Отклонена', className: 'bg-red-100 text-red-700' };
      case 'under_review':
        return { text: 'На рассмотрении', className: 'bg-indigo-100 text-indigo-700' };
      default:
        return { text: 'Новая', className: 'bg-blue-100 text-blue-700' };
    }
  };

  const status = statusLabel(application?.status || 'submitted');
  const canAct = application && application.status !== 'approved' && application.status !== 'rejected';
  const toOffsetIso = (localValue: string) => {
    const value = localValue.length === 16 ? `${localValue}:00` : localValue;
    const date = new Date(value);
    const tz = -date.getTimezoneOffset();
    const sign = tz >= 0 ? '+' : '-';
    const hh = String(Math.floor(Math.abs(tz) / 60)).padStart(2, '0');
    const mm = String(Math.abs(tz) % 60).padStart(2, '0');
    return `${value}${sign}${hh}:${mm}`;
  };
  return (
    <DashboardLayout
      title="Заявка"
      actions={
        <Link to="/coordinator/applications" className="flex items-center text-gray-600 hover:text-gray-900 text-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к списку
        </Link>
      }
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading && <div className="p-8 text-center text-gray-500">Загрузка...</div>}
        {error && <div className="p-8 text-center text-red-500">{error}</div>}
        {!loading && !error && application && (
          <>
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-gray-900">Заявка №{application.id}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.className}`}>{status.text}</span>
                </div>
                <div className="flex flex-wrap items-center text-sm text-gray-500 gap-4">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {candidateName}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {application.createdAt ? new Date(application.createdAt).toLocaleString() : '—'}
                  </div>
                  <div className="flex items-center">
                    <PawPrint className="w-4 h-4 mr-1" />
                    {animal?.name || `Питомец #${application.animalId}`}
                  </div>
                </div>
              </div>
              {animal && (
                <img
                  src={(animal.photos && animal.photos[0]) || 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=140&q=80'}
                  alt={animal.name}
                  className="w-24 h-24 rounded-xl object-cover border border-gray-100"
                />
              )}
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Ответы кандидата</h3>
                  <div className="space-y-3">
                    <Field label="Причина адопции" value={application.reason || application.details?.reason} />
                    <Field label="Опыт с животными" value={application.experience || application.details?.experience} />
                    <Field label="Жилищные условия" value={application.housing || application.details?.housing} />
                  </div>
                </div>
                <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Комментарий координатора</h3>
                  <p className="text-sm text-gray-700">{application.decisionComment || 'Комментариев нет'}</p>
                </div>
              </div>

              <div className="space-y-4">
                {canAct && (
                  <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm space-y-3">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase">Действия</h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={async () => {
                          if (!application || !decisionComment.trim()) return;
                          setDecisionLoading(true);
                          await updateApplicationStatus(application.id, 'approved', decisionComment.trim());
                          setApplication({ ...application, status: 'approved', decisionComment: decisionComment.trim() });
                          setDecisionLoading(false);
                        }}
                        disabled={decisionLoading || !decisionComment.trim()}
                        className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4 mr-2" /> Одобрить
                      </button>
                      <button
                        onClick={async () => {
                          if (!application || !decisionComment.trim()) return;
                          setDecisionLoading(true);
                          await updateApplicationStatus(application.id, 'rejected', decisionComment.trim());
                          setApplication({ ...application, status: 'rejected', decisionComment: decisionComment.trim() });
                          setDecisionLoading(false);
                        }}
                        disabled={decisionLoading || !decisionComment.trim()}
                        className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50"
                      >
                        <X className="w-4 h-4 mr-2" /> Отклонить
                      </button>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Комментарий координатора</label>
                      <textarea
                        className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500 text-sm"
                        rows={3}
                        value={decisionComment}
                        onChange={(e) => setDecisionComment(e.target.value)}
                        placeholder="Обоснование решения"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-gray-500">Назначить интервью</label>
                      <div className="flex flex-col space-y-2">
                        <div className="relative">
                          <input
                            type="datetime-local"
                            min={new Date().toISOString().slice(0, 16)}
                            className="rounded-xl border border-amber-200 bg-amber-50/60 shadow-inner px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 w-full"
                            value={scheduleState.datetime}
                            onChange={(e) => setScheduleState((s) => ({ ...s, datetime: e.target.value }))}
                          />
                          <Calendar className="w-4 h-4 text-amber-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        <button
                          onClick={async () => {
                            if (!application || !scheduleState.datetime) return;
                            try {
                              const isoWithOffset = toOffsetIso(scheduleState.datetime);
                              await scheduleInterview(application.id, isoWithOffset);
                              setScheduleState({ datetime: '' });
                              setApplication({ ...application, status: 'under_review' });
                              alert('Интервью назначено');
                            } catch (e: any) {
                              const msg = e?.response?.data?.message || 'Не удалось назначить интервью';
                              alert(msg);
                            }
                          }}
                          className="inline-flex items-center justify-center px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600"
                        >
                          <CalendarPlus className="w-4 h-4 mr-2" /> Назначить
                        </button>
                        <p className="text-xs text-gray-500">Интервьюер: {user?.firstName} {user?.lastName}</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Контакты кандидата</h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-gray-400 mr-2" />
                      {candidate?.email || '—'}
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      {candidate?.phoneNumber || '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{value || '—'}</p>
    </div>
  );
}
