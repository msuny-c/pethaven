import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Shift, MentorAssignment } from '../../types';
import { getShifts, signupShift, getShiftTasks, getMentorAssignments } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export function VolunteerShifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [expandedShift, setExpandedShift] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [signedShifts, setSignedShifts] = useState<number[]>([]);
  const [assignment, setAssignment] = useState<MentorAssignment | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    getShifts().then(setShifts);
    if (user) {
      getMentorAssignments()
        .then((list) => {
          const mine = list.find((a) => a.volunteerId === user.id);
          if (mine) {
            setAssignment(mine);
          }
        })
        .catch(() => {
          setAssignment(null);
        });
    }
  }, [user]);

  const handleSignup = async (shiftId: number) => {
    if (!user) return;
    if (assignment && assignment.allowSelfShifts === false) {
      alert('Нужно завершить стажировку с наставником, чтобы записываться на смены.');
      return;
    }
    setBusy(true);
    try {
      await signupShift(shiftId);
      alert('Вы успешно записались на смену!');
      setSignedShifts((prev) => [...prev, shiftId]);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Не удалось записаться на смену';
      alert(msg);
      const lower = msg.toLowerCase();
      if (lower.includes('already') || lower.includes('уже')) {
        setSignedShifts((prev) => [...prev, shiftId]);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout title="Календарь смен">
      {assignment && assignment.allowSelfShifts === false && (
        <div className="mb-4 bg-amber-50 border border-amber-100 text-amber-800 p-4 rounded-lg">
          <div className="font-semibold">Нужен допуск наставника</div>
          <div className="text-sm">
            Ориентация запланирована на{' '}
            {assignment.orientationDate
              ? new Date(assignment.orientationDate).toLocaleDateString()
              : 'уточните у координатора'}
            . После подтверждения наставником появится возможность записываться на смены.
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {shifts.map((shift) => (
            <div key={shift.id} className="transition-colors hover:bg-gray-50">
              <div
                className="p-6 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedShift(expandedShift === shift.id ? null : shift.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="flex items-center text-gray-900 font-medium">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {shift.shiftDate}
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        shift.shiftType === 'morning'
                          ? 'bg-blue-100 text-blue-700'
                          : shift.shiftType === 'full_day'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {shift.shiftType === 'morning' ? 'Утро' : shift.shiftType === 'full_day' ? 'Полный день' : 'Вечер'}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">Смена открыта для записи</div>
                </div>

                <div className="flex items-center space-x-4">
                  {user && (
                    <button
                      onClick={() => handleSignup(shift.id)}
                      disabled={busy || signedShifts.includes(shift.id) || (assignment && assignment.allowSelfShifts === false)}
                      className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-60"
                    >
                      {signedShifts.includes(shift.id) ? 'Уже записаны' : 'Записаться'}
                    </button>
                  )}
                  {expandedShift === shift.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {expandedShift === shift.id && (
                <div className="px-6 pb-6 pl-12">
                  <h4 className="text-sm font-bold text-gray-900 mb-3">Задачи на смену:</h4>
                  <ShiftTasks shiftId={shift.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

function ShiftTasks({ shiftId }: { shiftId: number }) {
  const [tasks, setTasks] = useState<{ title: string; notes?: string }[]>([]);

  useEffect(() => {
    getShiftTasks(shiftId).then(async (assignments) => {
      // For now only show ids and notes
      const enriched = assignments.map((a) => ({
        title: `Задача #${a.taskId}`,
        notes: a.progressNotes
      }));
      setTasks(enriched);
    });
  }, [shiftId]);

  if (tasks.length === 0) {
    return <p className="text-sm text-gray-500">Задачи назначаются координатором. Проверьте позже.</p>;
  }

  return (
    <ul className="space-y-2">
      {tasks.map((t, idx) => (
        <li key={idx} className="text-sm text-gray-700 list-disc list-inside">
          {t.title}
          {t.notes && <span className="text-gray-500 ml-1">— {t.notes}</span>}
        </li>
      ))}
    </ul>
  );
}
