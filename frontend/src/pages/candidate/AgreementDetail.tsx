import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Agreement, Application, Animal } from '../../types';
import {
  getAgreement,
  getApplicationById,
  getAnimal,
  downloadAgreementTemplate,
  downloadSignedAgreement,
  uploadSignedAgreement
} from '../../services/api';
import { Calendar, FileDown, FileSignature, PawPrint, ArrowLeft, UserRound, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function CandidateAgreementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [downloadingSigned, setDownloadingSigned] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const agr = await getAgreement(Number(id));
        setAgreement(agr);
        const app = await getApplicationById(agr.applicationId);
        if (user && app.candidateId !== user.id) {
          setError('Договор недоступен');
          setLoading(false);
          return;
        }
        setApplication(app);
        const pet = await getAnimal(app.animalId);
        setAnimal(pet);
      } catch (e) {
        console.error(e);
        setError('Не удалось загрузить договор');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user]);

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadTemplate = async () => {
    if (!agreement) return;
    setDownloadingTemplate(true);
    try {
      const blob = await downloadAgreementTemplate(agreement.id);
      downloadFile(blob, `agreement-template-${agreement.id}.docx`);
    } catch {
      alert('Не удалось скачать шаблон');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleDownloadSigned = async () => {
    if (!agreement?.signedUrl) return;
    setDownloadingSigned(true);
    try {
      const blob = await downloadSignedAgreement(agreement.id);
      downloadFile(blob, `agreement-signed-${agreement.id}.docx`);
    } catch {
      alert('Не удалось скачать подписанный договор');
    } finally {
      setDownloadingSigned(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!agreement) return;
    setUploading(true);
    try {
      const updated = await uploadSignedAgreement(agreement.id, file);
      setAgreement(updated);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Не удалось загрузить файл';
      alert(msg);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Договор">
        <div className="p-8 text-center text-gray-500">Загрузка...</div>
      </DashboardLayout>
    );
  }

  if (error || !agreement || !application) {
    return (
      <DashboardLayout title="Договор">
        <div className="p-8 text-center text-red-500">{error || 'Договор не найден'}</div>
      </DashboardLayout>
    );
  }

  const statusLabel = agreement.confirmedAt
    ? { text: 'Передача подтверждена', className: 'bg-green-100 text-green-700' }
    : agreement.signedUrl
      ? { text: 'Подписан, ждёт проверки', className: 'bg-blue-100 text-blue-700' }
      : { text: 'Ожидает подписи', className: 'bg-amber-100 text-amber-700' };
  const coordinatorName =
    (agreement.coordinatorFirstName || agreement.coordinatorLastName)
      ? `${agreement.coordinatorFirstName || ''} ${agreement.coordinatorLastName || ''}`.trim()
      : application?.processedBy
        ? `Координатор #${application.processedBy}`
        : 'Будет назначен';

  return (
    <DashboardLayout
      title={`Договор #${agreement.id}`}
      actions={
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </button>
      }
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">Договор #{agreement.id}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusLabel.className}`}>
                {statusLabel.text}
              </span>
            </div>
          <div className="flex items-center text-sm text-gray-500 gap-3 mt-2">
            <div className="flex items-center">
              <PawPrint className="w-4 h-4 mr-1" />
              {animal?.name || `Питомец #${application.animalId}`}
            </div>
              {agreement.signedDate && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Подписан: {agreement.signedDate}
                </div>
              )}
            </div>
          </div>
          {animal && (
            <img
              src={
                (animal.photos && animal.photos[0]) ||
                'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=160&q=80'
              }
              alt={animal.name}
              className="w-20 h-20 rounded-xl object-cover border border-gray-100"
            />
          )}
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-wrap gap-3">
            {!agreement.signedUrl && (
              <button
                onClick={handleDownloadTemplate}
                disabled={downloadingTemplate}
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 inline-flex items-center"
              >
                <FileDown className="w-4 h-4 mr-2" />
                {downloadingTemplate ? 'Скачиваем...' : 'Скачать шаблон'}
              </button>
            )}
            {agreement.signedUrl ? (
              <button
                onClick={handleDownloadSigned}
                disabled={downloadingSigned}
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 inline-flex items-center"
              >
                <FileDown className="w-4 h-4 mr-2" />
                {downloadingSigned ? 'Скачиваем...' : 'Подписанный договор'}
              </button>
            ) : (
              <label className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-green-500 text-white hover:bg-green-600 cursor-pointer">
                <FileSignature className="w-4 h-4 mr-2" />
                {uploading ? 'Загружаем...' : 'Загрузить подписанный'}
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 15 * 1024 * 1024) {
                      alert('Файл больше 15 МБ');
                      return;
                    }
                    handleUpload(file);
                  }}
                />
              </label>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-1 shadow-inner">
              <div className="text-sm font-semibold text-amber-800">План постсопровождения</div>
              <p className="text-sm text-amber-900 whitespace-pre-line">
                {agreement.postAdoptionPlan || '—'}
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-3">
              {agreement.coordinatorAvatar ? (
                <img
                  src={agreement.coordinatorAvatar}
                  alt={coordinatorName}
                  className="w-12 h-12 rounded-full object-cover border border-white shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  {(agreement.coordinatorFirstName?.[0] || agreement.coordinatorLastName?.[0] || 'К').toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-xs uppercase text-gray-500 font-semibold">Координатор</div>
                <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <UserRound className="w-4 h-4 text-gray-400" />
                  {coordinatorName}
                </div>
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {agreement.coordinatorPhone || 'Телефон не указан'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
