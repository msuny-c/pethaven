import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Calendar, Clock, ArrowLeft, PawPrint, User, Mail, Phone, CheckCircle, XCircle } from 'lucide-react';
import { Application, Animal, Interview, UserProfile } from '../../types';
import { ConfirmModal } from '../../components/modals/ConfirmModal';
import { InterviewCompleteModal } from '../../components/modals/InterviewCompleteModal';
import { getAllInterviews, getAnimals, getApplications, getUsers, updateInterview } from '../../services/api';

export function CoordinatorInterviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const interviewId = useMemo(() => Number(id), [id]);

  const [interview, setInterview] = useState<Interview | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [candidate, setCandidate] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  useEffect(() => {
    setNotFound(false);
    if (!id || Number.isNaN(interviewId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([getAllInterviews(), getApplications(), getAnimals(), getUsers()])
      .then(([interviewsData, apps, animalsData, usersData]) => {
        const foundInterview = interviewsData.find((i) => i.id === interviewId);
        if (!foundInterview) {
          setNotFound(true);
          return;
        }
        setInterview(foundInterview);
        const foundApplication = apps.find((a) => a.id === foundInterview.applicationId) || null;
        setApplication(foundApplication);
        const foundAnimal = foundApplication ? animalsData.find((a) => a.id === foundApplication.animalId) || null : null;
        setAnimal(foundAnimal);
        const foundCandidate = foundApplication ? usersData.find((u) => u.id === foundApplication.candidateId) || null : null;
        setCandidate(foundCandidate);
      })
      .finally(() => setLoading(false));
  }, [id, interviewId]);

  const interviewDate = interview ? new Date(interview.scheduledDatetime) : null;
  const statusBadge = interview
    ? interview.status === 'scheduled'
      ? { text: 'Запланировано', className: 'bg-blue-100 text-blue-700' }
      : interview.status === 'confirmed'
        ? { text: 'Подтверждено', className: 'bg-indigo-100 text-indigo-700' }
        : interview.status === 'completed'
          ? { text: 'Проведено', className: 'bg-green-100 text-green-700' }
          : { text: 'Отменено', className: 'bg-gray-100 text-gray-700' }
    : null;

  const refreshInterview = async () => {
    const refreshed = await getAllInterviews();
    const next = refreshed.find((i) => i.id === interviewId) || null;
    setInterview(next);
  };

  const onCompleteConfirm = (outcome: 'approved' | 'rejected', notes: string) => {
    if (!interview) return;
    updateInterview(interview.id, 'completed', notes, outcome === 'approved' ? interview.applicationId : undefined).then(async () => {
      await refreshInterview();
      alert('Интервью успешно завершено!');
    });
  };

  const onCancelConfirm = () => {
    if (!interview) return;
    updateInterview(interview.id, 'cancelled', 'Отмена координатором').then(async () => {
      await refreshInterview();
      alert('Интервью отменено.');
    });
  };

  if (loading) {
    return (
      <DashboardLayout title="Детали интервью">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-gray-500">Загрузка...</div>
      </DashboardLayout>
    );
  }

  if (notFound || !interview || !application || !animal || !candidate) {
    return (
      <DashboardLayout title="Детали интервью">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-gray-800 font-semibold mb-2">Интервью не найдено</div>
          <button
            className="inline-flex items-center text-sm text-amber-600 hover:text-amber-700 font-medium"
            onClick={() => navigate('/coordinator/interviews')}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Вернуться к списку
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Детали интервью">
      <div className="flex items-center mb-4">
        <button
          onClick={() => navigate('/coordinator/interviews')}
          className="inline-flex items-center text-sm text-amber-600 hover:text-amber-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Назад к списку
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">Интервью #{interview.id}</div>
            <h2 className="text-2xl font-bold text-gray-900">Заявка #{application.id}</h2>
          </div>
          {statusBadge && (
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusBadge.className}`}>
              {statusBadge.text}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-blue-50 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">Кандидат</h4>
            </div>
            <div className="space-y-3">
              <div className="font-medium text-gray-900">
                {candidate.firstName} {candidate.lastName}
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <Mail className="w-4 h-4 text-gray-400 mr-2" />
                {candidate.email}
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <Phone className="w-4 h-4 text-gray-400 mr-2" />
                {candidate.phoneNumber || '—'}
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-amber-100 rounded-lg mr-3">
                <PawPrint className="w-6 h-6 text-amber-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">Животное</h4>
            </div>
            <div className="space-y-3">
              <div className="font-medium text-gray-900">{animal.name}</div>
              <div className="text-sm text-gray-700">{animal.breed}</div>
              <div className="text-sm text-gray-700">{animal.description}</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <h4 className="text-lg font-bold text-gray-900 mb-4">Информация об интервью</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <div className="text-sm text-gray-500">Дата</div>
                <div className="font-medium text-gray-900">{interviewDate?.toLocaleDateString()}</div>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <div className="text-sm text-gray-500">Время</div>
                <div className="font-medium text-gray-900">
                  {interviewDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>

          {interview.coordinatorNotes && (
            <div>
              <div className="text-sm text-gray-500 mb-2">Заметки</div>
              <div className="text-sm text-gray-700 bg-white p-3 rounded-lg">{interview.coordinatorNotes}</div>
            </div>
          )}
        </div>

        {interview.status === 'scheduled' || interview.status === 'confirmed' ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Отменить интервью
            </button>
            {interview.status === 'confirmed' && (
              <button
                onClick={() => setIsCompleteModalOpen(true)}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Завершить интервью
              </button>
            )}
          </div>
        ) : null}
      </div>

      <InterviewCompleteModal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        onConfirm={onCompleteConfirm}
      />

      <ConfirmModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={onCancelConfirm}
        title="Отмена интервью"
        message="Вы уверены, что хотите отменить это интервью? Это действие нельзя отменить."
        confirmLabel="Да, отменить"
        isDanger={true}
      />
    </DashboardLayout>
  );
}
