import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Calendar, Clock, User, PawPrint, FileText, CheckCircle, XCircle } from 'lucide-react';
import { InterviewCompleteModal } from '../../components/modals/InterviewCompleteModal';
import { ConfirmModal } from '../../components/modals/ConfirmModal';
import { getAllInterviews, getApplications, getAnimals, getUsers, updateInterview } from '../../services/api';
import { Application, Animal, Interview, UserProfile } from '../../types';
import { useNavigate } from 'react-router-dom';
export function CoordinatorInterviews() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<number | null>(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getAllInterviews(), getApplications(), getAnimals(), getUsers()]).then(([interviewsData, apps, animalsData, usersData]) => {
      setInterviews(interviewsData);
      setApplications(apps);
      setAnimals(animalsData);
      setUsers(usersData);
    });
  }, []);

  const handleComplete = (id: number) => {
    setSelectedInterview(id);
    setIsCompleteModalOpen(true);
  };
  const handleCancel = (id: number) => {
    setSelectedInterview(id);
    setIsCancelModalOpen(true);
  };
  const onCompleteConfirm = (outcome: 'approved' | 'rejected', notes: string) => {
    if (!selectedInterview) return;
    const interview = interviews.find(i => i.id === selectedInterview);
    const applicationId = interview?.applicationId;
    updateInterview(selectedInterview, 'completed', notes, outcome === 'approved' ? applicationId : undefined).then(async () => {
      const refreshed = await getAllInterviews();
      setInterviews(refreshed);
      alert('Интервью успешно завершено!');
    });
  };
  const onCancelConfirm = () => {
    if (!selectedInterview) return;
    updateInterview(selectedInterview, 'cancelled', 'Отмена координатором').then(async () => {
      const refreshed = await getAllInterviews();
      setInterviews(refreshed);
      alert('Интервью отменено.');
    });
  };

  const statusPill = (status: Interview['status']) => {
    switch (status) {
      case 'scheduled':
        return { text: 'Запланировано', className: 'bg-blue-100 text-blue-700' };
      case 'confirmed':
        return { text: 'Подтверждено', className: 'bg-indigo-100 text-indigo-700' };
      case 'completed':
        return { text: 'Проведено', className: 'bg-green-100 text-green-700' };
      default:
        return { text: 'Отменено', className: 'bg-gray-100 text-gray-700' };
    }
  };

  return <DashboardLayout title="Управление интервью">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="text-xs uppercase text-gray-500">Всего</div>
          <div className="text-2xl font-bold text-gray-900">{interviews.length}</div>
        </div>
        <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="text-xs uppercase text-blue-600">Запланировано</div>
          <div className="text-xl font-bold text-blue-800">{interviews.filter(i => i.status === 'scheduled' || i.status === 'confirmed').length}</div>
        </div>
        <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="text-xs uppercase text-green-600">Проведено</div>
          <div className="text-xl font-bold text-green-800">{interviews.filter(i => i.status === 'completed').length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {interviews.map(interview => {
        const application = applications.find(a => a.id === interview.applicationId);
        const animal = animals.find(a => a.id === application?.animalId);
        const interviewDate = new Date(interview.scheduledDatetime);
        const candidate = application ? users.find(u => u.id === application.candidateId) : undefined;
        const pill = statusPill(interview.status);
        return <div key={interview.id} className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${pill.className}`}>
                    {pill.text}
                  </span>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <span className="inline-flex items-center">
                      <Calendar className="w-4 h-4 mr-1" /> {interviewDate.toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center">
                      <Clock className="w-4 h-4 mr-1" /> {interviewDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/coordinator/interviews/${interview.id}`)}
                  className="text-sm text-amber-600 hover:text-amber-700 font-semibold inline-flex items-center gap-1"
                >
                  <FileText className="w-4 h-4" /> Детали
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {candidate ? `${candidate.firstName} ${candidate.lastName}` : `Кандидат #${application?.candidateId}`}
                    </div>
                    <div className="text-xs text-gray-500">{candidate?.email || ''}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <PawPrint className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{animal?.name || 'Питомец'}</div>
                    <div className="text-xs text-gray-500">{animal?.breed}</div>
                  </div>
                </div>
              </div>

              {(interview.status === 'scheduled' || interview.status === 'confirmed') && (
                <div className="flex flex-wrap gap-2">
                  {interview.status === 'confirmed' && (
                    <button
                      onClick={() => {
                        setSelectedInterview(interview.id);
                        setIsCompleteModalOpen(true);
                      }}
                      className="inline-flex items-center px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Завершить
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedInterview(interview.id);
                      setIsCancelModalOpen(true);
                    }}
                    className="inline-flex items-center px-3 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm font-semibold hover:bg-gray-300"
                  >
                    <XCircle className="w-4 h-4 mr-1" /> Отменить
                  </button>
                </div>
              )}
            </div>;
      })}
      </div>

      <InterviewCompleteModal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} onConfirm={onCompleteConfirm} />

      <ConfirmModal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} onConfirm={onCancelConfirm} title="Отмена интервью" message="Вы уверены, что хотите отменить это интервью? Это действие нельзя отменить." confirmLabel="Да, отменить" isDanger={true} />
    </DashboardLayout>;
}
