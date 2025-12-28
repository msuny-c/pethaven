import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Calendar, CheckCircle2, Clock, ListChecks } from 'lucide-react';
import { VolunteerShift, TaskShift, Shift } from '../../types';
import { getMyShifts, getShifts, signupShift, updateShiftTask, unsubscribeShift } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { ConfirmModal } from '../../components/modals/ConfirmModal';

const hoursByType: Record<VolunteerShift['shiftType'], number> = {
  morning: 4,
  evening: 4,
  full_day: 8
};

export function VolunteerShifts() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [shifts, setShifts] = useState<VolunteerShift[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState<Shift[]>([]);
  const [hoursModal, setHoursModal] = useState<{ shiftId: number; task: TaskShift } | null>(null);
  const [taskHoursInput, setTaskHoursInput] = useState<number | ''>('');
  const [unsubscribeShiftId, setUnsubscribeShiftId] = useState<number | null>(null);
  const [unsubscribeReason, setUnsubscribeReason] = useState('');

  const load = async () => {
    if (!user) return;
    const [myShifts, allShifts] = await Promise.all([getMyShifts(), getShifts()]);
    const normalized = myShifts.map((s) => ({ ...s, tasks: s.tasks || [] }));
    setShifts(normalized);
    const signedIds = new Set(normalized.filter((s) => s.attendanceStatus !== 'absent').map((s) => s.shiftId));
    setAvailable(allShifts.filter((s) => !signedIds.has(s.id)));
  };

  useEffect(() => {
    load();
  }, [user]);

  const totalShiftHours = (shift: VolunteerShift) => {
    if (!userId) {
      return 0;
    }
    return shift.tasks
      .filter((t) => t.taskState === 'done' && t.completedBy === userId)
      .reduce((sum, t) => sum + (t.workedHours || 0), 0);
  };

  const stats = useMemo(() => {
    const totalHours = shifts.reduce((acc, s) => acc + totalShiftHours(s), 0);
    return {
      total: shifts.length,
      submitted: shifts.filter((s) => s.submittedAt).length,
      approved: shifts.filter((s) => s.approvedAt).length,
      totalHours
    };
  }, [shifts, userId]);

  const hasShiftStarted = (shiftDate: string) => {
    const start = new Date(shiftDate);
    const today = new Date();
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return start.getTime() <= today.getTime();
  };

  const updateTaskLocal = (shiftId: number, taskId: number, patch: Partial<TaskShift>) => {
    setShifts((prev) =>
      prev.map((s) =>
        s.shiftId === shiftId
          ? { ...s, tasks: s.tasks.map((t) => (t.taskId === taskId ? { ...t, ...patch } : t)) }
          : s
      )
    );
  };

  const updateTaskState = async (shiftId: number, task: TaskShift, next: TaskShift['taskState']) => {
    try {
      const shift = shifts.find((s) => s.shiftId === shiftId);
      const locked = shift?.approvedAt;
      if (locked) return;
      if (shift && !hasShiftStarted(shift.shiftDate)) {
        alert('Статусы задач можно менять только после начала смены');
        return;
      }
      if (next === 'done') {
        if (shift && !hasShiftStarted(shift.shiftDate)) {
          alert('Смену можно закрывать только после её начала');
          return;
        }
        setTaskHoursInput(task.workedHours ?? (shift ? hoursByType[shift.shiftType] : 0));
        setHoursModal({ shiftId, task });
        return;
      }
      const saved = await updateShiftTask(shiftId, task.taskId, { taskState: next });
      updateTaskLocal(shiftId, task.taskId, saved);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Не удалось обновить задачу';
      alert(msg);
    }
  };

  const saveTaskHours = async () => {
    if (!hoursModal) return;
    const value = taskHoursInput === '' ? 0 : Math.max(0, Number(taskHoursInput));
    setLoading(true);
    try {
      const saved = await updateShiftTask(hoursModal.shiftId, hoursModal.task.taskId, {
        taskState: 'done',
        workedHours: value
      });
      updateTaskLocal(hoursModal.shiftId, hoursModal.task.taskId, saved);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Не удалось сохранить часы';
      alert(msg);
    } finally {
      setLoading(false);
      setHoursModal(null);
    }
  };

  const statusPill = (shift: VolunteerShift) => {
    if (shift.approvedAt) return { text: 'Закрыта', className: 'bg-green-100 text-green-700' };
    if (shift.attendanceStatus === 'absent') return { text: 'Отписан', className: 'bg-red-100 text-red-700' };
    return { text: 'Записан', className: 'bg-amber-100 text-amber-700' };
  };

  return (
    <DashboardLayout title="Мои смены">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Доступные смены</div>
                  <div className="text-xs text-gray-500">Запишитесь заранее</div>
                </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {available.map((shift) => (
            <div key={shift.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-bold text-gray-900">{shift.shiftDate}</div>
                  <div className="text-xs text-gray-500 capitalize">
                    {shift.shiftType === 'full_day' ? 'Полный день' : shift.shiftType === 'morning' ? 'Утро' : 'Вечер'}
                  </div>
                </div>
              </div>
              <button
                className="w-full mt-2 px-3 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600"
                onClick={async () => {
                  try {
                    await signupShift(shift.id);
                    await load();
                    alert('Вы записаны на смену');
                  } catch (e: any) {
                    alert(e?.response?.data?.message || 'Не удалось записаться');
                  }
                }}
              >
                Записаться
              </button>
            </div>
          ))}
          {available.length === 0 && <div className="text-sm text-gray-500">Свободных смен нет</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl border border-amber-100 bg-amber-50">
          <div className="text-sm text-amber-700 font-medium">Всего смен</div>
          <div className="text-3xl font-bold text-amber-900">{stats.total}</div>
        </div>
        <div className="p-4 rounded-xl border border-green-100 bg-green-50">
          <div className="text-sm text-green-700 font-medium">Часы</div>
          <div className="text-3xl font-bold text-green-900">{stats.totalHours}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        {shifts.map((shift) => {
          const status = statusPill(shift);
          const allDone = shift.tasks.length === 0 || shift.tasks.every((t) => t.taskState === 'done');
          const submitted = !!(shift.submittedAt || shift.approvedAt);
          const locked = !!shift.approvedAt;
          return (
            <div key={shift.shiftId} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 cursor-pointer" onClick={() => setExpanded(expanded === shift.shiftId ? null : shift.shiftId)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">{shift.shiftDate}</div>
                    <div className="text-sm text-gray-600 capitalize">Тип: {shift.shiftType === 'full_day' ? 'Полный день' : shift.shiftType === 'morning' ? 'Утро' : 'Вечер'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.className}`}>{status.text}</span>
                  <span className="text-xs text-gray-500">Часы: {totalShiftHours(shift) || '—'}</span>
                  {!shift.approvedAt && shift.attendanceStatus !== 'absent' && (
                    <button
                      className="text-xs text-red-600 underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUnsubscribeShiftId(shift.shiftId);
                        setUnsubscribeReason('');
                      }}
                    >
                      Отписаться
                    </button>
                  )}
                </div>
              </div>

              {expanded === shift.shiftId && (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <ListChecks className="w-4 h-4" />
                    Задачи на смену
                  </div>
                  {shift.tasks.length === 0 && (
                    <div className="text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4">
                      Задачи пока не назначены.
                    </div>
                  )}
              {shift.tasks.length > 0 && (
                <div className="space-y-3">
                  {shift.tasks.map((task) => (
                    <div key={task.taskId} className="border border-gray-100 rounded-lg p-3">
                      <div className="flex items-center justify-between gap-3">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{task.title || `Задача #${task.taskId}`}</div>
                              {task.animalName && <div className="text-xs text-gray-500">Питомец: {task.animalName}</div>}
                              {task.description && <div className="text-sm text-gray-600 mt-1">{task.description}</div>}
                {task.taskState === 'in_progress' && task.completedByName && (
                  <div className="text-xs text-amber-700 mt-1">В работе: {task.completedByName}</div>
                )}
                              {task.taskState === 'done' && task.completedByName && (
                                <div className="text-xs text-green-700 mt-1">Выполнил: {task.completedByName}</div>
                              )}
                            </div>
                            {shift.attendanceStatus !== 'absent' && (
                              <div className="flex items-center gap-2">
                                {hasShiftStarted(shift.shiftDate) ? (
                                  <>
                                    <select
                                      className="rounded border-gray-300 text-sm"
                                      value={task.taskState || 'open'}
                                      disabled={submitted || locked}
                                      onChange={(e) => updateTaskState(shift.shiftId, task, e.target.value as TaskShift['taskState'])}
                                    >
                                      <option value="open">Открыта</option>
                                      <option value="in_progress">В работе</option>
                                      <option value="done">Готово</option>
                                    </select>
                                    {task.taskState === 'done' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                                  </>
                                ) : (
                                  <span className="text-xs text-gray-500">Доступно после начала смены</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}
            </div>
          );
        })}

        {shifts.length === 0 && (
          <div className="p-8 text-center text-gray-500">Вы ещё не записаны на смены</div>
        )}
      </div>

      {hoursModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setHoursModal(null)}
            >
              ✕
            </button>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <div className="text-lg font-bold text-gray-900">Указать часы для задачи</div>
            </div>
            <div className="text-sm text-gray-600 mb-4">
              {hoursModal.task.title || `Задача #${hoursModal.task.taskId}`}
            </div>
            <div className="space-y-2">
              <label className="block text-sm text-gray-700">Потрачено часов *</label>
              <input
                type="number"
                min={0}
                className="w-full rounded-lg border-gray-300 px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
                value={taskHoursInput}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setTaskHoursInput('');
                    return;
                  }
                  const num = Number(val);
                  setTaskHoursInput(num < 0 ? 0 : num);
                }}
              />
              <p className="text-xs text-gray-500">Отметьте время, которое ушло на выполнение задачи</p>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setHoursModal(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300"
              >
                Отмена
              </button>
              <button
                onClick={saveTaskHours}
                disabled={taskHoursInput === '' || loading}
                className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-60"
              >
                {loading ? 'Сохраняем...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={unsubscribeShiftId !== null}
        onClose={() => setUnsubscribeShiftId(null)}
        onConfirm={async () => {
          if (!unsubscribeShiftId) return;
          try {
            await unsubscribeShift(unsubscribeShiftId, unsubscribeReason.trim());
            await load();
          } catch (err: any) {
            alert(err?.response?.data?.message || 'Не удалось отписаться');
          }
        }}
        title="Отписаться от смены"
        message={
          <div className="space-y-2">
            <label className="text-xs text-gray-600 block">Причина отписки</label>
            <textarea
              className="w-full rounded-lg border-gray-200 px-3 py-2 text-sm focus:ring-amber-500 focus:border-amber-500"
              rows={3}
              value={unsubscribeReason}
              onChange={(e) => setUnsubscribeReason(e.target.value)}
              placeholder="Укажите причину"
            />
          </div>
        } as any
        confirmLabel="Отписаться"
        isDanger
      />
    </DashboardLayout>
  );
}
