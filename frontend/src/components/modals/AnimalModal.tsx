import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Upload, ChevronDown } from 'lucide-react';
import { Animal } from '../../types';
import { getAnimalSpecies } from '../../services/api';
interface AnimalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (animal: Partial<Animal> & { mainPhoto?: File | null; extraPhotos?: File[] }) => Promise<{ ok: boolean; errors?: Record<string, string>; message?: string }>;
  initialData?: Animal;
}
export function AnimalModal({
  isOpen,
  onClose,
  onSave,
  initialData
}: AnimalModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'photos'>('info');
  const [formData, setFormData] = useState<Partial<Animal>>(initialData || {
    name: '',
    species: 'dog',
    breed: '',
    gender: 'male',
    status: 'available',
    description: '',
    photos: [],
    ageMonths: undefined
  });
  const [mainPhoto, setMainPhoto] = useState<File | null>(null);
  const [extraPhotos, setExtraPhotos] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const statusLocked = initialData?.status === 'adopted';
  const [speciesOptions, setSpeciesOptions] = useState<string[]>(['dog', 'cat']);

  React.useEffect(() => {
    if (!isOpen) return;
    setActiveTab('info');
    if (initialData) {
      setFormData({
        name: initialData.name,
        species: initialData.species,
        breed: initialData.breed,
        gender: initialData.gender,
        status: initialData.status,
        description: initialData.description,
        photos: initialData.photos,
        ageMonths: initialData.ageMonths
      });
    } else {
      setFormData({
        name: '',
        species: 'dog',
        breed: '',
        gender: 'male',
        status: 'available',
        description: '',
        photos: [],
        ageMonths: undefined
      });
    }
    setMainPhoto(null);
    setExtraPhotos([]);
    setErrors({});
    setSubmitError('');
  }, [isOpen, initialData]);

  useEffect(() => {
    getAnimalSpecies()
      .then((list) => {
        if (Array.isArray(list) && list.length) {
          setSpeciesOptions(list);
        }
      })
      .catch(() => {
        /* ignore */
      });
  }, []);

  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <motion.div initial={{
      opacity: 0,
      scale: 0.95
    }} animate={{
      opacity: 1,
      scale: 1
    }} className="bg-white rounded-2xl shadow-xl max-w-2xl w-full my-8 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">
            {initialData ? 'Редактирование карточки' : 'Новое животное'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-100 px-6">
          <button onClick={() => setActiveTab('info')} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Основное
          </button>
          <button onClick={() => setActiveTab('photos')} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'photos' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Фото
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'info' && <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имя
                </label>
                <input type="text" className="w-full h-11 rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500 px-3" value={formData.name} onChange={e => setFormData({
                ...formData,
                name: e.target.value
              })} placeholder="Например: Марсик" />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Вид
                </label>
                <div className="relative">
                  <select className="w-full h-11 rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500 pr-10 appearance-none" value={formData.species} onChange={e => setFormData({
                ...formData,
                species: e.target.value as Animal['species']
              })}>
                    {speciesOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt.toLowerCase() === 'dog' ? 'Собака' : opt.toLowerCase() === 'cat' ? 'Кошка' : opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.species && <p className="text-xs text-red-600 mt-1">{errors.species}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Порода
                </label>
                <input type="text" className="w-full h-11 rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500 px-3" value={formData.breed} onChange={e => setFormData({
                ...formData,
                breed: e.target.value
              })} placeholder="Например: дворняга" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Возраст (месяцев)
                </label>
                <input type="number" min={0} className="w-full h-11 rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500 px-3" value={formData.ageMonths ?? ''} onChange={e => setFormData({
                ...formData,
                ageMonths: Number(e.target.value)
              })} placeholder="Укажите возраст в месяцах" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Пол
                </label>
                <div className="relative">
                  <select className="w-full h-11 rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500 pr-10 appearance-none" value={formData.gender} onChange={e => setFormData({
                ...formData,
                gender: e.target.value as 'male' | 'female'
              })}>
                    <option value="male">Самец</option>
                    <option value="female">Самка</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.gender && <p className="text-xs text-red-600 mt-1">{errors.gender}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Статус
              </label>
              <div className="relative">
                <select
                  className="w-full h-11 rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-50 pr-10 appearance-none"
                  value={formData.status}
                  disabled={statusLocked}
                  onChange={e => setFormData({
              ...formData,
              status: e.target.value as any
            })}>
                  <option value="quarantine">Карантин</option>
                  <option value="available">Доступен</option>
                  <option value="reserved">Забронирован</option>
                  <option value="adopted">Усыновлен</option>
                  <option value="not_available">Недоступен</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {statusLocked && (
                <p className="text-xs text-gray-500 mt-1">Статус «Пристроен» зафиксирован и не редактируется</p>
              )}
              {errors.status && <p className="text-xs text-red-600 mt-1">{errors.status}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание
              </label>
              <textarea rows={4} className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500 px-3 py-2" value={formData.description} onChange={e => setFormData({
              ...formData,
              description: e.target.value
            })} placeholder="Особенности, состояние, ключевые детали..." />
            </div>
          </div>}

          {activeTab === 'photos' && <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Основное фото
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl cursor-pointer hover:border-amber-400 border-gray-200 bg-gray-50 px-6 py-6">
                    <Upload className="w-6 h-6 text-amber-600 mb-2" />
                    <span className="text-sm text-gray-700 text-center">
                      Выберите главное изображение
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = (e.target.files && e.target.files[0]) || null;
                        setMainPhoto(file);
                      }}
                    />
                  </label>
                </div>
                {mainPhoto && (
                  <div className="text-sm text-gray-700">
                    {mainPhoto.name} <span className="text-xs text-gray-500">{Math.round(mainPhoto.size / 1024)} КБ</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Дополнительные фото
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl cursor-pointer hover:border-amber-400 border-gray-200 bg-gray-50 px-6 py-6">
                    <Upload className="w-6 h-6 text-amber-600 mb-2" />
                    <span className="text-sm text-gray-700 text-center">
                      Добавьте ещё фото (можно несколько)
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setExtraPhotos(files as File[]);
                      }}
                    />
                  </label>
                </div>
                {extraPhotos.length > 0 && (
                  <ul className="text-sm text-gray-700 space-y-1">
                    {extraPhotos.map((file) => (
                      <li key={file.name} className="flex items-center justify-between">
                        <span>{file.name}</span>
                        <span className="text-xs text-gray-500">{Math.round(file.size / 1024)} КБ</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>}
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
          <div className="flex-1">
            {submitError && <div className="text-sm text-red-600">{submitError}</div>}
          </div>
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
            Отмена
          </button>
          <button
            onClick={async () => {
              const localErrors: Record<string, string> = {};
              if (!formData.name?.trim()) localErrors.name = 'Укажите имя';
              if (!formData.species) localErrors.species = 'Выберите вид';
              if (!formData.gender) localErrors.gender = 'Укажите пол';
              if (!formData.status) localErrors.status = 'Выберите статус';
              if (formData.ageMonths != null && formData.ageMonths < 0) localErrors.ageMonths = 'Возраст не может быть отрицательным';
              setErrors(localErrors);
              if (Object.keys(localErrors).length > 0) return;
              setSubmitting(true);
              setSubmitError('');
              const result = await onSave({ ...formData, mainPhoto, extraPhotos });
              if (result?.errors) setErrors(result.errors);
              if (result?.message) setSubmitError(result.message);
              if (result?.ok) {
                setMainPhoto(null);
                setExtraPhotos([]);
                setErrors({});
                setSubmitError('');
                onClose();
              }
              setSubmitting(false);
            }}
            disabled={submitting}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors flex items-center disabled:opacity-60"
          >
            <Save className="w-4 h-4 mr-2" />
            {submitting ? 'Сохраняем...' : 'Сохранить'}
          </button>
        </div>
      </motion.div>
    </div>;
}
