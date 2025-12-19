import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import {
  getAgreement,
  getAnimals,
  getApplications,
  getPostAdoptionReports,
  getUsers,
  getReportMedia
} from '../../services/api';
import { Agreement, Animal, Application, PostAdoptionReport, ReportMedia, UserProfile } from '../../types';

export function VolunteerPostAdoptionReview() {
  const [reports, setReports] = useState<PostAdoptionReport[]>([]);
  const [agreements, setAgreements] = useState<Record<number, Agreement>>({});
  const [applications, setApplications] = useState<Application[]>([]);
  const [animals, setAnimals] = useState<Record<number, Animal>>({});
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
      overdue: reports.filter((r) => r.status === 'overdue').length,
      reviewed: reports.filter((r) => r.status === 'submitted').length
    };
  }, [reports]);

  return (
    <DashboardLayout title="Постсопровождение">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
          <div className="text-sm font-medium text-amber-600 mb-2">Ожидают проверки</div>
          <div className="text-3xl font-bold text-amber-900">{stats.pending}</div>
        </div>

        <div className="bg-red-50 border border-red-100 rounded-xl p-6">
          <div className="text-sm font-medium text-red-600 mb-2">Просрочено</div>
          <div className="text-3xl font-bold text-red-900">{stats.overdue}</div>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-xl p-6">
          <div className="text-sm font-medium text-green-600 mb-2">Получено</div>
          <div className="text-3xl font-bold text-green-900">{stats.reviewed}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Отчёты от усыновителей</h3>
        </div>
        <div className="divide-y divide-gray-100">
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
              <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start flex-1">
                    <img
                      src={
                        (animal?.photos && animal.photos[0]) ||
                        'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=200&q=80'
                      }
                      alt={animal?.name}
                      className="w-16 h-16 rounded-lg object-cover mr-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="font-bold text-gray-900 mr-3">
                          {animal?.name || `Животное #${application?.animalId || '—'}`}
                        </h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            report.status === 'submitted'
                              ? 'bg-green-100 text-green-700'
                              : report.status === 'overdue'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {report.status === 'submitted'
                            ? 'Проверено'
                            : report.status === 'overdue'
                              ? 'Просрочено'
                              : 'Ожидает'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        Усыновитель:{' '}
                        <span className="font-medium">
                          {adopter
                            ? `${adopter.firstName} ${adopter.lastName}`
                            : application
                              ? `Кандидат #${application.candidateId}`
                              : '—'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Срок сдачи: {report.dueDate}
                        {report.submittedDate && ` • Сдан: ${report.submittedDate}`}
                      </div>
                      {report.reportText && (
                        <p className="text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-lg p-3 mt-3">
                          {report.reportText}
                        </p>
                      )}
                      {report.volunteerFeedback && (
                        <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg p-3 mt-2">
                          Комментарий координатора: {report.volunteerFeedback}
                        </p>
                      )}
                      {(mediaMap[report.id] || []).length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          {(mediaMap[report.id] || []).map((m) => (
                            <img key={m.id} src={m.url} className="w-full h-20 object-cover rounded-lg border" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {isOverdue && (
                    <div className="text-red-500 text-sm font-medium flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Требуется внимание
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {reports.length === 0 && <div className="p-8 text-center text-gray-500">Нет отчётов</div>}
        </div>
      </div>
    </DashboardLayout>
  );
}
