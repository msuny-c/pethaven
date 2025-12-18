import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { StatCard } from '../../components/dashboard/StatCard';
import { FileText, Calendar, CheckCircle, Clock } from 'lucide-react';
import { getApplications, getAllInterviews } from '../../services/api';
import { Application, Interview } from '../../types';
import { useNavigate } from 'react-router-dom';
export function CoordinatorDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getApplications().then(setApplications);
    getAllInterviews().then(setInterviews);
  }, []);

  const pendingApps = applications.filter(a => a.status === 'submitted').length;
  const upcomingList = interviews
    .filter(i => i.status === 'scheduled' || i.status === 'confirmed')
    .sort((a, b) => new Date(a.scheduledDatetime).getTime() - new Date(b.scheduledDatetime).getTime());
  const upcomingInterviews = upcomingList.length;
  return <DashboardLayout title="Панель координатора">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Новые заявки" value={pendingApps} icon={FileText} color="bg-blue-500" />
        <StatCard title="Интервью сегодня" value={upcomingInterviews} icon={Calendar} color="bg-amber-500" />
        <StatCard title="Одобрено за месяц" value="12" icon={CheckCircle} color="bg-green-500" />
        <StatCard title="Среднее время ответа" value="4ч" icon={Clock} color="bg-purple-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Ближайшие интервью
        </h3>
        {upcomingList.length > 0 ? <div className="space-y-4">
            {upcomingList.map(interview => {
        const date = new Date(interview.scheduledDatetime);
        return <div key={interview.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 font-bold mr-4">
                    {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      Интервью по заявке #{interview.applicationId}
                    </div>
                    <div className="text-sm text-gray-500">
                      {date.toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button onClick={() => navigate('/coordinator/interviews')} className="text-sm text-blue-600 font-medium hover:underline">
                  Подробнее
                </button>
              </div>;
      })}
          </div> : <p className="text-gray-500">Нет запланированных интервью</p>}
      </div>
    </DashboardLayout>;
}
