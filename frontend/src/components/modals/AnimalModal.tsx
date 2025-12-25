import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Upload } from 'lucide-react';
import { Animal } from '../../types';
interface AnimalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (animal: Partial<Animal>) => void;
  initialData?: Animal;
}
export function AnimalModal({
  isOpen,
  onClose,
  onSave,
  initialData
}: AnimalModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'medical' | 'behavior' | 'photos'>('info');
  const [formData, setFormData] = useState<Partial<Animal>>(initialData || {
    name: '',
    species: 'dog',
    breed: '',
    age: 0,
    gender: 'male',
    status: 'quarantine',
    description: '',
    behavior: {
      kids: false,
      cats: false,
      dogs: false,
      notes: ''
    },
    photos: []
  });
  const statusLocked = initialData?.status === 'adopted';
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
          <button onClick={() => setActiveTab('medical')} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'medical' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Медицина
          </button>
          <button onClick={() => setActiveTab('behavior')} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'behavior' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Поведение
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
                  <input type="text" className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" value={formData.name} onChange={e => setFormData({
                ...formData,
                name: e.target.value
              })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Вид
                  </label>
                  <select className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" value={formData.species} onChange={e => setFormData({
                ...formData,
                species: e.target.value as 'cat' | 'dog'
              })}>
                    <option value="dog">Собака</option>
                    <option value="cat">Кошка</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Порода
                  </label>
                  <input type="text" className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" value={formData.breed} onChange={e => setFormData({
                ...formData,
                breed: e.target.value
              })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Возраст
                  </label>
                  <input type="number" className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" value={formData.age} onChange={e => setFormData({
                ...formData,
                age: Number(e.target.value)
              })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Пол
                  </label>
                  <select className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" value={formData.gender} onChange={e => setFormData({
                ...formData,
                gender: e.target.value as 'male' | 'female'
              })}>
                    <option value="male">Самец</option>
                    <option value="female">Самка</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Статус
                </label>
                <select
                  className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-50"
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
                {statusLocked && (
                  <p className="text-xs text-gray-500 mt-1">Статус «Пристроен» зафиксирован и не редактируется</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <textarea rows={4} className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" value={formData.description} onChange={e => setFormData({
              ...formData,
              description: e.target.value
            })} />
              </div>
            </div>}

          {activeTab === 'medical' && <div className="space-y-4 text-sm text-gray-600">
              Медицинские отметки и допуск к передаче выставляются ветеринаром после создания карточки.
            </div>}

          {activeTab === 'behavior' && <div className="space-y-6">
              <div className="space-y-4">
                <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500" checked={formData.behavior?.kids} onChange={e => setFormData({
                ...formData,
                behavior: {
                  ...formData.behavior!,
                  kids: e.target.checked
                }
              })} />
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    Ладит с детьми
                  </span>
                </label>

                <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500" checked={formData.behavior?.cats} onChange={e => setFormData({
                ...formData,
                behavior: {
                  ...formData.behavior!,
                  cats: e.target.checked
                }
              })} />
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    Ладит с кошками
                  </span>
                </label>

                <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500" checked={formData.behavior?.dogs} onChange={e => setFormData({
                ...formData,
                behavior: {
                  ...formData.behavior!,
                  dogs: e.target.checked
                }
              })} />
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    Ладит с собаками
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Заметки о поведении
                </label>
                <textarea rows={4} className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" value={formData.behavior?.notes} onChange={e => setFormData({
              ...formData,
              behavior: {
                ...formData.behavior!,
                notes: e.target.value
              }
            })} placeholder="Особенности характера, привычки..." />
              </div>
            </div>}

          {activeTab === 'photos' && <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-100 text-amber-800 text-sm p-4 rounded-lg flex items-start space-x-3">
                <Upload className="w-5 h-5 mt-0.5" />
                <p>
                  Фото теперь загружаются напрямую в хранилище S3. Сохраните карточку, затем откройте страницу питомца и
                  используйте блок «Фото питомца» для загрузки файлов (они автоматически появятся в карточке).
                </p>
              </div>
            </div>}
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
            Отмена
          </button>
          <button onClick={() => {
          onSave(formData);
          onClose();
        }} className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors flex items-center">
            <Save className="w-4 h-4 mr-2" />
            Сохранить
          </button>
        </div>
      </motion.div>
    </div>;
}
