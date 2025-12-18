import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { User, Role } from '../../types';
interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Partial<User>) => void;
  initialData?: User;
}
export function UserModal({
  isOpen,
  onClose,
  onSave,
  initialData
}: UserModalProps) {
  const [formData, setFormData] = useState<Partial<User>>(initialData || {
    name: '',
    email: '',
    role: 'candidate',
    phone: '',
    address: ''
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
          <h3 className="text-xl font-bold text-gray-900">
            {initialData ? 'Редактирование пользователя' : 'Добавление пользователя'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
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
              Email
            </label>
            <input type="email" className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" value={formData.email} onChange={e => setFormData({
            ...formData,
            email: e.target.value
          })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            Роль
          </label>
          <select className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" value={formData.role} onChange={e => setFormData({
            ...formData,
            role: e.target.value as Role
          })}>
            <option value="candidate">Кандидат</option>
            <option value="volunteer">Волонтёр</option>
            <option value="veterinar">Ветеринар</option>
            <option value="coordinator">Координатор</option>
            <option value="admin">Администратор</option>
          </select>
        </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Телефон
            </label>
            <input type="text" className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" value={formData.phone || ''} onChange={e => setFormData({
            ...formData,
            phone: e.target.value
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
