import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
interface InterviewCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (outcome: 'approved' | 'rejected', notes: string) => void;
}
export function InterviewCompleteModal({
  isOpen,
  onClose,
  onConfirm
}: InterviewCompleteModalProps) {
  const [outcome, setOutcome] = useState<'approved' | 'rejected'>('approved');
  const [notes, setNotes] = useState('');
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div initial={{
      opacity: 0,
      scale: 0.95
    }} animate={{
      opacity: 1,
      scale: 1
    }} className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              Завершение интервью
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Результат
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center cursor-pointer">
                <input type="radio" name="outcome" checked={outcome === 'approved'} onChange={() => setOutcome('approved')} className="text-green-500 focus:ring-green-500" />
                <span className="ml-2 text-gray-700">Рекомендую к адопции</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input type="radio" name="outcome" checked={outcome === 'rejected'} onChange={() => setOutcome('rejected')} className="text-red-500 focus:ring-red-500" />
                <span className="ml-2 text-gray-700">Не рекомендую</span>
              </label>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Заметки по итогам интервью
            </label>
            <textarea rows={4} className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" placeholder="Опишите впечатления о кандидате, его готовность..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div className="flex space-x-3">
            <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
              Отмена
            </button>
            <button onClick={() => {
            onConfirm(outcome, notes);
            onClose();
          }} className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors flex items-center justify-center">
              <Check className="w-4 h-4 mr-2" />
              Сохранить
            </button>
          </div>
        </div>
      </motion.div>
    </div>;
}