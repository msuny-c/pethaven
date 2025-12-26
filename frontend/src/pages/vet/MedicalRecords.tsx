import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Plus, Calendar, Stethoscope, PawPrint, User, Heart, CheckCircle, AlertCircle } from 'lucide-react';
import { MedicalRecord, Animal } from '../../types';
import { createMedicalRecord, getAnimal, getMedicalRecords, updateAnimalMedical, updateAnimalStatus } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export function VetMedicalRecords() {
  const { animalId } = useParams();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [animalName, setAnimalName] = useState<string>('');
  const [animalBreed, setAnimalBreed] = useState<string>('');
  const [animalPhoto, setAnimalPhoto] = useState<string>('');
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { primaryRole, user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState<Animal['status'] | null>(null);
  const [readyLocally, setReadyLocally] = useState(false);
  const [newRecord, setNewRecord] = useState({ procedure: '', description: '', nextDueDate: '' });

  useEffect(() => {
    if (animalId) {
      const idNum = Number(animalId);
      (async () => {
      try {
        const animal = await getAnimal(idNum);
        if (animal) {
          setAnimal(animal);
          setAnimalName(animal.name);
          setAnimalBreed(animal.breed || '');
          setAnimalPhoto((animal.photos && animal.photos[0]) || '');
          setReadyLocally(!!(animal.readyForAdoption || animal.medical?.readyForAdoption));
        }
        const recs = await getMedicalRecords(idNum);
        setRecords(recs);
      } catch {
        setRecords([]);
          setError('Не удалось загрузить медкарту. Проверьте права доступа.');
        }
      })();
    }
  }, [animalId]);

  if (primaryRole !== 'veterinar') {
    return (
      <DashboardLayout title="Медицинские карты">
        <div className="text-center text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-6">
          Доступ к медкартам ограничен. Войдите под учёткой ветеринара.
        </div>
      </DashboardLayout>
    );
  }

  if (!animalId) {
    return (
      <DashboardLayout title="Медицинские карты">
        <div className="text-center py-12">
          <p className="text-gray-500">Выберите животное из списка для просмотра медкарты</p>
        </div>
      </DashboardLayout>
    );
  }

  const readyForAdoption = !!(readyLocally || animal?.readyForAdoption || animal?.medical?.readyForAdoption);
  const statusLabel = (status: Animal['status'] | undefined) => {
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

  return (
    <DashboardLayout title={`Медкарта: ${animalName || `Животное #${animalId}`}`}>
      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-6">
            {animalPhoto ? (
              <img src={animalPhoto} alt={animalName} className="w-20 h-20 rounded-xl object-cover mr-4" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xl mr-4">
                {(animalName || 'Ж')[0]}
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-gray-900">{animalName}</h3>
              <p className="text-sm text-gray-500">{animalBreed}</p>
            </div>
          </div>
          {animal && (
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center">
                <PawPrint className="w-4 h-4 mr-2 text-amber-500" />
                Вид: {animal.species === 'cat' ? 'Кошка' : animal.species === 'dog' ? 'Собака' : animal.species}
              </div>
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2 text-blue-500" />
                Пол: {animal.gender === 'male' ? 'Самец' : animal.gender === 'female' ? 'Самка' : '—'}
              </div>
              <div className="flex items-center">
                <Heart className="w-4 h-4 mr-2 text-red-500" />
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusLabel(animal.status).className}`}>
                    {statusLabel(animal.status).text}
                  </span>
                  {animal.status === 'adopted' && (
                    <span className="text-xs text-gray-500">Фиксированный статус</span>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                Возраст: {animal.ageMonths != null ? `${animal.ageMonths} мес` : '—'}
              </div>
              <div className="pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500 mb-2">Управление карантином</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!animal || statusSaving !== null || animal.status === 'adopted' || animal.status === 'reserved'}
                    onClick={async () => {
                      if (!animal) return;
                      setStatusSaving('available');
                      try {
                        await updateAnimalStatus(animal.id, 'available');
                        const updated = await getAnimal(animal.id);
                        setAnimal(updated);
                        setError(null);
                      } catch {
                        setError('Не удалось обновить статус животного');
                      } finally {
                        setStatusSaving(null);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                      animal?.status === 'available'
                        ? 'bg-green-50 text-green-700 border-green-100'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-green-200 hover:text-green-700'
                    } disabled:opacity-60`}
                  >
                    Снять карантин
                  </button>
                  <button
                    type="button"
                    disabled={!animal || statusSaving !== null || animal.status === 'adopted' || animal.status === 'reserved'}
                    onClick={async () => {
                      if (!animal) return;
                      setStatusSaving('quarantine');
                      try {
                        await updateAnimalStatus(animal.id, 'quarantine');
                        const updated = await getAnimal(animal.id);
                        setAnimal(updated);
                        setError(null);
                      } catch {
                        setError('Не удалось обновить статус животного');
                      } finally {
                        setStatusSaving(null);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                      animal?.status === 'quarantine'
                        ? 'bg-red-50 text-red-700 border-red-100'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-red-200 hover:text-red-700'
                    } disabled:opacity-60`}
                  >
                    Отправить на карантин
                  </button>
                </div>
                {(animal?.status === 'adopted' || animal?.status === 'reserved') && (
                  <p className="text-xs text-gray-500 mt-2">
                    Статус закреплён, управление доступно после снятия брони/пристроя.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">История процедур</h3>
          </div>

            <div className="p-6">
              {records.length > 0 ? (
                <div className="space-y-4">
                  {records.map((record) => (
                    <div key={record.id} className="p-4 border border-gray-100 rounded-lg flex items-start space-x-4">
                      <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
                        <Stethoscope className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <h4 className="font-bold text-gray-900">{record.procedure}</h4>
                            <p className="text-sm text-gray-600">{record.description}</p>
                            {record.vetId && (
                              <button
                                onClick={() => {
                                  const target = user && user.id === record.vetId ? '/profile' : `/veterinar/profile/${record.vetId}`;
                                  window.open(target, '_self');
                                }}
                                className="text-xs text-amber-700 hover:underline font-semibold inline-flex items-center gap-1"
                              >
                                <User className="w-3 h-3" />
                                {record.vetFirstName || record.vetLastName ? `${record.vetFirstName || ''} ${record.vetLastName || ''}`.trim() : `Ветеринар #${record.vetId}`}
                              </button>
                            )}
                          </div>
                          {record.nextDueDate && (
                            <div className="text-sm text-gray-500 flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Следующая дата: {record.nextDueDate}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500">Записей пока нет</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
          <div className="flex items-center gap-3">
            {readyForAdoption ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <AlertCircle className="w-6 h-6 text-amber-500" />
            )}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Готовность к передаче</h3>
              <div className="text-sm text-gray-600">
                Ветеринар отмечает готовность питомца к передаче.
              </div>
            </div>
          </div>
          <button
            type="button"
            disabled={saving || !animalId}
            onClick={async () => {
              if (!animalId) return;
              setSaving(true);
              try {
                const nextState = !readyForAdoption;
                await updateAnimalMedical(Number(animalId), { readyForAdoption: nextState });
                const animalUpdated = await getAnimal(Number(animalId));
                setAnimal(animalUpdated);
                setReadyLocally(nextState);
              } catch {
                setError('Не удалось обновить статус готовности');
              } finally {
                setSaving(false);
              }
            }}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold ${
              readyForAdoption
                ? 'bg-green-50 text-green-700 border border-green-100'
                : 'bg-amber-500 text-white hover:bg-amber-600'
            } disabled:opacity-60`}
          >
            {saving ? 'Сохраняем...' : readyForAdoption ? 'Снять готовность' : 'Подтвердить готовность'}
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-amber-50 via-white to-white rounded-xl shadow-sm border border-amber-100 p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center">
            <Plus className="w-4 h-4 text-amber-600 mr-2" />
            <h3 className="font-bold text-gray-900">Новая процедура</h3>
          </div>
          <span className="text-xs text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-3 py-1">
            Заполняется только ветеринаром
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm text-gray-700 block mb-1">Процедура *</label>
            <input
              type="text"
              value={newRecord.procedure}
              onChange={(e) => setNewRecord((prev) => ({ ...prev, procedure: e.target.value }))}
              className="w-full rounded-lg border border-amber-200 bg-white focus:ring-amber-500 focus:border-amber-500 px-3 py-2"
              placeholder="Осмотр, прививка, обработка..."
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-700 block mb-1">Описание *</label>
            <textarea
              rows={2}
              value={newRecord.description}
              onChange={(e) => setNewRecord((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full rounded-lg border border-amber-200 bg-white focus:ring-amber-500 focus:border-amber-500 px-3 py-2"
              placeholder="Кратко: препараты, реакции, рекомендации..."
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-700 block mb-1">Следующая дата</label>
            <input
              type="date"
              value={newRecord.nextDueDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setNewRecord((prev) => ({ ...prev, nextDueDate: e.target.value }))}
              className="w-full rounded-lg border border-amber-200 bg-white focus:ring-amber-500 focus:border-amber-500 px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">Нельзя ставить дату в прошлом</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={async () => {
              if (!animalId || !newRecord.description.trim() || !newRecord.procedure.trim()) {
                setError('Заполните процедуру и описание');
                return;
              }
              if (newRecord.nextDueDate) {
                const selected = new Date(newRecord.nextDueDate).setHours(0, 0, 0, 0);
                const today = new Date().setHours(0, 0, 0, 0);
                if (selected < today) {
                  setError('Дата следующей процедуры не может быть в прошлом');
                  return;
                }
              }
              setSaving(true);
              try {
                await createMedicalRecord({
                  animalId: Number(animalId),
                  procedure: newRecord.procedure.trim(),
                  description: newRecord.description.trim(),
                  nextDueDate: newRecord.nextDueDate || undefined
                });
                const animalUpdated = await getAnimal(Number(animalId));
                setAnimal(animalUpdated);
                const recs = await getMedicalRecords(Number(animalId));
                setRecords(recs);
                setNewRecord({ procedure: '', description: '', nextDueDate: '' });
                setError(null);
              } catch {
                setError('Не удалось добавить процедуру');
              } finally {
                setSaving(false);
              }
            }}
            className="px-5 py-2 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 disabled:opacity-50 shadow-sm"
            disabled={saving}
          >
            Сохранить процедуру
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
