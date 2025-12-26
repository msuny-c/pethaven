import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { StatCard } from '../../components/dashboard/StatCard';
import { Activity, Syringe, AlertTriangle, Clipboard } from 'lucide-react';
import { getAnimals, getMedicalRecords, getUpcomingMedical } from '../../services/api';
import { Animal, MedicalRecord } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
export function VetDashboard() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { primaryRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await getAnimals();
        setAnimals(data);
        // Для витрины загрузим медкарты первых 3 животных
        try {
          const recLists = await Promise.all(data.slice(0, 3).map(a => getMedicalRecords(a.id)));
          const upcoming = await getUpcomingMedical(45);
          const merged = [...recLists.flat(), ...upcoming];
          const unique = merged.reduce<Record<number, MedicalRecord>>((acc, rec) => {
            if (rec.id && !acc[rec.id]) acc[rec.id] = rec;
            return acc;
          }, {});
          setRecords(Object.values(unique));
        } catch {
          setRecords([]);
        }
      } catch (e) {
        console.warn('VetDashboard data load error', e);
        setAnimals([]);
        setRecords([]);
        setError('Не удалось загрузить данные ветеринара. Проверьте права доступа.');
      }
    })();
  }, []);

  const quarantineCount = animals.filter(a => a.status === 'quarantine').length;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const proceduresDue = records.filter(r => r.nextDueDate && new Date(r.nextDueDate) <= now).length;
  const animalNames: Record<number, string> = {};
  animals.forEach((a) => {
    animalNames[a.id] = a.name;
  });
  if (primaryRole !== 'veterinar') {
    return <DashboardLayout title="Кабинет ветеринара">
        <div className="text-center text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-6">
          Доступ к кабинету ветеринара ограничен. Войдите под учёткой ветеринара.
        </div>
      </DashboardLayout>;
  }

  return <DashboardLayout title="Кабинет ветеринара">
      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          {error}
        </div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="На карантине" value={quarantineCount} icon={AlertTriangle} color="bg-red-500" />
        <StatCard title="Требуют внимания" value={proceduresDue} icon={Syringe} color="bg-blue-500" />
        <StatCard title="Всего животных" value={animals.length} icon={Activity} color="bg-green-500" />
        <StatCard title="Записей в карте" value={records.length} icon={Clipboard} color="bg-purple-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Предстоящие вакцинации
        </h3>
        <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[640px]">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
            <tr>
              <th className="px-4 py-2">Животное</th>
              <th className="px-4 py-2">Процедура</th>
              <th className="px-4 py-2">Дата</th>
            </tr>
          </thead>
          <tbody>
            {records.filter(r => r.nextDueDate).map(record => {
            const overdue = record.nextDueDate ? new Date(record.nextDueDate) < new Date() : false;
            return <tr key={record.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/veterinar/medical-records/${record.animalId}`)}>
                  <td className="px-4 py-3 font-medium text-blue-700">
                    {animalNames[record.animalId] || `Животное #${record.animalId}`}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {getProcedureLabel(record.procedure)}
                  </td>
                  <td className="px-4 py-3 text-amber-600 font-medium">
                    <span className={overdue ? 'text-red-600' : ''}>{record.nextDueDate}</span>
                  </td>
                </tr>;
          })}
            {records.filter(r => r.nextDueDate).length === 0 && <tr>
                <td colSpan={3} className="px-4 py-4 text-gray-500 text-center">
                  Нет запланированных процедур
                </td>
              </tr>}
          </tbody>
        </table>
        </div>
      </div>
    </DashboardLayout>;
}

function getProcedureLabel(procedure?: string) {
  switch (procedure) {
    case 'vaccination':
      return 'Вакцинация';
    case 'sterilization':
      return 'Стерилизация';
    case 'microchip':
      return 'Чипирование';
    case 'checkup':
      return 'Плановый осмотр';
    case 'treatment':
      return 'Лечение/обработка';
    default:
      return procedure || 'Процедура';
  }
}
