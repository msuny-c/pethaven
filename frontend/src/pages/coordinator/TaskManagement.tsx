import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { ClipboardList, Plus, Calendar, CircleDot, X, Pencil, Trash2 } from 'lucide-react';
import { createTask, deleteTask, getAnimals, getShifts, getShiftTasks, getTasks, updateTask } from '../../services/api';
import { Animal, Shift, Task, TaskShift } from '../../types';
import { ConfirmModal } from '../../components/modals/ConfirmModal';

type TaskForm = { title: string; description: string; animalId?: number };

export function CoordinatorTaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [animals, setAnimals] = useState<Record<number, Animal>>({});
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [taskAssignments, setTaskAssignments] = useState<Record<number, TaskShift[]>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<TaskForm>({ title: '', description: '', animalId: undefined });
  const [formError, setFormError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [taskList, animalList, shiftList] = await Promise.all([getTasks(), getAnimals(), getShifts()]);
    setTasks(taskList);
    const animalMap: Record<number, Animal> = {};
    animalList.forEach((a) => (animalMap[a.id] = a));
    setAnimals(animalMap);
    setShifts(shiftList);

    const assignmentEntries = await Promise.all(
      shiftList.map(async (s) => [s.id, await getShiftTasks(s.id)] as const)
    );
    const byTask: Record<number, TaskShift[]> = {};
    assignmentEntries.forEach(([shiftId, items]) => {
      items.forEach((t) => {
        const arr = byTask[t.taskId] || [];
        arr.push({ ...t, shiftId });
        byTask[t.taskId] = arr;
      });
    });
    setTaskAssignments(byTask);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    return {
      open: tasks.filter((t) => t.status === 'open').length,
      progress: tasks.filter((t) => t.status === 'assigned').length,
      done: tasks.filter((t) => t.status === 'completed').length
    };
  }, [tasks]);

  const statusChip = (task: Task) => {
    const assignments = taskAssignments[task.id] || [];
    const hasAssignments = assignments.length > 0;
    const allDone = hasAssignments && assignments.every((a) => a.taskState === 'done');
    const value =
      hasAssignments && !allDone
        ? 'Назначена'
        : task.status === 'completed' || allDone
          ? 'Готово'
          : task.status === 'assigned'
            ? 'Назначена'
            : 'Открыта';
    const cls =
      value === 'Готово'
        ? 'bg-green-100 text-green-700'
        : value === 'Назначена'
          ? 'bg-blue-100 text-blue-700'
          : 'bg-gray-100 text-gray-700';
    return { value, cls, allDone };
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setFormError('Введите название задачи');
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description?.trim(),
        animalId: form.animalId
      };
      if (editingTask) {
        await updateTask(editingTask.id, payload);
      } else {
        await createTask(payload);
      }
      setForm({ title: '', description: '', animalId: undefined });
      setEditingTask(null);
      setCreateOpen(false);
      await loadData();
    } catch (e: any) {
      setFormError(e?.response?.data?.message || 'Не удалось сохранить задачу');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setForm({
      title: task.title || '',
      description: task.description || '',
      animalId: task.animalId
    });
    setFormError(null);
    setCreateOpen(true);
  };

  const handleDelete = async (task: Task) => {
    try {
      await deleteTask(task.id);
      await loadData();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Не удалось удалить задачу');
    }
  };

  return (
    <DashboardLayout title="Управление задачами">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
          <div className="text-sm font-medium text-blue-600 mb-2">Открыто</div>
          <div className="text-3xl font-bold text-blue-900">{stats.open}</div>
        </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
          <div className="text-sm font-medium text-amber-600 mb-2">Назначено</div>
          <div className="text-3xl font-bold text-amber-900">{stats.progress}</div>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-xl p-6">
          <div className="text-sm font-medium text-green-600 mb-2">Готово</div>
          <div className="text-3xl font-bold text-green-900">{stats.done}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center">
            <ClipboardList className="w-5 h-5 text-amber-500 mr-2" />
            <div className="text-sm text-gray-600">Задачи приюта</div>
          </div>
          <button
            onClick={() => {
              setEditingTask(null);
              setForm({ title: '', description: '', animalId: undefined });
              setFormError(null);
              setCreateOpen(true);
            }}
            className="flex items-center bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить задачу
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[820px]">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-3">Задача</th>
                <th className="px-6 py-3">Животное</th>
                <th className="px-6 py-3">Статус</th>
                <th className="px-6 py-3">Смены</th>
                <th className="px-6 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.map((task) => {
                const animal = task.animalId ? animals[task.animalId] : undefined;
                const assignments = taskAssignments[task.id] || [];
                const status = statusChip(task);
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
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.cls}`}>
                        {status.value}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {assignments.map((a) => (
                          <span
                            key={`${a.shiftId}-${a.taskId}`}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-gray-200 text-xs text-gray-700"
                          >
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {shifts.find((s) => s.id === a.shiftId)?.shiftDate || `Смена #${a.shiftId}`}
                            <CircleDot className={`w-3 h-3 ${a.taskState === 'done' ? 'text-green-500' : a.taskState === 'in_progress' ? 'text-amber-500' : 'text-gray-400'}`} />
                          </span>
                        ))}
                        {assignments.length === 0 && <span className="text-xs text-gray-400">Не назначена</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(task)}
                          className="p-1 text-gray-400 hover:text-amber-600"
                          title="Редактировать"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setTaskToDelete(task)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {tasks.length === 0 && <div className="p-8 text-center text-gray-500">Нет задач</div>}
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => {
                setCreateOpen(false);
                setEditingTask(null);
              }}
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-4 h-4 text-amber-500" />
              <div className="text-lg font-bold text-gray-900">{editingTask ? 'Редактировать задачу' : 'Новая задача'}</div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Название *</label>
                <input
                  type="text"
                  className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500 px-3 py-2"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Описание</label>
                <textarea
                  className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500 px-3 py-2"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Питомец (необязательно)</label>
                <select
                  className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500 px-3 py-2"
                  value={form.animalId || ''}
                  onChange={(e) =>
                    setForm((prev) => ({
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
              </div>
              {formError && <div className="text-sm text-red-600">{formError}</div>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setCreateOpen(false);
                    setEditingTask(null);
                    setForm({ title: '', description: '', animalId: undefined });
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50"
                >
                  {saving ? 'Сохраняем...' : editingTask ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={async () => {
          if (taskToDelete) {
            await handleDelete(taskToDelete);
          }
        }}
        title="Удаление задачи"
        message={`Удалить задачу "${taskToDelete?.title || `Задача #${taskToDelete?.id}`}"? Это действие нельзя отменить.`}
        confirmLabel="Удалить"
        isDanger
      />
    </DashboardLayout>
  );
}
