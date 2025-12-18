import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { FileText, Download, Trash2 } from 'lucide-react';
import { getShifts } from '../../services/api';
import { Shift } from '../../types';

export function VolunteerReports() {
  const [shifts, setShifts] = useState<Shift[]>([]);

  useEffect(() => {
    getShifts().then(setShifts);
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
            {shifts.map((shift) => (
              <tr key={shift.id} className="border-b border-gray-100">
                <td className="px-6 py-3 font-medium">{shift.shiftDate}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{shift.shiftType}</td>
                <td className="px-6 py-3 text-sm text-gray-600">Отчёт не добавлен</td>
                <td className="px-6 py-3 text-right space-x-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center">
                    <FileText className="w-4 h-4 mr-1" />
                    Заполнить
                  </button>
                  <button className="text-gray-500 hover:text-gray-700 text-sm font-medium inline-flex items-center">
                    <Download className="w-4 h-4 mr-1" />
                    Скачать
                  </button>
                  <button className="text-red-500 hover:text-red-700 text-sm font-medium inline-flex items-center">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
            {shifts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-6 text-center text-gray-500">
                  Смен пока нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
