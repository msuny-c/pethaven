import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Calendar, FileText, CheckCircle } from 'lucide-react';
import { TransferCompleteModal } from '../../components/modals/TransferCompleteModal';
import {
  completeTransfer,
  getAgreements,
  getAnimals,
  getApplications,
  getUsers
} from '../../services/api';
import { Agreement, Animal, Application, UserProfile } from '../../types';

export function CoordinatorTransfers() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [animals, setAnimals] = useState<Record<number, Animal>>({});
  const [users, setUsers] = useState<Record<number, UserProfile>>({});
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const loadData = async () => {
    const [apps, agrs, animalsList, usersList] = await Promise.all([
      getApplications(),
      getAgreements(),
      getAnimals(),
      getUsers()
    ]);
    setApplications(apps);
    setAgreements(agrs);
    const animalsMap: Record<number, Animal> = {};
    animalsList.forEach((a) => (animalsMap[a.id] = a));
    setAnimals(animalsMap);
    const usersMap: Record<number, UserProfile> = {};
    usersList.forEach((u) => (usersMap[u.id] = u));
    setUsers(usersMap);
  };

  useEffect(() => {
    loadData();
  }, []);

  const agreementsByApp = useMemo(() => {
    const setIds = new Set<number>();
    agreements.forEach((a) => setIds.add(a.applicationId));
    return setIds;
  }, [agreements]);

  const pendingTransfers = useMemo(
    () => applications.filter((a) => a.status === 'approved' && !agreementsByApp.has(a.id)),
    [applications, agreementsByApp]
  );
  const completedTransfers = useMemo(
    () => agreements.map((agr) => applications.find((a) => a.id === agr.applicationId)).filter(Boolean) as Application[],
    [agreements, applications]
  );

  const handleComplete = (applicationId: number) => {
    setSelectedAppId(applicationId);
    setIsCompleteModalOpen(true);
  };

  const onCompleteConfirm = async (notes: string) => {
    if (!selectedAppId || isCompleting) return;
    setIsCompleting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await completeTransfer(selectedAppId, notes || 'План постсопровождения', today);
      setIsCompleteModalOpen(false);
      setSelectedAppId(null);
      await loadData();
      alert('Передача оформлена');
    } catch (e: any) {
      console.error(e);
      const message = e?.response?.data?.message || e?.message || 'Не удалось оформить передачу';
      alert(message);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <DashboardLayout title="Передачи животных">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Готовы к передаче</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingTransfers.map((transfer) => {
              const animal = animals[transfer.animalId];
              const candidate = users[transfer.candidateId];
              return (
                <div key={transfer.id} className="p-6 flex items-start justify-between hover:bg-gray-50">
                  <div className="flex items-start space-x-4">
                    <img
                      src={
                        (animal?.photos && animal.photos[0]) ||
                        'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=200&q=80'
                      }
                      alt={animal?.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <div className="flex items-center mb-1">
                        <h3 className="font-bold text-gray-900 mr-3">{animal?.name}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-blue-100 text-blue-700">
                          Запланировано
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        Кандидат:{' '}
                        <span className="font-medium">
                          {candidate
                            ? `${candidate.firstName} ${candidate.lastName}`
                            : `#${transfer.candidateId}`}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        Заявка от {transfer.createdAt ? new Date(transfer.createdAt).toLocaleDateString() : '—'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => handleComplete(transfer.id)}
                      className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Оформить
                    </button>
                  </div>
                </div>
              );
            })}
            {pendingTransfers.length === 0 && (
              <div className="p-6 text-center text-gray-500">Нет одобренных заявок</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Завершённые передачи</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {completedTransfers.map((transfer) => {
              const animal = animals[transfer.animalId];
              const candidate = users[transfer.candidateId];
              return (
                <div key={transfer.id} className="p-6 flex items-start justify-between hover:bg-gray-50">
                  <div className="flex items-start space-x-4">
                    <img
                      src={
                        (animal?.photos && animal.photos[0]) ||
                        'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=200&q=80'
                      }
                      alt={animal?.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <div className="flex items-center mb-1">
                        <h3 className="font-bold text-gray-900 mr-3">{animal?.name}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-green-100 text-green-700 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Завершено
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        Усыновитель:{' '}
                        <span className="font-medium">
                          {candidate
                            ? `${candidate.firstName} ${candidate.lastName}`
                            : `#${transfer.candidateId}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">ID заявки: {transfer.id}</div>
                </div>
              );
            })}
            {completedTransfers.length === 0 && (
              <div className="p-6 text-center text-gray-500">Нет оформленных передач</div>
            )}
          </div>
        </div>
      </div>

      <TransferCompleteModal
        isOpen={isCompleteModalOpen}
        onClose={() => {
          setIsCompleteModalOpen(false);
          setSelectedAppId(null);
        }}
        onConfirm={onCompleteConfirm}
        isSubmitting={isCompleting}
      />
    </DashboardLayout>
  );
}
