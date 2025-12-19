import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import {
  getAgreement,
  getAnimals,
  getApplications,
  getPostAdoptionReports,
  getUsers,
  getReportMedia
} from '../../services/api';
import { updatePostAdoptionReport } from '../../services/api';
import { Agreement, Animal, Application, PostAdoptionReport, ReportMedia, UserProfile } from '../../types';

export function CoordinatorPostAdoption() {
  const [reports, setReports] = useState<PostAdoptionReport[]>([]);
  const [animals, setAnimals] = useState<Record<number, Animal>>({});
  const [applications, setApplications] = useState<Application[]>([]);
  const [agreements, setAgreements] = useState<Record<number, Agreement>>({});
  const [users, setUsers] = useState<Record<number, UserProfile>>({});
  const [mediaMap, setMediaMap] = useState<Record<number, ReportMedia[]>>({});
  const [selected, setSelected] = useState<PostAdoptionReport | null>(null);

  useEffect(() => {
    const load = async () => {
      const [reportsData, apps, animalsList, usersList] = await Promise.all([
        getPostAdoptionReports(),
        getApplications(),
        getAnimals(),
        getUsers()
      ]);
      setReports(reportsData);
      setApplications(apps);
      const animalsMap: Record<number, Animal> = {};
      animalsList.forEach((a) => (animalsMap[a.id] = a));
      setAnimals(animalsMap);
      const usersMap: Record<number, UserProfile> = {};
      usersList.forEach((u) => (usersMap[u.id] = u));
      setUsers(usersMap);

      const agreementsList = await Promise.all(
        reportsData.map((r) =>
          r.agreementId ? getAgreement(r.agreementId).catch(() => null) : Promise.resolve(null)
        )
      );
      const agrMap: Record<number, Agreement> = {};
      agreementsList.forEach((agr) => {
        if (agr) {
          agrMap[agr.id] = agr;
        }
      });
      setAgreements(agrMap);

      const mediaEntries = await Promise.all(
        reportsData.map(async (r) => {
          try {
            const media = await getReportMedia(r.id);
            return [r.id, media] as const;
          } catch {
            return [r.id, []] as const;
          }
        })
      );
      const m: Record<number, ReportMedia[]> = {};
      mediaEntries.forEach(([id, list]) => (m[id] = list));
      setMediaMap(m);
    };
    load();
  }, []);

  const stats = useMemo(() => {
    return {
      pending: reports.filter((r) => r.status === 'pending').length,
      submitted: reports.filter((r) => r.status === 'submitted').length,
      overdue: reports.filter((r) => r.status === 'overdue').length
    };
  }, [reports]);

  return (
    <DashboardLayout title="Постсопровождение">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-amber-600">Ожидается</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-amber-900">{stats.pending}</div>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-600">Получено</span>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-green-900">{stats.submitted}</div>
        </div>

        <div className="bg-red-50 border border-red-100 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-red-600">Просрочено</span>
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-3xl font-bold text-red-900">{stats.overdue}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Отчёты усыновителей</h3>
        </div>

        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-3">Животное</th>
              <th className="px-6 py-3">Усыновитель</th>
              <th className="px-6 py-3">Срок сдачи</th>
              <th className="px-6 py-3">План</th>
              <th className="px-6 py-3">Статус</th>
              <th className="px-6 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reports.map((report) => {
              const agreement = agreements[report.agreementId];
              const application = agreement
                ? applications.find((a) => a.id === agreement.applicationId)
                : undefined;
              const animal = application ? animals[application.animalId] : undefined;
              const adopter = application ? users[application.candidateId] : undefined;
              const isOverdue =
                new Date(report.dueDate) < new Date() && report.status === 'pending';

              return (
                <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <img
                        src={
                          (animal?.photos && animal.photos[0]) ||
                          'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=200&q=80'
                        }
                        alt={animal?.name}
                        className="w-10 h-10 rounded-full object-cover mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-900">
                          {animal?.name || `Животное #${application?.animalId || '—'}`}
                        </div>
                        <div className="text-xs text-gray-500">{animal?.breed}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {adopter
                        ? `${adopter.firstName} ${adopter.lastName}`
                        : application
                          ? `Кандидат #${application.candidateId}`
                          : '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {report.dueDate}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                    {agreement?.postAdoptionPlan || '—'}
                  </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    report.status === 'submitted'
                      ? 'bg-green-100 text-green-800'
                          : isOverdue
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}
                >
                  {report.status === 'submitted'
                    ? 'Получено'
                    : isOverdue
                      ? 'Просрочено'
                      : 'Ожидается'}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="space-y-2">
                  <button
                    className="text-sm text-blue-600 font-medium hover:underline"
                    onClick={() => setSelected(report)}
                  >
                    Подробнее
                  </button>
                  {report.status === 'pending' && (
                    <button
                      className="text-sm text-emerald-600 font-medium hover:underline"
                      onClick={async () => {
                        await updatePostAdoptionReport(report.id, {
                          status: 'submitted',
                          submittedDate: new Date().toISOString().slice(0, 10)
                        });
                        const refreshed = await getPostAdoptionReports();
                        setReports(refreshed);
                      }}
                    >
                      Пометить как получено
                    </button>
                  )}
                  {report.status === 'submitted' && <span className="text-sm text-gray-500 block">Отчёт загружен</span>}
                </div>
              </td>
            </tr>
          );
        })}
          </tbody>
        </table>
      {reports.length === 0 && <div className="p-8 text-center text-gray-500">Нет отчётов</div>}
      </div>
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase text-gray-500">Отчёт #{selected.id}</div>
                <div className="font-bold text-gray-900">
                  {(() => {
                    const agreement = agreements[selected.agreementId];
                    const application = agreement
                      ? applications.find((a) => a.id === agreement.applicationId)
                      : undefined;
                    const animal = application ? animals[application.animalId] : undefined;
                    return animal?.name || `Животное #${application?.animalId || '—'}`;
                  })()}
                </div>
              </div>
              <button
                className="text-sm text-gray-500 hover:text-gray-900"
                onClick={() => setSelected(null)}
              >
                Закрыть
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-sm text-gray-600">
                Срок сдачи: {selected.dueDate}
                {selected.submittedDate && ` • Сдан: ${selected.submittedDate}`}
              </div>
              {selected.reportText && (
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 text-sm text-gray-800">
                  {selected.reportText}
                </div>
              )}
              {selected.volunteerFeedback && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-sm text-emerald-900">
                  Комментарий волонтёра: {selected.volunteerFeedback}
                </div>
              )}
              {(mediaMap[selected.id] || []).length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {(mediaMap[selected.id] || []).map((m) => (
                    <img key={m.id} src={m.url} className="w-full h-24 object-cover rounded-lg border" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
