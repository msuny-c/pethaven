import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { StatCard } from '../../components/dashboard/StatCard';
import { Calendar, Clock, CheckSquare } from 'lucide-react';
import { getMyShifts } from '../../services/api';
import { VolunteerShift, TaskShift } from '../../types';
export function VolunteerDashboard() {
  const [shifts, setShifts] = useState<VolunteerShift[]>([]);

  useEffect(() => {
    getMyShifts().then(setShifts);
  }, []);
  const activeShifts = useMemo(() => shifts.filter((s) => s.attendanceStatus !== 'absent'), [shifts]);
  const activeShiftTasks: TaskShift[] = useMemo(
    () => activeShifts.filter((s) => !s.approvedAt).flatMap((s) => s.tasks || []),
    [activeShifts]
  );
  const upcomingShifts = activeShifts.filter((s) => !s.approvedAt);
  return <DashboardLayout title="Кабинет волонтёра">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Мои смены" value={activeShifts.length} icon={Calendar} color="bg-amber-500" />
        <StatCard title="Активные задачи" value={activeShiftTasks.filter(t => t.taskState !== 'done').length} icon={Clock} color="bg-blue-500" />
        <StatCard title="Задач выполнено" value={activeShiftTasks.filter(t => t.taskState === 'done').length} icon={CheckSquare} color="bg-green-500" />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Мои предстоящие смены
        </h3>
        {upcomingShifts.length > 0 ? <div className="space-y-4">
            {upcomingShifts.slice(0, 3).map(shift => <div key={shift.shiftId} className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-amber-800">{shift.shiftDate}</span>
                  <span className="text-sm bg-white px-2 py-1 rounded border border-amber-200 capitalize">
                    {shift.shiftType === 'full_day' ? 'Полный день' : shift.shiftType === 'morning' ? 'Утро' : 'Вечер'}
                  </span>
                </div>
              </div>)}
        </div> : <p className="text-gray-500">Нет предстоящих смен</p>}
      </div>
    </DashboardLayout>;
}
