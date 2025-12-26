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
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');

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
          const normalized = media.map((m: any) => ({ ...m, url: m.url || m.fileUrl }));
          return [r.id, normalized] as const;
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

  const handleUpload = async (reportId: number, files: FileList) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    setUploading((prev) => ({ ...prev, [reportId]: true }));
    try {
      const uploads = await Promise.all(
        fileArray.map((file) => uploadReportMedia(reportId, file))
      );
      setMediaMap((prev) => ({
        ...prev,
        [reportId]: [...uploads, ...(prev[reportId] || [])]
      }));
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Не удалось загрузить фото';
      alert(msg);
    } finally {
      setUploading((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  const current = myReports.filter(r => r.status === 'pending' || r.status === 'overdue');
  const history = myReports.filter(r => r.status !== 'pending' && r.status !== 'overdue');

  return (
    <DashboardLayout title="Мои отчёты">
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { key: 'current', label: 'Текущие' },
          { key: 'history', label: 'История' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
              activeTab === tab.key
                ? 'bg-amber-500 text-white border-amber-500'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'current' && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-900">Текущие отчёты</h3>
          {current.length > 0 ? (
            current.map((report) => {
              const animal = resolveAnimal(report);
              const isOverdue = new Date(report.dueDate).getTime() <= new Date().setHours(0, 0, 0, 0);
              return (
                <div key={report.id} className="bg-white rounded-xl shadow-sm border border-amber-200 p-6">
                  <div className="flex items-center mb-4">
                    {animal?.photos && animal.photos[0] ? (
                      <img src={animal.photos[0]} alt={animal?.name} className="w-12 h-12 rounded-full object-cover mr-4" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-semibold mr-4">
                        {(animal?.name || 'Ж')[0]}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-gray-900">
                        Отчёт по {animal?.name || report.animalName || 'питомцу'}
                      </h4>
                      <p className={`text-sm font-medium ${isOverdue ? 'text-red-500' : 'text-gray-600'}`}>
                        Срок сдачи: {report.dueDate} {isOverdue ? '(сегодня/просрочен)' : ''}
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
                          multiple
                          className="hidden"
                          onChange={(evt) => {
                            const files = evt.target.files;
                            if (files && files.length) handleUpload(report.id, files);
                          }}
                        />
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          Загрузите одно или несколько фото
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
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p>Все отчёты сданы вовремя! Спасибо, что заботитесь о питомце.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">История отчётов</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {history.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {history.map((report) => {
                  const animal = resolveAnimal(report) || Object.values(animalMap)[0];
                  return (
                    <div key={report.id} className="p-4 flex items-center justify-between">
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
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="p-6 text-center text-gray-500">История пуста</p>
            )}
          </div>
        </div>
      )}

      {lightbox.open && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setLightbox({ open: false, url: '' })}>
          <img src={lightbox.url} className="max-w-4xl max-h-[90vh] object-contain rounded-xl shadow-2xl" />
        </div>
      )}
    </DashboardLayout>
  );
}
