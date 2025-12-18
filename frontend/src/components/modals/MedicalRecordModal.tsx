import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { MedicalRecord } from '../../types';
interface MedicalRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Partial<MedicalRecord>) => void;
  animalId: string;
}
export function MedicalRecordModal({
  isOpen,
  onClose,
  onSave,
  animalId
}: MedicalRecordModalProps) {
  const [formData, setFormData] = useState<Partial<MedicalRecord>>({
    animalId,
    date: new Date().toISOString().split('T')[0],
    type: 'checkup',
    description: '',
    nextDueDate: ''
  });
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div initial={{
      opacity: 0,
      scale: 0.95
    }} animate={{
      opacity: 1,
      scale: 1
    }} className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Добавить запись</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дата
            </label>
            <input type="date" className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" value={formData.date} onChange={e => setFormData({
            ...formData,
            date: e.target.value
          })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип процедуры
            </label>
            <select className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" value={formData.type} onChange={e => setFormData({
            ...formData,
            type: e.target.value as any
          })}>
              <option value="checkup">Осмотр</option>
              <option value="vaccination">Вакцинация</option>
              <option value="surgery">Операция</option>
              <option value="treatment">Лечение</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea rows={3} className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" value={formData.description} onChange={e => setFormData({
            ...formData,
            description: e.target.value
          })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Следующий визит (опционально)
            </label>
            <input type="date" className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" value={formData.nextDueDate} onChange={e => setFormData({
            ...formData,
            nextDueDate: e.target.value
          })} />
          </div>
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