import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { getAnimals } from '../../services/api';
import { Animal } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AnimalAvatar } from '../../components/AnimalAvatar';
export function VetAnimals() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { primaryRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getAnimals().then(setAnimals).catch(() => {
      setError('Не удалось загрузить список животных. Проверьте права доступа.');
      setAnimals([]);
    });
  }, []);

  if (primaryRole !== 'veterinar') {
    return <DashboardLayout title="Животные">
        <div className="text-center text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-6">
          Доступ к разделу животных ограничен. Войдите под учёткой ветеринара.
        </div>
      </DashboardLayout>;
  }

  const statusLabel = (status: Animal['status']) => {
    switch (status) {
      case 'available':
        return { text: 'Доступен', className: 'bg-green-100 text-green-700' };
      case 'quarantine':
        return { text: 'Карантин', className: 'bg-red-100 text-red-700' };
      case 'reserved':
        return { text: 'Зарезервирован', className: 'bg-amber-100 text-amber-700' };
      case 'adopted':
        return { text: 'Пристроен', className: 'bg-blue-100 text-blue-700' };
      default:
        return { text: 'Недоступен', className: 'bg-gray-100 text-gray-700' };
    }
  };

  return <DashboardLayout title="Животные">
      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          {error}
        </div>}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-3">Животное</th>
              <th className="px-6 py-3">Вид / Порода</th>
              <th className="px-6 py-3">Возраст</th>
              <th className="px-6 py-3">Медицинский статус</th>
              <th className="px-6 py-3">Статус в приюте</th>
              <th className="px-6 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {animals.filter(animal => animal.status !== 'adopted').map(animal => {
            const ready = animal.readyForAdoption || animal.medical?.readyForAdoption;
            const isAdopted = animal.status === 'adopted';
            return <tr key={animal.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/veterinar/medical-records/${animal.id}`)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <AnimalAvatar src={animal.photos?.[0]} name={animal.name} className="mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {animal.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {animal.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {animal.species === 'cat' ? 'Кошка' : animal.species === 'dog' ? 'Собака' : animal.species}
                    </div>
                    <div className="text-xs text-gray-500">{animal.breed}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {animal.ageMonths != null ? `${animal.ageMonths} мес` : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {ready ? (
                        <CheckCircle className="w-4 h-4 text-green-500" title="Готов к передаче" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500" title="Нет допуска к передаче" />
                      )}
                      <span className="text-xs text-gray-600">{ready ? 'Готов к передаче' : 'Требуется допуск'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusLabel(animal.status).className}`}>
                        {statusLabel(animal.status).text}
                      </span>
                    </div>
                    {isAdopted && (
                      <div className="text-xs text-gray-500 mt-1">Статус зафиксирован: питомец пристроен</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center text-sm text-blue-600 font-medium">
                      <Activity className="w-4 h-4 mr-1" />
                      Медкарта
                    </span>
                  </td>
                </tr>;
          })}
          </tbody>
        </table>
        </div>
      </div>
    </DashboardLayout>;
}
