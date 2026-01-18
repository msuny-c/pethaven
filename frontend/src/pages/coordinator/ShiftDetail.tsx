import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, ClipboardList, Plus, Users, Lock, Trash2 } from 'lucide-react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { ConfirmModal } from '../../components/modals/ConfirmModal';
import {
  getShiftTasks,
  getShifts,
  getTasks,
  assignTaskToShift,
  getShiftVolunteers,
  getUsers,
  closeShift,
  deleteShiftTask
} from '../../services/api';
import { Shift, Task, TaskShift, ShiftVolunteer, UserProfile } from '../../types';

export function CoordinatorShiftDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const shiftId = Number(id);
  const [shift, setShift] = useState<Shift | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assigned, setAssigned] = useState<TaskShift[]>([]);
  const [volunteers, setVolunteers] = useState<ShiftVolunteer[]>([]);
  const [userMap, setUserMap] = useState<Record<number, UserProfile>>({});
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskShift | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!shiftId) return;
      const [shiftsList, tasksList, assignedTasks, volunteersList, usersList] = await Promise.all([
        getShifts(),
        getTasks(),
        getShiftTasks(shiftId),
        getShiftVolunteers(shiftId),
        getUsers()
      ]);
      setShift(shiftsList.find((s) => s.id === shiftId) || null);
      setTasks(tasksList);
      setAssigned(assignedTasks);
      setVolunteers(volunteersList);
      const userDictionary: Record<number, UserProfile> = {};
      usersList.forEach((u) => {
        userDictionary[u.id] = u;
      });
      setUserMap(userDictionary);
    };
    load();
  }, [shiftId]);

  const stats = useMemo(() => {
    const totalVolunteers = volunteers.length;
    const attended = volunteers.filter((v) => v.attendanceStatus === 'attended').length;
    const submitted = volunteers.filter((v) => v.submittedAt).length;
    const approved = volunteers.filter((v) => v.approvedAt).length;
    const totalHours = assigned.filter((t) => t.taskState === 'done').reduce((acc, t) => acc + (t.workedHours || 0), 0);
    const tasksTotal = assigned.length;
    const tasksDone = assigned.filter((t) => t.taskState === 'done').length;
    const tasksInProgress = assigned.filter((t) => t.taskState === 'in_progress').length;
    return { totalVolunteers, attended, submitted, approved, totalHours, tasksTotal, tasksDone, tasksInProgress };
  }, [volunteers, assigned]);

  const shiftClosed = !!shift?.closedAt;
  const tasksCompleted = assigned.length === 0 || assigned.every((t) => t.taskState === 'done');
  const totalTaskHours = assigned.filter((t) => t.taskState === 'done').reduce((sum, t) => sum + (t.workedHours || 0), 0);

  const assign = async () => {
    if (shiftClosed) {
      alert('Смена закрыта, назначение задач недоступно');
      return;
    }
    if (!selectedTask) {
      alert('Выберите задачу');
      return;
    }
    setSaving(true);
    try {
      await assignTaskToShift(Number(selectedTask), shiftId);
      const updated = await getShiftTasks(shiftId);
      setAssigned(updated);
      setSelectedTask('');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (task: TaskShift) => {
    try {
      await deleteShiftTask(shiftId, task.taskId);
      const updated = await getShiftTasks(shiftId);
      setAssigned(updated);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Не удалось удалить задачу';
      alert(msg);
    }
  };

  const handleCloseShift = async () => {
    if (!shift) return;
    try {
      await closeShift(shiftId);
      const [shiftsList, vols] = await Promise.all([getShifts(), getShiftVolunteers(shiftId)]);
      setShift(shiftsList.find((s) => s.id === shiftId) || null);
      setVolunteers(vols);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Не удалось закрыть смену';
      alert(msg);
    }
  };

  if (!shiftId) {
    return (
      <DashboardLayout title="Смена">
        <div className="p-6 text-gray-500">Смена не найдена</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Смена"
      actions={
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300"
        >
          Назад
        </button>
      }
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">
              {shift ? shift.shiftDate : `Смена #${shiftId}`}
            </div>
            {shift && (
              <div className="text-sm text-gray-600 capitalize">
                Тип: {shift.shiftType === 'full_day' ? 'Полный день' : shift.shiftType === 'morning' ? 'Утро' : 'Вечер'}
              </div>
            )}
            <div className="mt-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  shiftClosed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {shiftClosed ? 'Смена закрыта' : 'Открыта'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
          <div className="text-sm text-amber-700 font-medium">Волонтёры</div>
          <div className="text-3xl font-bold text-amber-900">{stats.totalVolunteers}</div>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <div className="text-sm text-blue-700 font-medium">Задачи</div>
          <div className="text-3xl font-bold text-blue-900">
            {stats.tasksDone}/{stats.tasksTotal || 0}
          </div>
        </div>
        <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
          <div className="text-sm text-green-700 font-medium">Часы и статус</div>
          <div className="text-3xl font-bold text-green-900">{stats.totalHours}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            <div className="text-sm text-gray-700 font-semibold">Волонтёры смены</div>
          </div>
          <div className="text-xs text-gray-500">Всего: {volunteers.length}</div>
        </div>
        <div className="divide-y divide-gray-100">
          {volunteers.map((v) => {
            const person = userMap[v.volunteerId];
            const name = person ? `${person.firstName} ${person.lastName}` : `Волонтёр #${v.volunteerId}`;
            const attendanceLabel =
              v.attendanceStatus === 'attended' ? 'На смене' : v.attendanceStatus === 'absent' ? 'Не явился' : 'Записан';
            const attendanceClass =
              v.attendanceStatus === 'attended'
                ? 'bg-green-100 text-green-700'
                : v.attendanceStatus === 'absent'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700';
            return (
              <div key={`${v.shiftId}-${v.volunteerId}`} className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="font-semibold text-gray-900">{name}</div>
                  <div className="text-xs text-gray-500">
                    Сдал: {v.submittedAt ? v.submittedAt.slice(0, 10) : '—'} • Принято: {v.approvedAt ? v.approvedAt.slice(0, 10) : '—'}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${attendanceClass}`}>{attendanceLabel}</span>
                  <span className="text-xs text-gray-600">Часы: {v.workedHours ?? totalTaskHours}</span>
                  {v.cancelReason && <span className="text-xs text-red-600">Отписался: {v.cancelReason}</span>}
                </div>
              </div>
            );
          })}
          {volunteers.length === 0 && <div className="p-6 text-center text-gray-500">Волонтёры пока не записаны</div>}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center">
            <ClipboardList className="w-5 h-5 text-amber-500 mr-2" />
            <div className="text-sm text-gray-600">Задачи смены</div>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="rounded-lg border border-gray-200 px-3 h-10 text-sm text-gray-700 focus:ring-amber-500 focus:border-amber-500"
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              disabled={shiftClosed}
            >
              <option value="">Выберите задачу</option>
              {tasks
                .filter((t) => !assigned.some((a) => a.taskId === t.id))
                .map((t) => (
                <option key={t.id} value={t.id}>
                  #{t.id} — {t.title}
                </option>
              ))}
            </select>
            <button
              onClick={assign}
              disabled={saving || shiftClosed}
              className="flex items-center bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Назначить
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {assigned.map((t) => (
            <div key={t.taskId} className="p-5 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-gray-900">{t.title || `Задача #${t.taskId}`}</div>
                {t.description && <div className="text-sm text-gray-600">{t.description}</div>}
                {t.animalName && <div className="text-xs text-gray-500">Питомец: {t.animalName}</div>}
                {t.taskState === 'in_progress' && t.completedByName && (
                  <div className="text-xs text-amber-700 mt-1">В работе: {t.completedByName}</div>
                )}
                {t.taskState === 'done' && t.completedByName && (
                  <div className="text-xs text-green-700 mt-1">Выполнил: {t.completedByName}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    t.taskState === 'done'
                      ? 'bg-green-100 text-green-700'
                      : t.taskState === 'in_progress'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {t.taskState === 'done' ? 'Готово' : t.taskState === 'in_progress' ? 'В работе' : 'Открыта'}
                </span>
                {!shiftClosed && (
                  <button
                    onClick={() => setTaskToDelete(t)}
                    className="p-2 rounded-lg text-gray-500 hover:text-red-600"
                    title="Удалить задачу"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {assigned.length === 0 && <div className="p-6 text-center text-gray-500">Задачи пока не назначены</div>}
        </div>
      </div>

      {!shiftClosed && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleCloseShift}
            className="px-5 py-3 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50"
            disabled={shiftClosed}
          >
            <Lock className="w-4 h-4 inline mr-2" />
            Закрыть смену
          </button>
        </div>
      )}
      <ConfirmModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={async () => {
          if (taskToDelete) {
            await handleDeleteTask(taskToDelete);
          }
        }}
        title="Удаление задачи"
        message={`Удалить задачу "${taskToDelete?.title || `Задача #${taskToDelete?.taskId}`}" из смены?`}
        confirmLabel="Удалить"
        isDanger
      />
    </DashboardLayout>
  );
}
