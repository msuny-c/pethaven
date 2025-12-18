import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, FileCheck } from 'lucide-react';
interface TransferCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  isSubmitting?: boolean;
}
export function TransferCompleteModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false
}: TransferCompleteModalProps) {
  const [notes, setNotes] = useState('');
  const [contractSigned, setContractSigned] = useState(false);
  useEffect(() => {
    if (!isOpen) {
      setNotes('');
      setContractSigned(false);
    }
  }, [isOpen]);
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
              Оформление передачи
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6 bg-amber-50 p-4 rounded-lg border border-amber-100">
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" checked={contractSigned} onChange={e => setContractSigned(e.target.checked)} className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500 border-gray-300" />
              <span className="ml-3 font-medium text-gray-900">
                Договор адопции подписан
              </span>
            </label>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Заметки о передаче
            </label>
            <textarea rows={4} className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" placeholder="Паспорт передан, рекомендации даны..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div className="flex space-x-3">
            <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
              Отмена
            </button>
            <button onClick={() => {
            if (contractSigned && !isSubmitting) {
              onConfirm(notes);
            }
          }} disabled={!contractSigned || isSubmitting} className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
              <FileCheck className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Оформляем...' : 'Завершить'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>;
}
