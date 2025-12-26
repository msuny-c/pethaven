import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { getAnimal, submitApplication } from '../../services/api';
import { Animal } from '../../types';
export function CandidateApplicationForm() {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [formData, setFormData] = useState({
    reason: '',
    experience: '',
    housing: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      getAnimal(Number(id)).then(setAnimal);
    }
  }, [id]);

  if (!animal) {
    return <DashboardLayout title="Животное не найдено">
        <div className="text-center py-12">
          <p className="text-gray-500">Животное не найдено</p>
        </div>
      </DashboardLayout>;
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    if (!passportFile) {
      setError('Загрузите скан паспорта (PDF или изображение)');
      return;
    }
    if (!consentAccepted) {
      setError('Подтвердите согласие на обработку персональных данных');
      return;
    }
    setSending(true);
    try {
      await submitApplication(animal.id, {
        reason: formData.reason,
        experience: formData.experience,
        housing: formData.housing
      }, passportFile, true);
      setSubmitted(true);
      setTimeout(() => navigate('/candidate/applications'), 2000);
    } catch (err: any) {
      const message: string = err?.response?.data?.message || 'Не удалось отправить заявку';
      if (message.toLowerCase().includes('активная заявка')) {
        setError('У вас уже есть активная заявка на этого питомца. Дождитесь решения или отмените прежнюю.');
      } else {
        setError(message);
      }
      setSending(false);
    }
  };
  if (submitted) {
    return <DashboardLayout title="Заявка отправлена">
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="bg-green-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Заявка успешно отправлена!
          </h2>
          <p className="text-gray-600 mb-6">
            Мы рассмотрим вашу заявку на адопцию {animal.name} и свяжемся с вами
            в ближайшее время.
          </p>
          <p className="text-sm text-gray-500">
            Перенаправление на страницу заявок...
          </p>
        </div>
      </DashboardLayout>;
  }
  return <DashboardLayout title={`Заявка на адопцию: ${animal.name}`} actions={<button onClick={() => navigate(`/candidate/animals/${id}`)} className="flex items-center text-gray-600 hover:text-gray-900 text-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к карточке
        </button>}>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6 bg-amber-50 border-b border-amber-100 flex items-center">
            {animal.photos && animal.photos[0] ? (
              <img src={animal.photos[0]} alt={animal.name} className="w-16 h-16 rounded-full object-cover mr-4" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-semibold mr-4">
                {(animal.name || 'Ж')[0]}
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-gray-900">{animal.name}</h3>
              <p className="text-sm text-gray-600">
                {animal.breed} • ~{animal.ageMonths ? Math.max(1, Math.round(animal.ageMonths / 12)) : 1} лет
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-gray-900">
                Документы
              </h4>
              <div className="border-2 border-dashed border-amber-200 rounded-xl bg-amber-50/40 p-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-semibold text-gray-900">Скан паспорта</p>
                    <p className="text-sm text-gray-600">
                      Загрузите разворот с фото (PDF или изображение, до 15 МБ)
                    </p>
                    {passportFile && <p className="text-xs text-amber-600 mt-2">Файл: {passportFile.name}</p>}
                  </div>
                  <div className="px-4 py-2 bg-white border border-amber-200 rounded-lg text-sm font-medium text-amber-600 shadow-sm hover:border-amber-300">
                    Выбрать файл
                  </div>
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 15 * 1024 * 1024) {
                    setError('Файл больше 15 МБ. Выберите другой.');
                    return;
                  }
                  setPassportFile(file);
                  setError(null);
                }} />
                </label>
              </div>
              <label className="flex items-start space-x-3 bg-gray-50 rounded-lg p-4 border border-gray-100">
                <input type="checkbox" checked={consentAccepted} onChange={e => setConsentAccepted(e.target.checked)} className="mt-1 w-4 h-4 text-amber-500 rounded border-gray-300 focus:ring-amber-500" />
                <span className="text-sm text-gray-700">
                  Даю согласие на обработку персональных данных и загрузку паспорта для оформления договора адопции
                </span>
              </label>
              {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                  {error}
                </div>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Жилищные условия <span className="text-red-500">*</span>
              </label>
              <input type="text" required value={formData.housing} onChange={e => setFormData({
              ...formData,
              housing: e.target.value
            })} placeholder="Квартира/дом, собственность/аренда" className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Опыт содержания животных <span className="text-red-500">*</span>
              </label>
              <textarea rows={3} required value={formData.experience} onChange={e => setFormData({
              ...formData,
              experience: e.target.value
            })} placeholder="Расскажите о вашем опыте..." className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Почему вы хотите взять именно {animal.name}?{' '}
                <span className="text-red-500">*</span>
              </label>
              <textarea rows={4} required value={formData.reason} onChange={e => setFormData({
              ...formData,
              reason: e.target.value
            })} placeholder="Расскажите о своей мотивации..." className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" />
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-bold text-gray-900 mb-2">
                Что дальше?
              </h4>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Мы рассмотрим вашу заявку в течение 2-3 дней</li>
                <li>Координатор свяжется с вами для назначения интервью</li>
                <li>
                  После успешного интервью мы организуем встречу с {animal.name}
                </li>
                <li>При положительном решении оформим договор адопции</li>
              </ol>
            </div>

            <div className="flex space-x-4 pt-4">
              <button type="button" onClick={() => navigate(`/candidate/animals/${id}`)} className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                Отмена
              </button>
              <button type="submit" disabled={sending} className="flex-1 bg-amber-500 text-white py-3 rounded-lg font-medium hover:bg-amber-600 transition-colors flex items-center justify-center disabled:opacity-60">
                <Send className="w-4 h-4 mr-2" />
                {sending ? 'Отправляем...' : 'Отправить заявку'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>;
}
