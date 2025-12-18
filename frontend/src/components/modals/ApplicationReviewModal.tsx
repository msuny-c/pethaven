import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle } from 'lucide-react';
interface ApplicationReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: 'approved' | 'rejected', notes: string) => void;
  type: 'approve' | 'reject';
}
export function ApplicationReviewModal({
  isOpen,
  onClose,
  onConfirm,
  type
}: ApplicationReviewModalProps) {
  const [notes, setNotes] = useState('');
  if (!isOpen) return null;
  const isApprove = type === 'approve';
  const valid = notes.trim().length > 0;
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
              {isApprove ? 'Одобрение заявки' : 'Отклонение заявки'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Комментарий координатора (обязательно)
            </label>
            <textarea rows={4} className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" placeholder={isApprove ? 'Например: Кандидат произвел хорошее впечатление...' : 'Причина отказа'} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div className="flex space-x-3">
            <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
              Отмена
            </button>
            <button onClick={() => {
            if (!valid) return;
            onConfirm(isApprove ? 'approved' : 'rejected', notes.trim());
            onClose();
          }} disabled={!valid} className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors flex items-center justify-center ${isApprove ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed'}`}>
              {isApprove ? <CheckCircle className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
              {isApprove ? 'Одобрить' : 'Отклонить'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>;
}
