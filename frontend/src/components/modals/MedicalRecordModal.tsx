import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { MedicalRecord } from '../../types';

type MedicalRecordDraft = Pick<MedicalRecord, 'procedure' | 'description' | 'nextDueDate'>;
interface MedicalRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: MedicalRecordDraft) => Promise<{ ok: boolean; message?: string }>;
  initialData?: MedicalRecordDraft;
}
export function MedicalRecordModal({
  isOpen,
  onClose,
  onSave,
  initialData
}: MedicalRecordModalProps) {
  const [formData, setFormData] = useState<MedicalRecordDraft>({
    procedure: '',
    description: '',
    nextDueDate: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      procedure: initialData?.procedure || '',
      description: initialData?.description || '',
      nextDueDate: initialData?.nextDueDate || ''
    });
    setErrors({});
    setSubmitError('');
  }, [isOpen, initialData]);

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
          <h3 className="text-xl font-bold text-gray-900">Добавить процедуру</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Процедура *
            </label>
            <input
              type="text"
              className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500"
              value={formData.procedure}
              onChange={e => setFormData({
                ...formData,
                procedure: e.target.value
              })}
              placeholder="Осмотр, прививка, обработка..."
            />
            {errors.procedure && <p className="text-xs text-red-600 mt-1">{errors.procedure}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание *
            </label>
            <textarea
              rows={3}
              className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500"
              value={formData.description}
              onChange={e => setFormData({
                ...formData,
                description: e.target.value
              })}
              placeholder="Кратко: препараты, реакции, рекомендации..."
            />
            {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Следующая дата (опционально)
            </label>
            <input
              type="date"
              min={today}
              className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500"
              value={formData.nextDueDate || ''}
              onChange={e => setFormData({
                ...formData,
                nextDueDate: e.target.value
              })}
            />
            {errors.nextDueDate && <p className="text-xs text-red-600 mt-1">{errors.nextDueDate}</p>}
            <p className="text-xs text-gray-500 mt-1">Нельзя ставить дату в прошлом</p>
          </div>
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
              if (!formData.procedure.trim()) localErrors.procedure = 'Укажите процедуру';
              if (!formData.description.trim()) localErrors.description = 'Добавьте описание';
              if (formData.nextDueDate) {
                const selected = new Date(formData.nextDueDate).setHours(0, 0, 0, 0);
                const current = new Date().setHours(0, 0, 0, 0);
                if (selected < current) localErrors.nextDueDate = 'Дата не может быть в прошлом';
              }
              setErrors(localErrors);
              if (Object.keys(localErrors).length > 0) return;
              setSubmitting(true);
              setSubmitError('');
              const result = await onSave({
                procedure: formData.procedure.trim(),
                description: formData.description.trim(),
                nextDueDate: formData.nextDueDate || undefined
              });
              if (result?.message) setSubmitError(result.message);
              if (result?.ok) {
                setFormData({
                  procedure: '',
                  description: '',
                  nextDueDate: ''
                });
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
