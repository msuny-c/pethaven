import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Agreement, Animal, Application, UserProfile } from '../../types';
import {
  confirmAgreement,
  downloadAgreementTemplate,
  downloadSignedAgreement,
  getAgreement,
  getAnimal,
  getApplicationById,
  getUsers
} from '../../services/api';
import { ArrowLeft, Calendar, CheckCircle, FileDown, FileSignature, Mail, PawPrint, Phone, UserRound } from 'lucide-react';

export function CoordinatorAgreementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [candidate, setCandidate] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<'template' | 'signed' | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmDate, setConfirmDate] = useState('');

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const agr = await getAgreement(Number(id));
      setAgreement(agr);
      setConfirmDate(agr.signedDate || new Date().toISOString().slice(0, 10));
      const app = await getApplicationById(agr.applicationId);
      setApplication(app);
      const [pet, users] = await Promise.all([getAnimal(app.animalId), getUsers().catch(() => [])]);
      setAnimal(pet);
      setCandidate(Array.isArray(users) ? users.find((u) => u.id === app.candidateId) || null : null);
      setError(null);
    } catch (e) {
      console.error(e);
      setError('Не удалось загрузить договор');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownload = async (type: 'template' | 'signed') => {
    if (!agreement) return;
    setDownloading(type);
    try {
      const blob =
        type === 'template'
          ? await downloadAgreementTemplate(agreement.id)
          : await downloadSignedAgreement(agreement.id);
      downloadFile(blob, `agreement-${type}-${agreement.id}.docx`);
    } catch {
      alert('Не удалось скачать файл договора');
    } finally {
      setDownloading(null);
    }
  };

  const handleConfirm = async () => {
    if (!agreement) return;
    setConfirming(true);
    try {
      await confirmAgreement(agreement.id, confirmDate || new Date().toISOString().slice(0, 10));
      await loadData();
    } catch {
      alert('Не удалось подтвердить передачу');
    } finally {
      setConfirming(false);
    }
  };

  const statusLabel = useMemo(() => {
    if (!agreement) return { text: '', className: '' };
    if (agreement.confirmedAt) return { text: 'Передача подтверждена', className: 'bg-green-100 text-green-700' };
    if (agreement.signedUrl) return { text: 'Подписан кандидатом', className: 'bg-blue-100 text-blue-700' };
    return { text: 'Шаблон сформирован', className: 'bg-amber-100 text-amber-700' };
  }, [agreement]);

  const candidateName = useMemo(() => {
    if (candidate) return `${candidate.firstName} ${candidate.lastName}`.trim();
    if (application) return `Кандидат #${application.candidateId}`;
    return 'Кандидат';
  }, [candidate, application]);

  if (loading) {
    return (
      <DashboardLayout title="Договор">
        <div className="p-8 text-center text-gray-500">Загружаем данные договора...</div>
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
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-gray-900">Договор #{agreement.id}</h2>
              {statusLabel.text && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusLabel.className}`}>
                  {statusLabel.text}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center text-sm text-gray-600 gap-3">
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
              {agreement.confirmedAt && (
                <div className="flex items-center text-green-700">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Подтверждено: {new Date(agreement.confirmedAt).toLocaleDateString()}
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
            <button
              onClick={() => handleDownload('template')}
              disabled={downloading === 'template'}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 inline-flex items-center"
            >
              <FileDown className="w-4 h-4 mr-2" />
              {downloading === 'template' ? 'Скачиваем...' : 'Скачать шаблон'}
            </button>
            {agreement.signedUrl && (
              <button
                onClick={() => handleDownload('signed')}
                disabled={downloading === 'signed'}
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 inline-flex items-center"
              >
                <FileSignature className="w-4 h-4 mr-2" />
                {downloading === 'signed' ? 'Скачиваем...' : 'Подписанный договор'}
              </button>
            )}
            <Link
              to={`/coordinator/applications/${application.id}`}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-amber-200 text-amber-700 hover:bg-amber-50 inline-flex items-center"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Открыть заявку
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-1 shadow-inner">
              <div className="text-sm font-semibold text-amber-800">План постсопровождения</div>
              <p className="text-sm text-amber-900 whitespace-pre-line">
                {agreement.postAdoptionPlan || 'План не указан'}
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-3">
              {candidate?.avatarUrl ? (
                <img
                  src={candidate.avatarUrl}
                  alt={candidateName}
                  className="w-12 h-12 rounded-full object-cover border border-white shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  {(candidateName[0] || 'К').toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-xs uppercase text-gray-500 font-semibold">Кандидат</div>
                <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <UserRound className="w-4 h-4 text-gray-400" />
                  {candidateName}
                </div>
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {candidate?.phoneNumber || application.details?.phone || 'Телефон не указан'}
                </div>
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {candidate?.email || application.details?.email || 'Email не указан'}
                </div>
              </div>
            </div>
          </div>

          {agreement.signedUrl && !agreement.confirmedAt && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-green-800">Подписан кандидатом</div>
                <p className="text-sm text-green-700">Проверьте документы и подтвердите передачу.</p>
              </div>
              <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                <label className="text-sm text-gray-700 flex flex-col">
                  <span className="text-xs uppercase text-gray-500 font-semibold">Дата подписания</span>
                  <input
                    type="date"
                    value={confirmDate}
                    onChange={(e) => setConfirmDate(e.target.value)}
                    className="rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  />
                </label>
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-60"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {confirming ? 'Подтверждаем...' : 'Подтвердить передачу'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
