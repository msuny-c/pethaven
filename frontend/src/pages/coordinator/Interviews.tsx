import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Calendar, Clock, User, PawPrint } from 'lucide-react';
import { InterviewCompleteModal } from '../../components/modals/InterviewCompleteModal';
import { ConfirmModal } from '../../components/modals/ConfirmModal';
import { InterviewDetailModal } from '../../components/modals/InterviewDetailModal';
import { getAllInterviews, getApplications, getAnimals, getUsers, updateInterview } from '../../services/api';
import { Application, Animal, Interview, UserProfile } from '../../types';
export function CoordinatorInterviews() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<number | null>(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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
  const selectedInterviewData = interviews.find(i => i.id === selectedInterview);
  const selectedApplication = selectedInterviewData ? applications.find(a => a.id === selectedInterviewData.applicationId) : null;
  const selectedAnimal = selectedApplication ? animals.find(a => a.id === selectedApplication.animalId) : null;
  const selectedCandidate = selectedApplication ? users.find(u => u.id === selectedApplication.candidateId) : null;

  return <DashboardLayout title="Управление интервью">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Календарь интервью</h3>
        </div>

        <div className="divide-y divide-gray-100">
          {interviews.map(interview => {
          const application = applications.find(a => a.id === interview.applicationId);
          const animal = animals.find(a => a.id === application?.animalId);
          const interviewDate = new Date(interview.scheduledDatetime);
          const candidate = application ? users.find(u => u.id === application.candidateId) : undefined;
          return <div key={interview.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        interview.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-700'
                          : interview.status === 'confirmed'
                            ? 'bg-indigo-100 text-indigo-700'
                            : interview.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                      }`}>
                        {interview.status === 'scheduled'
                          ? 'Запланировано'
                          : interview.status === 'confirmed'
                            ? 'Подтверждено'
                            : interview.status === 'completed'
                              ? 'Проведено'
                              : 'Отменено'}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {interviewDate.toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {interviewDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {candidate ? `${candidate.firstName} ${candidate.lastName}` : `Кандидат #${application?.candidateId}`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {candidate?.email || ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <PawPrint className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {animal?.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {animal?.breed}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button onClick={() => {
                  setSelectedInterview(interview.id);
                  setIsDetailModalOpen(true);
                }} className="text-sm text-amber-600 hover:text-amber-700 font-medium">
                      Подробнее →
                    </button>
                  </div>

                  {(interview.status === 'scheduled' || interview.status === 'confirmed') && <div className="flex space-x-2 ml-4">
                      <button onClick={() => {
                  setSelectedInterview(interview.id);
                  setIsCompleteModalOpen(true);
                }} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">
                        Завершить
                      </button>
                      <button onClick={() => {
                  setSelectedInterview(interview.id);
                  setIsCancelModalOpen(true);
                }} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
                        Отменить
                      </button>
                    </div>}
                </div>
              </div>;
        })}
        </div>
      </div>

      <InterviewCompleteModal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} onConfirm={onCompleteConfirm} />

      <ConfirmModal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} onConfirm={onCancelConfirm} title="Отмена интервью" message="Вы уверены, что хотите отменить это интервью? Это действие нельзя отменить." confirmLabel="Да, отменить" isDanger={true} />

      {selectedInterviewData && selectedApplication && selectedAnimal && selectedCandidate && <InterviewDetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} interview={selectedInterviewData} application={selectedApplication} animal={selectedAnimal} candidate={selectedCandidate} onComplete={() => {
      setIsCompleteModalOpen(true);
      setIsDetailModalOpen(false);
    }} onCancel={() => {
      setIsCancelModalOpen(true);
      setIsDetailModalOpen(false);
    }} />}
    </DashboardLayout>;
}
