import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Calendar, Clock, Plus } from 'lucide-react';
import { assignTaskToShift, createShift, getShifts, getTasks } from '../../services/api';
import { Shift, Task } from '../../types';

const SHIFT_LABEL: Record<Shift['shiftType'], string> = {
  morning: 'Утро',
  evening: 'Вечер',
  full_day: 'Полный день'
};

export function CoordinatorShiftManagement() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newShift, setNewShift] = useState<{ date: string; type: Shift['shiftType'] }>({
    date: '',
    type: 'morning'
  });
  const [saving, setSaving] = useState(false);
  const [assignment, setAssignment] = useState<{ shiftId: string; taskId: string; notes: string }>({
    shiftId: '',
    taskId: '',
    notes: ''
  });

  useEffect(() => {
    const load = async () => {
      const [shiftsData, tasksData] = await Promise.all([getShifts(), getTasks()]);
      setShifts(shiftsData);
      setTasks(tasksData);
    };
    load();
  }, []);

  const stats = useMemo(() => {
    return {
      total: shifts.length,
      morning: shifts.filter((s) => s.shiftType === 'morning').length,
      evening: shifts.filter((s) => s.shiftType === 'evening').length,
      fullDay: shifts.filter((s) => s.shiftType === 'full_day').length
    };
  }, [shifts]);

  const handleCreate = async () => {
    if (!newShift.date) return;
    setSaving(true);
    await createShift({
      shiftDate: newShift.date,
      shiftType: newShift.type
    });
    const updated = await getShifts();
    setShifts(updated);
    setSaving(false);
    setNewShift({ date: '', type: 'morning' });
  };

  return (
    <DashboardLayout title="Управление сменами">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center mb-3">
          <Plus className="w-4 h-4 text-amber-500 mr-2" />
          <h3 className="font-bold text-gray-900">Создать смену</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="date"
            className="rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500 px-4 py-2"
            value={newShift.date}
            onChange={(e) => setNewShift((prev) => ({ ...prev, date: e.target.value }))}
          />
          <select
            className="rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500 px-4 py-2"
            value={newShift.type}
            onChange={(e) => setNewShift((prev) => ({ ...prev, type: e.target.value as Shift['shiftType'] }))}
          >
            <option value="morning">Утро</option>
            <option value="evening">Вечер</option>
            <option value="full_day">Полный день</option>
          </select>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
          >
            {saving ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center mb-3">
          <Plus className="w-4 h-4 text-amber-500 mr-2" />
          <h3 className="font-bold text-gray-900">Назначить задачу на смену</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            className="rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500 px-4 py-2"
            value={assignment.shiftId}
            onChange={(e) => setAssignment((prev) => ({ ...prev, shiftId: e.target.value }))}
          >
            <option value="">Смена</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                #{s.id} — {s.shiftDate}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500 px-4 py-2"
            value={assignment.taskId}
            onChange={(e) => setAssignment((prev) => ({ ...prev, taskId: e.target.value }))}
          >
            <option value="">Задача</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                #{t.id} — {t.title}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Примечания"
            className="rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500 px-4 py-2"
            value={assignment.notes}
            onChange={(e) => setAssignment((prev) => ({ ...prev, notes: e.target.value }))}
          />
          <button
            onClick={async () => {
              if (!assignment.shiftId || !assignment.taskId) return;
              await assignTaskToShift(Number(assignment.taskId), Number(assignment.shiftId), assignment.notes);
              setAssignment({ shiftId: '', taskId: '', notes: '' });
              alert('Задача назначена');
            }}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Назначить
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
          <div className="text-sm text-amber-700 font-medium">Запланировано</div>
          <div className="text-3xl font-bold text-amber-900">{stats.total}</div>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <div className="text-sm text-blue-700 font-medium">Утренние</div>
          <div className="text-3xl font-bold text-blue-900">{stats.morning}</div>
        </div>
        <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
          <div className="text-sm text-purple-700 font-medium">Вечер/день</div>
          <div className="text-3xl font-bold text-purple-900">{stats.evening + stats.fullDay}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center">
          <Calendar className="w-5 h-5 text-amber-500 mr-2" />
          <div className="text-sm text-gray-600">Список смен</div>
        </div>

        <div className="divide-y divide-gray-100">
          {shifts.map((shift) => (
            <div key={shift.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="text-lg font-semibold text-gray-900">
                  {new Date(shift.shiftDate).toLocaleDateString()}
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 inline-flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {SHIFT_LABEL[shift.shiftType]}
                </span>
              </div>
              <div className="text-sm text-gray-500">ID: {shift.id}</div>
            </div>
          ))}

          {shifts.length === 0 && (
            <div className="p-8 text-center text-gray-500">Нет доступных смен</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
