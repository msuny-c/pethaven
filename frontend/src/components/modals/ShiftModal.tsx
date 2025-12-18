import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { Shift, Task } from '../../types';
interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shift: Partial<Shift>) => void;
}
export function ShiftModal({
  isOpen,
  onClose,
  onSave
}: ShiftModalProps) {
  const [formData, setFormData] = useState<Partial<Shift>>({
    date: '',
    time: 'morning',
    status: 'open',
    tasks: []
  });
  const [tasks, setTasks] = useState<Partial<Task>[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    setTasks([...tasks, {
      id: `temp-${Date.now()}`,
      title: newTaskTitle,
      description: '',
      status: 'pending'
    }]);
    setNewTaskTitle('');
  };
  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div initial={{
      opacity: 0,
      scale: 0.95
    }} animate={{
      opacity: 1,
      scale: 1
    }} className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Создать смену</h3>
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
              Время
            </label>
            <select className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" value={formData.time} onChange={e => setFormData({
            ...formData,
            time: e.target.value as any
          })}>
              <option value="morning">Утро (9:00-13:00)</option>
              <option value="afternoon">День (13:00-17:00)</option>
              <option value="evening">Вечер (17:00-21:00)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Задачи для смены
            </label>
            <div className="flex space-x-2 mb-3">
              <input type="text" placeholder="Название задачи" className="flex-1 rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTask())} />
              <button type="button" onClick={addTask} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {tasks.map(task => <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">{task.title}</span>
                  <button type="button" onClick={() => removeTask(task.id!)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>)}
              {tasks.length === 0 && <p className="text-sm text-gray-400 text-center py-2">
                  Нет добавленных задач
                </p>}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
            Отмена
          </button>
          <button onClick={() => {
          onSave({
            ...formData,
            tasks: tasks as Task[]
          });
          onClose();
        }} className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors flex items-center">
            <Save className="w-4 h-4 mr-2" />
            Сохранить
          </button>
        </div>
      </motion.div>
    </div>;
}