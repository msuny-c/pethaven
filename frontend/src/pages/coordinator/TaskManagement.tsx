import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { ClipboardList, RefreshCw, Plus } from 'lucide-react';
import { createTask, getAnimals, getTasks } from '../../services/api';
import { Animal, Task } from '../../types';

export function CoordinatorTaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [animals, setAnimals] = useState<Record<number, Animal>>({});
  const [loading, setLoading] = useState(false);
  const [newTask, setNewTask] = useState<{ title: string; description: string; animalId?: number; dueDate?: string }>({
    title: '',
    description: '',
    animalId: undefined,
    dueDate: undefined
  });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [taskList, animalList] = await Promise.all([getTasks(), getAnimals()]);
    setTasks(taskList);
    const map: Record<number, Animal> = {};
    animalList.forEach((a) => (map[a.id] = a));
    setAnimals(map);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    return {
      open: tasks.filter((t) => t.status === 'open').length,
      progress: tasks.filter((t) => t.status === 'in_progress').length,
      done: tasks.filter((t) => t.status === 'completed').length
    };
  }, [tasks]);

  return (
    <DashboardLayout
      title="Управление задачами"
      actions={
        <button
          onClick={loadData}
          className="flex items-center bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Обновить
        </button>
      }
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center mb-3">
          <Plus className="w-4 h-4 text-amber-500 mr-2" />
          <h3 className="font-bold text-gray-900">Создать задачу</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Название"
            className="rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500 px-3 py-2"
            value={newTask.title}
            onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Описание"
            className="rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500 px-3 py-2"
            value={newTask.description}
            onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
          />
          <select
            className="rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500 px-3 py-2"
            value={newTask.animalId || ''}
            onChange={(e) =>
              setNewTask((prev) => ({
                ...prev,
                animalId: e.target.value ? Number(e.target.value) : undefined
              }))
            }
          >
            <option value="">Без животного</option>
            {Object.values(animals).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500 px-3 py-2"
            value={newTask.dueDate || ''}
            onChange={(e) => setNewTask((prev) => ({ ...prev, dueDate: e.target.value || undefined }))}
          />
        </div>
        <div className="mt-3">
          <button
            disabled={saving}
            onClick={async () => {
              if (!newTask.title) return;
              setSaving(true);
              await createTask({
                title: newTask.title,
                description: newTask.description,
                animalId: newTask.animalId,
                dueDate: newTask.dueDate
              });
              await loadData();
              setNewTask({ title: '', description: '', animalId: undefined, dueDate: undefined });
              setSaving(false);
            }}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
          >
            {saving ? 'Создаем...' : 'Создать'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
          <div className="text-sm font-medium text-blue-600 mb-2">Открыто</div>
          <div className="text-3xl font-bold text-blue-900">{stats.open}</div>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
          <div className="text-sm font-medium text-amber-600 mb-2">В работе</div>
          <div className="text-3xl font-bold text-amber-900">{stats.progress}</div>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-xl p-6">
          <div className="text-sm font-medium text-green-600 mb-2">Выполнено</div>
          <div className="text-3xl font-bold text-green-900">{stats.done}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center">
          <ClipboardList className="w-5 h-5 text-amber-500 mr-2" />
          <div className="text-sm text-gray-600">Задачи приюта</div>
          {loading && <div className="ml-3 text-xs text-gray-400">Обновляем...</div>}
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[720px]">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-3">Задача</th>
              <th className="px-6 py-3">Животное</th>
              <th className="px-6 py-3">Срок</th>
              <th className="px-6 py-3">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tasks.map((task) => {
              const animal = task.animalId ? animals[task.animalId] : undefined;
              return (
                <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{task.title}</div>
                    {task.description && (
                      <div className="text-xs text-gray-500">{task.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {animal ? animal.name : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{task.dueDate || '—'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.status === 'open'
                          ? 'bg-blue-100 text-blue-700'
                          : task.status === 'in_progress'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {task.status === 'open'
                        ? 'Открыто'
                        : task.status === 'in_progress'
                          ? 'В работе'
                          : 'Выполнено'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        {tasks.length === 0 && <div className="p-8 text-center text-gray-500">Нет задач</div>}
      </div>
    </DashboardLayout>
  );
}
