import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, CheckCircle, Shield, RefreshCw } from 'lucide-react';
import { getAnimals, updateAnimalStatus } from '../../services/api';
import { Animal } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
export function VetAnimals() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { primaryRole } = useAuth();
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    getAnimals().then(setAnimals).catch(() => {
      setError('Не удалось загрузить список пациентов. Проверьте права доступа.');
      setAnimals([]);
    });
  }, []);

  if (primaryRole !== 'veterinar') {
    return <DashboardLayout title="Пациенты">
        <div className="text-center text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-6">
          Доступ к разделу пациентов ограничен. Войдите под учёткой ветеринара.
        </div>
      </DashboardLayout>;
  }

  return <DashboardLayout title="Пациенты">
      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          {error}
        </div>}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-3">Пациент</th>
              <th className="px-6 py-3">Вид / Порода</th>
              <th className="px-6 py-3">Возраст</th>
              <th className="px-6 py-3">Медицинский статус</th>
              <th className="px-6 py-3">Статус в приюте</th>
              <th className="px-6 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {animals.map(animal => {
            const needsAttention = !animal.medical?.vaccinated || !animal.medical?.sterilized;
            return <tr key={animal.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <img src={(animal.photos && animal.photos[0]) || 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=200&q=80'} alt={animal.name} className="w-10 h-10 rounded-full object-cover mr-3" />
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
                      {animal.species === 'cat' ? 'Кошка' : 'Собака'}
                    </div>
                    <div className="text-xs text-gray-500">{animal.breed}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    ~{animal.ageMonths ? Math.max(1, Math.round(animal.ageMonths / 12)) : 1} лет
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {animal.medical?.vaccinated ? <CheckCircle className="w-4 h-4 text-green-500" title="Вакцинирован" /> : <AlertTriangle className="w-4 h-4 text-red-500" title="Требуется вакцинация" />}
                      {animal.medical?.sterilized ? <CheckCircle className="w-4 h-4 text-green-500" title="Стерилизован" /> : <AlertTriangle className="w-4 h-4 text-amber-500" title="Не стерилизован" />}
                      {animal.medical?.microchipped && <CheckCircle className="w-4 h-4 text-blue-500" title="Чипирован" />}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 capitalize">
                        {animal.status}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={savingId === animal.id || animal.status === 'quarantine'}
                        onClick={async () => {
                          setSavingId(animal.id);
                          try {
                            await updateAnimalStatus(animal.id, 'quarantine');
                            setAnimals((list) =>
                              list.map((a) => (a.id === animal.id ? { ...a, status: 'quarantine' } : a))
                            );
                            setError(null);
                          } catch (e: any) {
                            const msg = e?.response?.data?.message || 'Не удалось изменить статус';
                            setError(msg);
                          } finally {
                            setSavingId(null);
                          }
                        }}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        Карантин
                      </button>
                      <button
                        disabled={savingId === animal.id || animal.status === 'available'}
                        onClick={async () => {
                          setSavingId(animal.id);
                          try {
                            await updateAnimalStatus(animal.id, 'available');
                            setAnimals((list) =>
                              list.map((a) => (a.id === animal.id ? { ...a, status: 'available' } : a))
                            );
                            setError(null);
                          } catch (e: any) {
                            const msg = e?.response?.data?.message || 'Не удалось изменить статус';
                            setError(msg);
                          } finally {
                            setSavingId(null);
                          }
                        }}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Снять карантин
                      </button>
                    </div>
                    {savingId === animal.id && (
                      <div className="text-xs text-gray-400 mt-1">Сохраняем...</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/veterinar/medical-records/${animal.id}`} className="inline-flex items-center text-sm text-blue-600 font-medium hover:underline">
                      <Activity className="w-4 h-4 mr-1" />
                      Медкарта
                    </Link>
                  </td>
                </tr>;
          })}
          </tbody>
        </table>
      </div>
    </DashboardLayout>;
}
