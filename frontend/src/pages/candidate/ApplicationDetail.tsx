import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Calendar, PawPrint, ArrowLeft, Info, CheckCircle, XCircle } from 'lucide-react';
import { Application, Animal, Interview } from '../../types';
import {
  getAnimal,
  getApplicationById,
  getInterviews,
  confirmInterview,
  cancelAdoptionApplication,
  declineInterview,
  getAgreements
} from '../../services/api';

export function CandidateApplicationDetail() {
  const { id } = useParams();
  const [application, setApplication] = useState<Application | null>(null);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [agreementConfirmed, setAgreementConfirmed] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const app = await getApplicationById(Number(id));
        setApplication(app);
        const [interviewData, pet] = await Promise.all([
          getInterviews(app.id),
          getAnimal(app.animalId)
        ]);
        setInterviews(interviewData);
        setAnimal(pet);
        try {
          const agreements = await getAgreements();
          const match = agreements.find((a) => a.applicationId === app.id);
          setAgreementConfirmed(Boolean(match?.confirmedAt));
        } catch {
          setAgreementConfirmed(false);
        }
      } catch (e) {
        console.error(e);
        setError('Не удалось загрузить заявку');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const statusBadge = (status: Application['status']) => {
    const map: Record<Application['status'], { text: string; className: string }> = {
      submitted: { text: 'Подана', className: 'bg-blue-100 text-blue-700' },
      under_review: { text: 'На рассмотрении', className: 'bg-indigo-100 text-indigo-700' },
      approved: { text: 'Одобрена', className: 'bg-green-100 text-green-700' },
      rejected: { text: 'Отклонена', className: 'bg-red-100 text-red-700' }
    };
    const item = map[status];
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.className}`}>{item.text}</span>;
  };

  const upcomingInterview = interviews
    .filter((i) => i.status === 'scheduled' || i.status === 'confirmed')
    .sort((a, b) => new Date(a.scheduledDatetime).getTime() - new Date(b.scheduledDatetime).getTime())[0];

  const interviewStatusLabel = (status: Interview['status']) => {
    switch (status) {
      case 'scheduled':
        return { text: 'Ожидает подтверждения', className: 'bg-blue-100 text-blue-700' };
      case 'confirmed':
        return { text: 'Подтверждено', className: 'bg-indigo-100 text-indigo-700' };
      case 'completed':
        return { text: 'Проведено', className: 'bg-green-100 text-green-700' };
      case 'cancelled':
      default:
        return { text: 'Отменено', className: 'bg-gray-100 text-gray-600' };
    }
  };

  const handleConfirm = async () => {
    if (!upcomingInterview) return;
    setConfirming(true);
    try {
      await confirmInterview(upcomingInterview.id);
      setInterviews((list) => list.map((i) => (i.id === upcomingInterview.id ? { ...i, status: 'confirmed' } : i)));
    } catch (e) {
      console.error(e);
      alert('Не удалось подтвердить интервью');
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = async () => {
    if (!application) return;
    const reason = prompt('Почему отменяете заявку?');
    setCancelling(true);
    try {
      await cancelAdoptionApplication(application.id, reason || undefined);
      setApplication({ ...application, status: 'rejected', decisionComment: reason || 'Отменено кандидатом' });
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Не удалось отменить заявку';
      alert(msg);
    } finally {
      setCancelling(false);
    }
  };

  const handleDecline = async () => {
    if (!upcomingInterview || !application) return;
    setDeclining(true);
    try {
      await declineInterview(upcomingInterview.id);
      setInterviews((list) => list.map((i) => (i.id === upcomingInterview.id ? { ...i, status: 'cancelled' } : i)));
      setApplication({ ...application, status: 'rejected', decisionComment: 'Кандидат отклонил интервью' });
    } catch (e) {
      alert('Не удалось отказаться от интервью');
    } finally {
      setDeclining(false);
    }
  };

  return (
    <DashboardLayout
      title="Заявка"
      actions={
        <Link
          to="/candidate/applications"
          className="flex items-center text-gray-600 hover:text-gray-900 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к заявкам
        </Link>
      }
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading && <div className="p-8 text-center text-gray-500">Загрузка...</div>}
        {error && <div className="p-8 text-center text-red-500">{error}</div>}
        {!loading && !error && application && (
          <>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900">Заявка №{application.id}</h2>
                  {statusBadge(application.status)}
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-2 space-x-4">
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

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase">Ответы кандидата</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Причина адопции</p>
                  <p className="text-gray-900">{application.reason || application.details?.reason || '—'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Опыт с животными</p>
                  <p className="text-gray-900">{application.experience || application.details?.experience || '—'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Жилищные условия</p>
                  <p className="text-gray-900">{application.housing || application.details?.housing || '—'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase">Статус</h3>
                {application.decisionComment && (
                  <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-900 font-medium mb-2">
                      <Info className="w-4 h-4 text-amber-500" />
                      Последнее решение
                    </div>
                    <p className="text-sm text-gray-700">{application.decisionComment}</p>
                  </div>
                )}
                {(application.status === 'submitted' || application.status === 'under_review') && !agreementConfirmed && (
                  <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-900 font-medium">
                        <XCircle className="w-4 h-4 text-red-500" />
                        Отменить заявку
                      </div>
                      <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 disabled:opacity-50"
                      >
                        {cancelling ? 'Отменяем...' : 'Отменить'}
                      </button>
                    </div>
                  </div>
                )}
                {upcomingInterview && (
                  <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-900 font-medium mb-2">
                      <CheckCircle className="w-4 h-4 text-amber-500" />
                      Ближайшее интервью
                    </div>
                    <div className="flex items-center text-sm text-gray-600 gap-3 mb-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(upcomingInterview.scheduledDatetime).toLocaleString()}
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${interviewStatusLabel(upcomingInterview.status).className}`}>
                      {interviewStatusLabel(upcomingInterview.status).text}
                    </span>
                    {upcomingInterview.status === 'scheduled' && (
                      <div className="mt-3">
                        <button
                          disabled={confirming}
                          onClick={handleConfirm}
                          className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-60"
                        >
                          {confirming ? 'Подтверждаем...' : 'Подтвердить участие'}
                        </button>
                        <button
                          disabled={declining}
                          onClick={handleDecline}
                          className="ml-3 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-60"
                        >
                          {declining ? 'Отказываемся...' : 'Отказаться'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
