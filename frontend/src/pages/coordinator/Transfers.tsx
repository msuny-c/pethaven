import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Calendar, CheckCircle, FileSignature, FileDown, ShieldCheck, AlertCircle } from 'lucide-react';
import {
  createAgreement,
  confirmAgreement,
  downloadAgreementTemplate,
  downloadSignedAgreement,
  getAgreements,
  getAnimals,
  getApplications,
  getUsers
} from '../../services/api';
import { Agreement, Animal, Application, UserProfile } from '../../types';
import { AnimalAvatar } from '../../components/AnimalAvatar';
import { PersonAvatar } from '../../components/PersonAvatar';

export function CoordinatorTransfers() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [animals, setAnimals] = useState<Record<number, Animal>>({});
  const [users, setUsers] = useState<Record<number, UserProfile>>({});
  const [creatingId, setCreatingId] = useState<number | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ready' | 'progress' | 'done'>('ready');
  const [planDrafts, setPlanDrafts] = useState<Record<number, string>>({});

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
    const map: Record<number, Agreement> = {};
    agreements.forEach((a) => {
      map[a.applicationId] = a;
    });
    return map;
  }, [agreements]);

  const pendingTransfers = useMemo(
    () => applications.filter((a) => a.status === 'approved' && !agreementsByApp[a.id]),
    [applications, agreementsByApp]
  );
  const inProgressAgreements = useMemo(() => agreements.filter((a) => !a.confirmedAt), [agreements]);
  const completedAgreements = useMemo(() => agreements.filter((a) => !!a.confirmedAt), [agreements]);

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownload = async (agreementId: number, type: 'template' | 'signed') => {
    setDownloadingKey(`${type}-${agreementId}`);
    try {
      const blob =
        type === 'template'
          ? await downloadAgreementTemplate(agreementId)
          : await downloadSignedAgreement(agreementId);
      downloadFile(blob, `agreement-${type}-${agreementId}.docx`);
    } catch {
      alert('Не удалось скачать файл договора');
    } finally {
      setDownloadingKey(null);
    }
  };

  const handleCreateAgreement = async (applicationId: number) => {
    const application = applications.find((a) => a.id === applicationId);
    if (!application) return;
              const animal = animals[application.animalId];
    if (!application.passportUrl) {
      alert('Кандидат не загрузил паспорт — договор не может быть сформирован');
      return;
    }
    if (!animal?.readyForAdoption) {
      alert('Ветеринар не подтвердил готовность питомца к передаче');
      return;
    }
    const plan = planDrafts[applicationId] || 'Фотоотчет каждую неделю в первый месяц';
    setCreatingId(applicationId);
    try {
      await createAgreement(applicationId, plan);
      await loadData();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Не удалось сформировать договор';
      alert(msg);
    } finally {
      setCreatingId(null);
    }
  };

  const handleConfirmAgreement = async (agreement: Agreement) => {
    setConfirmingId(agreement.id);
    try {
      await confirmAgreement(agreement.id);
      await loadData();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Не удалось подтвердить передачу';
      alert(msg);
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <DashboardLayout title="Передачи животных">
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setActiveTab('ready')} className={`px-4 py-2 rounded-lg text-sm font-semibold border ${activeTab === 'ready' ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
          Готовы к договору
        </button>
        <button onClick={() => setActiveTab('progress')} className={`px-4 py-2 rounded-lg text-sm font-semibold border ${activeTab === 'progress' ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
          Назначены
        </button>
        <button onClick={() => setActiveTab('done')} className={`px-4 py-2 rounded-lg text-sm font-semibold border ${activeTab === 'done' ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
          Завершены
        </button>
      </div>

      {activeTab === 'ready' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">Готовы к договору</h3>
              <p className="text-sm text-gray-500">Одобренные заявки без сформированного договора</p>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingTransfers.map((transfer) => {
              const animal = animals[transfer.animalId];
              const candidate = users[transfer.candidateId];
              const plan = planDrafts[transfer.id] || 'Фотоотчет каждую неделю в первый месяц';
              const ready = animal?.readyForAdoption;
              const passport = !!transfer.passportUrl;
              return (
                <div key={transfer.id} className="p-6 space-y-3 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <AnimalAvatar src={animal?.photos?.[0]} name={animal?.name} sizeClass="w-16 h-16" roundedClassName="rounded-lg" />
                      <div>
                        <div className="flex items-center mb-1 flex-wrap gap-2">
                          <h3 className="font-bold text-gray-900 mr-3">{animal?.name}</h3>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-blue-100 text-blue-700">
                            Одобрено
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${passport ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {passport ? 'Паспорт' : 'Нет паспорта'}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ready ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {ready ? 'Вет готов' : 'Нужен допуск ветврача'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          Кандидат:{' '}
                          <Link to={`/coordinator/candidate/${transfer.candidateId}`} className="font-medium text-blue-600 hover:text-blue-700">
                            {candidate ? `${candidate.firstName} ${candidate.lastName}` : `#${transfer.candidateId}`}
                          </Link>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          Заявка от {transfer.createdAt ? new Date(transfer.createdAt).toLocaleDateString() : '—'}
                        </div>
                      </div>
                    </div>
                    <Link to={`/coordinator/applications/${transfer.id}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Открыть заявку
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs text-gray-500">План постсопровождения</label>
                      <textarea
                        rows={3}
                        value={plan}
                        onChange={(e) => setPlanDrafts((prev) => ({ ...prev, [transfer.id]: e.target.value }))}
                        className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500 text-sm"
                        placeholder="Частота отчетов, визиты, фото"
                      />
                      {!ready && (
                        <p className="text-xs text-amber-600 flex items-center gap-1">
                          <ShieldCheck className="w-4 h-4" /> Ветеринар должен подтвердить готовность
                        </p>
                      )}
                      {!passport && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" /> Нужен паспорт кандидата
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleCreateAgreement(transfer.id)}
                      disabled={!passport || !ready || creatingId === transfer.id}
                      className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50"
                    >
                      <FileSignature className="w-4 h-4 mr-2" />
                      {creatingId === transfer.id ? 'Готовим...' : 'Сформировать договор'}
                    </button>
                  </div>
                </div>
              );
            })}
            {pendingTransfers.length === 0 && (
              <div className="p-6 text-center text-gray-500">Нет одобренных заявок без договора</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'progress' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">Договоры в работе</h3>
              <p className="text-sm text-gray-500">Шаблон сформирован, ждём подписи или подтверждения</p>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {inProgressAgreements.map((agreement) => {
              const app = applications.find((a) => a.id === agreement.applicationId);
              if (!app) return null;
              const animal = animals[app.animalId];
              const candidate = users[app.candidateId];
              return (
                <div key={agreement.id} className="p-6 space-y-3 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <AnimalAvatar src={animal?.photos?.[0]} name={animal?.name} sizeClass="w-16 h-16" roundedClassName="rounded-lg" />
                      <div>
                        <div className="flex items-center mb-1 flex-wrap gap-2">
                          <h3 className="font-bold text-gray-900 mr-3">{animal?.name}</h3>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-700">
                            Договор в работе
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${agreement.signedUrl ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                            {agreement.signedUrl ? 'Подписан кандидатом' : 'Ожидает подписи'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          Кандидат:{' '}
                          <Link to={`/coordinator/candidate/${app.candidateId}`} className="font-medium text-blue-600 hover:text-blue-700">
                            {candidate ? `${candidate.firstName} ${candidate.lastName}` : `#${app.candidateId}`}
                          </Link>
                        </div>
                      </div>
                      </div>
                    <div className="flex flex-col items-end gap-2">
                      <Link to={`/coordinator/applications/${app.id}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        Открыть заявку
                      </Link>
                      <Link to={`/coordinator/agreements/${agreement.id}`} className="text-sm text-amber-600 hover:text-amber-700 font-medium">
                        Договор
                      </Link>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {agreement.signedUrl ? (
                      <button
                        onClick={() => handleDownload(agreement.id, 'signed')}
                        disabled={downloadingKey === `signed-${agreement.id}`}
                        className="flex items-center px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <FileDown className="w-4 h-4 mr-2" />
                        {downloadingKey === `signed-${agreement.id}` ? 'Скачиваем...' : 'Подписанный'}
                      </button>
                    ) : (
                      <span className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        Ждём подписанный договор от кандидата
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <button
                      onClick={() => handleConfirmAgreement(agreement)}
                      disabled={!agreement.signedUrl || confirmingId === agreement.id}
                      className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {confirmingId === agreement.id ? 'Подтверждаем...' : 'Подтвердить передачу'}
                    </button>
                  </div>
                </div>
              );
            })}
            {inProgressAgreements.length === 0 && (
              <div className="p-6 text-center text-gray-500">Нет договоров в работе</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'done' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Завершённые передачи</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {completedAgreements.map((agreement) => {
              const app = applications.find((a) => a.id === agreement.applicationId);
              if (!app) return null;
              const animal = animals[app.animalId];
              const candidate = users[app.candidateId];
              return (
                <div key={agreement.id} className="p-6 flex items-start justify-between hover:bg-gray-50">
                  <div className="flex items-start space-x-4">
                    <AnimalAvatar src={animal?.photos?.[0]} name={animal?.name} sizeClass="w-16 h-16" roundedClassName="rounded-lg" />
                    <div>
                      <div className="flex items-center mb-1">
                        <h3 className="font-bold text-gray-900 mr-3">{animal?.name}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-green-100 text-green-700 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Завершено
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        Усыновитель:{' '}
                        <Link to={`/coordinator/candidate/${app.candidateId}`} className="font-medium text-blue-600 hover:text-blue-700">
                          {candidate ? `${candidate.firstName} ${candidate.lastName}` : `#${app.candidateId}`}
                        </Link>
                      </div>
                      <div className="text-xs text-gray-500">
                        Подтверждено: {agreement.confirmedAt ? new Date(agreement.confirmedAt).toLocaleDateString() : '—'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500 space-y-1">
                    <div>ID заявки: {app.id}</div>
                    <Link to={`/coordinator/agreements/${agreement.id}`} className="text-blue-600 hover:text-blue-700 font-medium">
                      Открыть договор
                    </Link>
                  </div>
                </div>
              );
            })}
            {completedAgreements.length === 0 && (
              <div className="p-6 text-center text-gray-500">Нет оформленных передач</div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
