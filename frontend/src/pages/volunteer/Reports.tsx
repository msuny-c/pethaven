import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { FileText, Download } from 'lucide-react';
import { getMyShifts } from '../../services/api';
import { VolunteerShift } from '../../types';

export function VolunteerReports() {
  const [shifts, setShifts] = useState<VolunteerShift[]>([]);

  useEffect(() => {
    getMyShifts().then(setShifts);
  }, []);

  return (
    <DashboardLayout title="Отчёты смен">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-3">Дата</th>
              <th className="px-6 py-3">Тип смены</th>
              <th className="px-6 py-3">Отчёт</th>
              <th className="px-6 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {shifts.filter((s) => s.submittedAt || s.approvedAt).map((shift) => (
              <tr key={shift.shiftId} className="border-b border-gray-100">
                <td className="px-6 py-3 font-medium">{shift.shiftDate}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{shift.shiftType}</td>
                <td className="px-6 py-3 text-sm text-gray-600">
                  {shift.approvedAt ? 'Принят' : 'Отправлен'}
                </td>
                <td className="px-6 py-3 text-right space-x-2">
                  <button className="text-gray-500 hover:text-gray-700 text-sm font-medium inline-flex items-center">
                    <Download className="w-4 h-4 mr-1" />
                    Скачать
                  </button>
                </td>
              </tr>
            ))}
            {shifts.filter((s) => s.submittedAt || s.approvedAt).length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-6 text-center text-gray-500">
                  Отчётов пока нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
