import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Calendar, CheckCircle, Upload } from 'lucide-react';
import { getPostAdoptionReports, getAnimals, submitReport, getReportMedia, uploadReportMedia } from '../../services/api';
import { PostAdoptionReport, Animal, ReportMedia } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
export function CandidateReports() {
  const { user } = useAuth();
  const [myReports, setMyReports] = useState<PostAdoptionReport[]>([]);
  const [animalMap, setAnimalMap] = useState<Record<number, Animal>>({});
  const [mediaMap, setMediaMap] = useState<Record<number, ReportMedia[]>>({});
  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  const [lightbox, setLightbox] = useState<{ open: boolean; url: string }>({ open: false, url: '' });

  const loadData = async () => {
    const [reports, animals] = await Promise.all([getPostAdoptionReports(), getAnimals()]);
    const map: Record<number, Animal> = {};
    animals.forEach((a) => (map[a.id] = a));
    setAnimalMap(map);
    setMyReports(reports);
    const mediaEntries = await Promise.all(
      reports.map(async (r) => {
        try {
          const media = await getReportMedia(r.id);
          return [r.id, media] as const;
        } catch {
          return [r.id, []] as const;
        }
      })
    );
    const mediaRecord: Record<number, ReportMedia[]> = {};
    mediaEntries.forEach(([id, list]) => {
      mediaRecord[id] = list;
    });
    setMediaMap(mediaRecord);
  };

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const resolveAnimal = (report: PostAdoptionReport) => {
    if (report.animalId && animalMap[report.animalId]) {
      return animalMap[report.animalId];
    }
    return undefined;
  };

  const handleUpload = async (reportId: number, file: File) => {
    setUploading((prev) => ({ ...prev, [reportId]: true }));
    try {
      const saved = await uploadReportMedia(reportId, file);
      setMediaMap((prev) => ({
        ...prev,
        [reportId]: [saved, ...(prev[reportId] || [])]
      }));
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Не удалось загрузить фото';
      alert(msg);
    } finally {
      setUploading((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  return <DashboardLayout title="Мои отчёты">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-900">Ожидаемые отчёты</h3>
          {myReports.filter(r => (r.status === 'pending' || r.status === 'overdue') && new Date(r.dueDate).getTime() <= new Date().getTime()).length > 0 ? myReports.filter(r => (r.status === 'pending' || r.status === 'overdue') && new Date(r.dueDate).getTime() <= new Date().getTime()).map(report => {
          const animal = resolveAnimal(report);
          return <div key={report.id} className="bg-white rounded-xl shadow-sm border border-amber-200 p-6">
                    <div className="flex items-center mb-4">
                      <img src={(animal?.photos && animal.photos[0]) || 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=200&q=80'} alt={animal?.name} className="w-12 h-12 rounded-full object-cover mr-4" />
                      <div>
                        <h4 className="font-bold text-gray-900">
                          Отчёт по {animal?.name || report.animalName || 'питомцу'}
                        </h4>
                        <p className="text-sm text-red-500 font-medium">
                          Срок сдачи: {report.dueDate}
                        </p>
                      </div>
                    </div>

                    <form
                      className="space-y-4"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget as HTMLFormElement);
                        const text = formData.get('text') as string;
                        const submittedDate = new Date().toISOString().slice(0, 10);
                        await submitReport(report.id, {
                          reportText: text,
                          status: 'submitted',
                          submittedDate
                        });
                        setMyReports((prev) =>
                          prev.map((r) =>
                            r.id === report.id ? { ...r, reportText: text, status: 'submitted', submittedDate } : r
                          )
                        );
                        alert('Отчёт отправлен');
                        await loadData();
                      }}
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Как дела у питомца?
                        </label>
                        <textarea name="text" rows={3} className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" placeholder="Опишите поведение, аппетит, настроение..." required />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Фотографии
                        </label>
                        <label className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-amber-500 transition-colors cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(evt) => {
                              const file = evt.target.files?.[0];
                              if (file) handleUpload(report.id, file);
                            }}
                          />
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">
                            Нажмите для загрузки фото
                          </p>
                          {uploading[report.id] && <p className="text-xs text-amber-600 mt-2">Загружаем...</p>}
                        </label>
                        {(mediaMap[report.id] || []).length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mt-3">
                            {(mediaMap[report.id] || []).map((m) => (
                              <img key={m.id} src={m.url} className="w-full h-20 object-cover rounded-lg border" />
                            ))}
                          </div>
                        )}
                      </div>

                      <button type="submit" className="w-full bg-amber-500 text-white py-2 rounded-lg font-medium hover:bg-amber-600 transition-colors">
                        Отправить отчёт
                      </button>
                    </form>
                  </div>;
        }) : <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p>
                Все отчёты сданы вовремя! Спасибо, что заботитесь о питомце.
              </p>
            </div>}
        </div>

        <div>
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              История отчётов
            </h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {myReports.filter(r => r.status !== 'pending' && r.status !== 'overdue').length > 0 ? <div className="divide-y divide-gray-100">
                {myReports.filter(r => r.status !== 'pending' && r.status !== 'overdue').map(report => {
              const animal = resolveAnimal(report) || Object.values(animalMap)[0];
              return <div key={report.id} className="p-4 flex items-center justify-between">
                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                            <div>
                              <div className="font-medium text-gray-900">
                                Отчёт от {report.submittedDate || report.dueDate}
                              </div>
                              <div className="text-sm text-gray-500">
                                {animal?.name || report.animalName || 'Питомец'}
                              </div>
                            </div>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            report.status === 'submitted' || report.status === 'reviewed'
                              ? 'bg-green-100 text-green-700'
                              : report.status === 'overdue'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                          }`}>
                            {report.status === 'reviewed'
                              ? 'Проверен'
                              : report.status === 'submitted'
                                ? 'Отправлен'
                                : report.status === 'overdue'
                                  ? 'Просрочен'
                                  : 'Ожидается'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span>Дедлайн: {report.dueDate}</span>
                            {report.submittedDate && <span>Сдан: {report.submittedDate}</span>}
                          </div>
                          <Link className="text-blue-600 text-sm font-medium hover:underline" to={`/candidate/reports/${report.id}`}>
                            Открыть отчёт
                          </Link>
                        </div>
                      </div>
                    </div>;
            })}
              </div> : <p className="p-6 text-center text-gray-500">История пуста</p>}
          </div>
        </div>
      {lightbox.open && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setLightbox({ open: false, url: '' })}>
          <img src={lightbox.url} className="max-w-4xl max-h-[90vh] object-contain rounded-xl shadow-2xl" />
        </div>
      )}
      </div>
    </DashboardLayout>;
}
