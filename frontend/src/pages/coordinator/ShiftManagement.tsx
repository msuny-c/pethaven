import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Calendar, Clock, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createShift, getShifts, getShiftVolunteers } from '../../services/api';
import { Shift } from '../../types';

const SHIFT_LABEL: Record<Shift['shiftType'], string> = {
  morning: 'Утро',
  evening: 'Вечер',
  full_day: 'Полный день'
};

export function CoordinatorShiftManagement() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [closedMap, setClosedMap] = useState<Record<number, boolean>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [newShift, setNewShift] = useState<{ date: string; type: Shift['shiftType'] }>({ date: '', type: 'morning' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const shiftsData = await getShifts();
      setShifts(shiftsData);
      const statuses = await Promise.all(
        shiftsData.map(async (s) => {
          const vols = await getShiftVolunteers(s.id);
          return { id: s.id, closed: vols.length > 0 && vols.every((v) => v.approvedAt) };
        })
      );
      const statusMap: Record<number, boolean> = {};
      statuses.forEach((item) => (statusMap[item.id] = item.closed));
      setClosedMap(statusMap);
    };
    load();
  }, []);

  const stats = useMemo(() => ({
    total: shifts.length,
    morning: shifts.filter((s) => s.shiftType === 'morning').length,
    evening: shifts.filter((s) => s.shiftType === 'evening').length,
    fullDay: shifts.filter((s) => s.shiftType === 'full_day').length
  }), [shifts]);

  const handleCreateShift = async () => {
    if (!newShift.date) {
      alert('Укажите дату смены');
      return;
    }
    setSaving(true);
    try {
      await createShift({ shiftDate: newShift.date, shiftType: newShift.type });
      const updated = await getShifts();
      setShifts(updated);
      setCreateOpen(false);
      setNewShift({ date: '', type: 'morning' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Управление сменами">
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

        <div className="divide-y divide-gray-100">
          {shifts.map((shift) => {
            return (
              <div key={shift.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div
                  className="flex flex-wrap items-center justify-between gap-3 cursor-pointer"
                  onClick={() => navigate(`/coordinator/shifts/${shift.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/coordinator/shifts/${shift.id}`);
                    }
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-lg font-semibold text-gray-900">
                      {new Date(shift.shiftDate).toLocaleDateString()}
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 inline-flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {SHIFT_LABEL[shift.shiftType]}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${closedMap[shift.id] ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {closedMap[shift.id] ? 'Закрыта' : 'Открыта'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/coordinator/shifts/${shift.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600"
                    >
                      Открыть
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {shifts.length === 0 && <div className="p-8 text-center text-gray-500">Нет доступных смен</div>}
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
