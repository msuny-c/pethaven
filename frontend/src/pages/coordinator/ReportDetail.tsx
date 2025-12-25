import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { getAgreement, getAnimals, getApplications, getPostAdoptionReports, getReportMedia, getUsers, updatePostAdoptionReport } from '../../services/api';
import { Agreement, Animal, Application, PostAdoptionReport, ReportMedia, UserProfile } from '../../types';
import { ArrowLeft, Calendar, FileText, PawPrint } from 'lucide-react';

export function CoordinatorReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<PostAdoptionReport | null>(null);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [candidate, setCandidate] = useState<UserProfile | null>(null);
  const [media, setMedia] = useState<ReportMedia[]>([]);
  const [recommendation, setRecommendation] = useState('');
  const [saving, setSaving] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [reportsCache, setReportsCache] = useState<Record<number, PostAdoptionReport>>({});

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const reports = await getPostAdoptionReports();
      const current = reports.find((r) => r.id === Number(id)) || null;
      const cache: Record<number, PostAdoptionReport> = {};
      reports.forEach((r) => (cache[r.id] = r));
      setReportsCache(cache);
      setReport(current || null);
      if (!current) return;
      setRecommendation(current.volunteerFeedback || '');
      const [apps, animalsList, users] = await Promise.all([getApplications(), getAnimals(), getUsers()]);
      if (current.agreementId) {
        const agr = await getAgreement(current.agreementId).catch(() => null);
        setAgreement(agr);
        const app = agr ? apps.find((a) => a.id === agr.applicationId) || null : null;
        setApplication(app);
        if (app) {
          setAnimal(animalsList.find((a) => a.id === app.animalId) || null);
          setCandidate(users.find((u) => u.id === app.candidateId) || null);
        }
      }
      try {
        const mediaList = await getReportMedia(current.id);
        setMedia(mediaList.map((m) => ({ ...m, url: m.url || (m as any).fileUrl })));
      } catch {
        setMedia([]);
      }
    };
    load();
  }, [id]);

  const saveRecommendation = async () => {
    if (!report) return;
    setSaving(true);
    try {
      await updatePostAdoptionReport(report.id, {
        agreementId: report.agreementId,
        dueDate: report.dueDate,
        submittedDate: report.submittedDate,
        reportText: report.reportText,
        volunteerFeedback: recommendation,
        status: 'reviewed'
      });
      const updated = { ...report, volunteerFeedback: recommendation, status: 'reviewed' as const };
      setReport(updated);
      setReportsCache((prev) => ({ ...prev, [report.id]: updated }));
      alert('Рекомендации сохранены');
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Не удалось сохранить';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

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
      title={`Отчёт #${report.id}`}
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
                    ? 'Получено'
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
              {media.length > 0 && (
                <div>
                  <div className="text-xs uppercase text-gray-500 mb-2">Фото</div>
                  <div className="grid grid-cols-3 gap-3">
                    {media.map((m) => (
                      <img
                        key={m.id}
                        src={m.url || (m as any).fileUrl}
                        className="w-full h-24 object-cover rounded-lg border cursor-pointer"
                        onClick={() => setLightbox(m.url || (m as any).fileUrl || '')}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-gray-900">Рекомендации координатора</div>
              {report.volunteerFeedback && (
                <span className="text-xs text-gray-500">Последнее обновление сохранено</span>
              )}
            </div>
            <textarea
              className="w-full rounded-lg border-gray-200 px-3 py-2 focus:ring-amber-500 focus:border-amber-500 text-sm min-h-[120px]"
              placeholder="Добавьте советы, что поправить у питомца, запросите дополнительные фото и т.п."
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
            />
            <div className="mt-3 flex flex-wrap gap-3 justify-end">
              {(report.status === 'pending' || report.status === 'overdue') && (
                <button
                  onClick={async () => {
                    if (!report) return;
                    setSaving(true);
                    try {
                      const submittedDate = new Date().toISOString().slice(0, 10);
                      await updatePostAdoptionReport(report.id, {
                        agreementId: report.agreementId,
                        dueDate: report.dueDate,
                        submittedDate,
                        reportText: report.reportText,
                        volunteerFeedback: recommendation,
                        status: 'submitted'
                      });
                      const updated = { ...report, status: 'submitted' as const, submittedDate };
                      setReport(updated);
                      setReportsCache((prev) => ({ ...prev, [report.id]: updated }));
                    } catch (e: any) {
                      const msg = e?.response?.data?.message || 'Не удалось обновить статус';
                      alert(msg);
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 disabled:opacity-50"
                >
                  Пометить как получено
                </button>
              )}
              <button
                onClick={saveRecommendation}
                disabled={saving}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 disabled:opacity-50"
              >
                {saving ? 'Сохраняем...' : 'Сохранить рекомендации'}
              </button>
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
                <div className="flex items-center gap-3">
                  <img
                    src={(animal.photos && animal.photos[0]) || 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=120&q=80'}
                    className="w-12 h-12 rounded-full object-cover border"
                  />
                  <div>
                    <div className="font-bold text-gray-900">{animal.name}</div>
                    <div className="text-sm text-gray-600">{animal.breed}</div>
                  </div>
                </div>
                <Link
                  to={`/coordinator/animals/${animal.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Открыть карточку
                </Link>
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
            {candidate && application ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <img
                    src={candidate.avatarUrl || 'https://i.pravatar.cc/120'}
                    className="w-12 h-12 rounded-full object-cover border"
                  />
                  <div>
                    <div className="font-bold text-gray-900">
                      {candidate.firstName} {candidate.lastName}
                    </div>
                    <div className="text-sm text-gray-600">{candidate.email}</div>
                  </div>
                </div>
                <Link
                  to={`/coordinator/candidate/${application.candidateId}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Профиль кандидата
                </Link>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Кандидат не найден</div>
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
