import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { StatCard } from '../../components/dashboard/StatCard';
import { Calendar, Clock, CheckSquare } from 'lucide-react';
import { getShifts, getTasks } from '../../services/api';
import { Shift, Task } from '../../types';
export function VolunteerDashboard() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    getShifts().then(setShifts);
    getTasks().then(setTasks);
  }, []);
  return <DashboardLayout title="Кабинет волонтёра">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Мои смены" value={shifts.length} icon={Calendar} color="bg-amber-500" />
        <StatCard title="Активные задачи" value={tasks.filter(t => t.status !== 'completed').length} icon={Clock} color="bg-blue-500" />
        <StatCard title="Задач выполнено" value={tasks.filter(t => t.status === 'completed').length} icon={CheckSquare} color="bg-green-500" />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Мои предстоящие смены
        </h3>
        {shifts.length > 0 ? <div className="space-y-4">
            {shifts.slice(0, 3).map(shift => <div key={shift.id} className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-amber-800">{shift.shiftDate}</span>
                  <span className="text-sm bg-white px-2 py-1 rounded border border-amber-200 capitalize">
                    {shift.shiftType}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Задачи:</span>{' '}
                  Назначаются координатором
                </div>
              </div>)}
        </div> : <p className="text-gray-500">Вы пока не записаны на смены</p>}
      </div>
    </DashboardLayout>;
}
