import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { StatCard } from '../../components/dashboard/StatCard';
import { Calendar, Clock, CheckSquare, ShieldCheck } from 'lucide-react';
import { getShifts, getTasks, getMentorAssignments } from '../../services/api';
import { MentorAssignment, Shift, Task } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
export function VolunteerDashboard() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [orientation, setOrientation] = useState<MentorAssignment | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    getShifts().then(setShifts);
    getTasks().then(setTasks);
    getMentorAssignments()
      .then((list) => {
        const uid = user?.id;
        if (!uid) return;
        const entry = list.find((a) => a.volunteerId === uid);
        if (entry) {
          setOrientation(entry);
        }
      })
      .catch(() => setOrientation(null));
  }, [user]);
  return <DashboardLayout title="Кабинет волонтёра">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Мои смены" value={shifts.length} icon={Calendar} color="bg-amber-500" />
        <StatCard title="Активные задачи" value={tasks.filter(t => t.status !== 'completed').length} icon={Clock} color="bg-blue-500" />
        <StatCard title="Задач выполнено" value={tasks.filter(t => t.status === 'completed').length} icon={CheckSquare} color="bg-green-500" />
      </div>
      {orientation && (
        <div className="mb-6 bg-white border border-gray-100 rounded-xl p-4 flex items-start space-x-3">
          <ShieldCheck className="w-5 h-5 text-amber-500 mt-1" />
          <div>
            <div className="font-semibold text-gray-900">
              {orientation.allowSelfShifts
                ? 'Стажировка подтверждена — можно записываться на смены'
                : 'Ожидается подтверждение наставника'}
            </div>
            <div className="text-sm text-gray-600">
              Наставник: {orientation.mentorId ? `#${orientation.mentorId}` : 'не назначен'}.{' '}
              {orientation.orientationDate
                ? `Ориентация: ${new Date(orientation.orientationDate).toLocaleDateString()}`
                : 'Дата ориентации уточняется.'}
            </div>
          </div>
        </div>
      )}

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
