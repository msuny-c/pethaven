import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Calendar, Clock, Plus } from 'lucide-react';
import { assignTaskToShift, createShift, getMentorAssignments, assignOrientation, approveOrientation, getShifts, getTasks, getUsers } from '../../services/api';
import { MentorAssignment, Shift, Task, UserProfile } from '../../types';

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
  const [mentorAssignments, setMentorAssignments] = useState<MentorAssignment[]>([]);
  const [volunteers, setVolunteers] = useState<UserProfile[]>([]);
  const [orientationForm, setOrientationForm] = useState<{ volunteerId: string; mentorId: string; orientationDate: string; feedback: string }>({
    volunteerId: '',
    mentorId: '',
    orientationDate: '',
    feedback: ''
  });

  useEffect(() => {
    const load = async () => {
      const [shiftsData, tasksData, users] = await Promise.all([getShifts(), getTasks(), getUsers()]);
      setShifts(shiftsData);
      setTasks(tasksData);
      setVolunteers(users.filter((u) => u.roles.includes('volunteer')));
      getMentorAssignments().then(setMentorAssignments);
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
          <h3 className="font-bold text-gray-900">Стажировка и допуск волонтёров</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
          <select className="rounded-lg border-gray-300 px-3 py-2 focus:ring-amber-500 focus:border-amber-500" value={orientationForm.volunteerId} onChange={(e) => setOrientationForm((prev) => ({ ...prev, volunteerId: e.target.value }))}>
            <option value="">Волонтёр</option>
            {volunteers.map((v) => (
              <option key={v.id} value={v.id}>
                {v.firstName} {v.lastName} (#{v.id})
              </option>
            ))}
          </select>
          <select className="rounded-lg border-gray-300 px-3 py-2 focus:ring-amber-500 focus:border-amber-500" value={orientationForm.mentorId} onChange={(e) => setOrientationForm((prev) => ({ ...prev, mentorId: e.target.value }))}>
            <option value="">Наставник</option>
            {volunteers.map((v) => (
              <option key={v.id} value={v.id}>
                {v.firstName} {v.lastName}
              </option>
            ))}
          </select>
          <input type="date" className="rounded-lg border-gray-300 px-3 py-2 focus:ring-amber-500 focus:border-amber-500" value={orientationForm.orientationDate} onChange={(e) => setOrientationForm((prev) => ({ ...prev, orientationDate: e.target.value }))} />
          <input type="text" placeholder="Комментарий наставника" className="rounded-lg border-gray-300 px-3 py-2 focus:ring-amber-500 focus:border-amber-500" value={orientationForm.feedback} onChange={(e) => setOrientationForm((prev) => ({ ...prev, feedback: e.target.value }))} />
          <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors" onClick={async () => {
            if (!orientationForm.volunteerId || !orientationForm.mentorId) return;
            await assignOrientation({
              volunteerId: Number(orientationForm.volunteerId),
              mentorId: Number(orientationForm.mentorId),
              orientationDate: orientationForm.orientationDate || undefined,
              mentorFeedback: orientationForm.feedback || undefined
            });
            setOrientationForm({ volunteerId: '', mentorId: '', orientationDate: '', feedback: '' });
            const refreshed = await getMentorAssignments();
            setMentorAssignments(refreshed);
          }}>
            Назначить ориентацию
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2">Волонтёр</th>
                <th className="px-3 py-2">Наставник</th>
                <th className="px-3 py-2">Ориентация</th>
                <th className="px-3 py-2">Доступ</th>
                <th className="px-3 py-2 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {volunteers.map((vol) => {
                const assignment = mentorAssignments.find((m) => m.volunteerId === vol.id);
                const mentorName = assignment ? volunteers.find((m) => m.id === assignment.mentorId) : undefined;
                return (
                  <tr key={vol.id}>
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-900">
                        {vol.firstName} {vol.lastName}
                      </div>
                      <div className="text-xs text-gray-500">#{vol.id}</div>
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {mentorName ? `${mentorName.firstName} ${mentorName.lastName}` : 'Не назначен'}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {assignment?.orientationDate
                        ? new Date(assignment.orientationDate).toLocaleDateString()
                        : '—'}
                      {assignment?.mentorFeedback && (
                        <div className="text-xs text-gray-500">{assignment.mentorFeedback}</div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          assignment?.allowSelfShifts
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {assignment?.allowSelfShifts ? 'Допущен' : 'Требует допуска'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {!assignment?.allowSelfShifts && assignment && (
                        <button
                          className="text-sm text-blue-600 font-medium"
                          onClick={async () => {
                            await approveOrientation({ volunteerId: vol.id, allowSelfShifts: true });
                            const refreshed = await getMentorAssignments();
                            setMentorAssignments(refreshed);
                          }}
                        >
                          Допустить к сменам
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
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
