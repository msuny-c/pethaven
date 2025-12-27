import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { CheckSquare } from 'lucide-react';
import { getAnimals, getTasks } from '../../services/api';
import { Animal, Task } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
export function VolunteerTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [animals, setAnimals] = useState<Record<number, Animal>>({});
  useEffect(() => {
    const load = async () => {
      const [taskList, animalList] = await Promise.all([getTasks(), getAnimals()]);
      setTasks(taskList);
      const map: Record<number, Animal> = {};
      animalList.forEach((a) => (map[a.id] = a));
      setAnimals(map);
    };
    load();
  }, []);
  return <DashboardLayout title="Мои задачи">
      <div className="space-y-6">
        {tasks.length > 0 ? tasks.map(task => <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex justify-between items-center hover:bg-gray-50">
            <div>
              <div className="font-medium text-gray-900">
                {task.title}
              </div>
              <div className="text-sm text-gray-500">
                {task.description || 'Задача без описания'}
              </div>
              {task.animalId && <div className="text-xs text-amber-600 mt-1">
                  Питомец: {animals[task.animalId]?.name || `#${task.animalId}`}
                </div>}
              <div className="text-xs text-gray-400 mt-1">
                Статус: {task.status}
              </div>
            </div>
            {task.status === 'completed' && <span className="flex items-center text-green-600 text-sm font-medium">
                <CheckSquare className="w-4 h-4 mr-1" />
                Готово
              </span>}
          </div>) : <div className="text-center py-12 text-gray-500">
            <p>Задачи не найдены.</p>
          </div>}
      </div>
    </DashboardLayout>;
}
