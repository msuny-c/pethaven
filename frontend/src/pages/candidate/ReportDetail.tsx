import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { getAgreement, getAnimals, getApplications, getPostAdoptionReports, getReportMedia, getUsers } from '../../services/api';
import { Agreement, Animal, Application, PostAdoptionReport, ReportMedia, UserProfile } from '../../types';
import { ArrowLeft, Calendar, PawPrint, FileText } from 'lucide-react';

export function CandidateReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<PostAdoptionReport | null>(null);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [candidate, setCandidate] = useState<UserProfile | null>(null);
  const [media, setMedia] = useState<ReportMedia[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const reports = await getPostAdoptionReports();
      const current = reports.find((r) => r.id === Number(id)) || null;
      setReport(current || null);
      if (!current) return;
      const [apps, animalsList, users] = await Promise.all([getApplications(), getAnimals(), getUsers()]);
      if (current.agreementId) {
        const agr = await getAgreement(current.agreementId).catch(() => null);
        if (agr) {
          const app = apps.find((a) => a.id === agr.applicationId) || null;
          if (app) {
            setAnimal(animalsList.find((a) => a.id === app.animalId) || null);
            setCandidate(users.find((u) => u.id === app.candidateId) || null);
          }
        }
      }
      try {
        const mediaList = await getReportMedia(current.id);
        setMedia(mediaList);
      } catch {
        setMedia([]);
      }
    };
    load();
  }, [id]);

  if (!report) {
    return (
      <DashboardLayout
        title="Отчёт"
        actions={
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 text-sm font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </button>
        }
      >
        <div className="p-6 text-gray-500">Отчёт не найден</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`Мой отчёт #${report.id}`}
      actions={
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 text-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                Срок сдачи: {report.dueDate}
                {report.submittedDate && <span className="ml-2">• Сдан: {report.submittedDate}</span>}
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  report.status === 'reviewed'
                    ? 'bg-emerald-100 text-emerald-700'
                    : report.status === 'submitted'
                      ? 'bg-green-100 text-green-700'
                      : report.status === 'overdue'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                }`}
              >
                {report.status === 'reviewed'
                  ? 'Проверен'
                  : report.status === 'submitted'
                    ? 'Отправлен'
                    : report.status === 'overdue'
                      ? 'Просрочен'
                      : 'Ожидается'}
              </span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-xs uppercase text-gray-500">Текст отчёта</div>
                <div className="mt-2 p-4 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-800">
                  {report.reportText || 'Не заполнено'}
                </div>
              </div>
              {report.volunteerFeedback && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-sm text-emerald-900">
                  Комментарий координатора: {report.volunteerFeedback}
                </div>
              )}
              {media.length > 0 && (
                <div>
                  <div className="text-xs uppercase text-gray-500 mb-2">Фото</div>
                  <div className="grid grid-cols-3 gap-3">
                    {media.map((m) => (
                      <img
                        key={m.id}
                        src={m.url}
                        className="w-full h-24 object-cover rounded-lg border cursor-pointer"
                        onClick={() => setLightbox(m.url || '')}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <div className="flex items-center mb-3">
              <PawPrint className="w-4 h-4 text-amber-500 mr-2" />
              <div className="font-semibold text-gray-900">Питомец</div>
            </div>
            {animal ? (
              <div className="space-y-2">
                <div className="font-bold text-gray-900">{animal.name}</div>
                <div className="text-sm text-gray-600">{animal.breed}</div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Данные животного не найдены</div>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <div className="flex items-center mb-3">
              <FileText className="w-4 h-4 text-amber-500 mr-2" />
              <div className="font-semibold text-gray-900">Кандидат</div>
            </div>
            {candidate ? (
              <div className="space-y-2">
                <div className="font-bold text-gray-900">
                  {candidate.firstName} {candidate.lastName}
                </div>
                <div className="text-sm text-gray-600">{candidate.email}</div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Данные профиля не найдены</div>
            )}
          </div>
        </div>
      </div>

      {lightbox && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} className="max-w-4xl max-h-[90vh] object-contain rounded-xl shadow-2xl" />
        </div>
      )}
    </DashboardLayout>
  );
}
