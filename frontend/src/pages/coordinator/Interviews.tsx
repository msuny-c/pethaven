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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[840px]">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-3">Дата / время</th>
                <th className="px-6 py-3">Кандидат</th>
                <th className="px-6 py-3">Животное</th>
                <th className="px-6 py-3">Статус</th>
                <th className="px-6 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {interviews.map((interview) => {
              const application = applications.find((a) => a.id === interview.applicationId);
              const animal = animals.find((a) => a.id === application?.animalId);
              const interviewDate = new Date(interview.scheduledDatetime);
              const candidate = application ? users.find((u) => u.id === application.candidateId) : undefined;
              const pill = statusPill(interview.status);
              const canCancel = interview.status === 'scheduled' || interview.status === 'confirmed';
              return <tr key={interview.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{interviewDate.toLocaleDateString()}</span>
                        <Clock className="w-4 h-4 text-gray-400 ml-2" />
                        <span>{interviewDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-gray-400" />
                        <div className="text-sm text-gray-900">
                          {candidate ? `${candidate.firstName} ${candidate.lastName}` : `Кандидат #${application?.candidateId}`}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <PawPrint className="w-4 h-4 text-gray-400" />
                        <div className="text-sm text-gray-900">
                          {animal?.name || `Животное #${application?.animalId}`}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${pill.className}`}>
                        {pill.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/coordinator/interviews/${interview.id}`)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-100"
                        >
                          <FileText className="w-4 h-4 mr-1" /> Детали
                        </button>
                        {interview.status === 'confirmed' && (
                          <button
                            onClick={() => handleComplete(interview.id)}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" /> Завершить
                          </button>
                        )}
                        {canCancel && (
                          <button
                            onClick={() => handleCancel(interview.id)}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
                          >
                            <XCircle className="w-4 h-4 mr-1" /> Отменить
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>;
            })}
              {interviews.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-center text-sm text-gray-500">
                  Интервью не запланированы
                </td>
              </tr>
            )}
            </tbody>
          </table>
        </div>
      </div>

      <InterviewCompleteModal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} onConfirm={onCompleteConfirm} />

      <ConfirmModal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} onConfirm={onCancelConfirm} title="Отмена интервью" message="Вы уверены, что хотите отменить это интервью? Это действие нельзя отменить." confirmLabel="Да, отменить" isDanger={true} />
    </DashboardLayout>;
}
