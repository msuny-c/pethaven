import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Calendar, Clock, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createShift, getShifts, getShiftVolunteers, getShiftTasks } from '../../services/api';
import { Shift } from '../../types';

const SHIFT_LABEL: Record<Shift['shiftType'], string> = {
  morning: 'Утро',
  evening: 'Вечер',
  full_day: 'Полный день'
};

export function CoordinatorShiftManagement() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [closedMap, setClosedMap] = useState<Record<number, boolean>>({});
  const [volCountMap, setVolCountMap] = useState<Record<number, number>>({});
  const [taskCountMap, setTaskCountMap] = useState<Record<number, number>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [newShift, setNewShift] = useState<{ date: string; type: Shift['shiftType'] }>({ date: '', type: 'morning' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const loadData = async () => {
    const shiftsData = await getShifts();
    setShifts(shiftsData);
    const volunteerData = await Promise.all(
      shiftsData.map(async (s) => {
        const vols = await getShiftVolunteers(s.id);
        return { id: s.id, vols };
      })
    );
    const tasksData = await Promise.all(
      shiftsData.map(async (s) => {
        const tasks = await getShiftTasks(s.id);
        return { id: s.id, tasks };
      })
    );
    const statusMap: Record<number, boolean> = {};
    const volMap: Record<number, number> = {};
    const taskMap: Record<number, number> = {};
    volunteerData.forEach((item) => {
      statusMap[item.id] = item.vols.length > 0 && item.vols.every((v) => v.approvedAt);
      volMap[item.id] = item.vols.filter((v) => v.attendanceStatus !== 'absent').length;
    });
    tasksData.forEach((item) => {
      taskMap[item.id] = item.tasks.length;
    });
    setClosedMap(statusMap);
    setVolCountMap(volMap);
    setTaskCountMap(taskMap);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateShift = async () => {
    if (!newShift.date) {
      alert('Укажите дату смены');
      return;
    }
    setSaving(true);
    try {
      await createShift({ shiftDate: newShift.date, shiftType: newShift.type });
      await loadData();
      setCreateOpen(false);
      setNewShift({ date: '', type: 'morning' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Управление сменами">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-amber-500 mr-2" />
            <div className="text-sm text-gray-600">Список смен</div>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Создать смену
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[820px]">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-3">Дата</th>
                <th className="px-6 py-3">Тип</th>
                <th className="px-6 py-3">Задач</th>
                <th className="px-6 py-3">Волонтёров</th>
                <th className="px-6 py-3">Статус</th>
                <th className="px-6 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shifts.map((shift) => {
                return (
                  <tr key={shift.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {new Date(shift.shiftDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{SHIFT_LABEL[shift.shiftType]}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{taskCountMap[shift.id] ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{volCountMap[shift.id] ?? '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${closedMap[shift.id] ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {closedMap[shift.id] ? 'Закрыта' : 'Открыта'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/coordinator/shifts/${shift.id}`}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600"
                        >
                          Открыть
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {shifts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Нет доступных смен
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600" onClick={() => setCreateOpen(false)}>
              ✕
            </button>
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-4 h-4 text-amber-500" />
              <div className="text-lg font-bold text-gray-900">Создать смену</div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Дата *</label>
                <input
                  type="date"
                  className="w-full rounded-lg border-gray-300 px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
                  value={newShift.date}
                  onChange={(e) => setNewShift((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Тип смены</label>
                <select
                  className="w-full rounded-lg border-gray-300 px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
                  value={newShift.type}
                  onChange={(e) => setNewShift((prev) => ({ ...prev, type: e.target.value as Shift['shiftType'] }))}
                >
                  <option value="morning">Утро</option>
                  <option value="evening">Вечер</option>
                  <option value="full_day">Полный день</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreateShift}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50"
                >
                  {saving ? 'Сохраняем...' : 'Создать'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
