import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Plus, Calendar, Stethoscope, PawPrint, User, Heart, CheckCircle, AlertCircle } from 'lucide-react';
import { MedicalRecord, Animal } from '../../types';
import { getAnimal, getMedicalRecords, updateAnimalMedical } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export function VetMedicalRecords() {
  const { animalId } = useParams();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [animalName, setAnimalName] = useState<string>('');
  const [animalBreed, setAnimalBreed] = useState<string>('');
  const [animalPhoto, setAnimalPhoto] = useState<string>('');
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { primaryRole } = useAuth();
  const [saving, setSaving] = useState(false);

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
            setAnimalPhoto((animal.photos && animal.photos[0]) || 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=200&q=80');
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
          <p className="text-gray-500">Выберите пациента из списка для просмотра карты</p>
        </div>
      </DashboardLayout>
    );
  }

  const readyForAdoption = animal?.readyForAdoption || animal?.medical?.readyForAdoption;

  return (
    <DashboardLayout
      title={`Медкарта: ${animalName || `Животное #${animalId}`}`}
      actions={
        <div className="flex items-center space-x-2">
          <Plus className="w-4 h-4 text-amber-600" />
          <span className="text-sm text-gray-700">Медкарта</span>
        </div>
      }
    >
      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-6">
            <img src={animalPhoto} alt={animalName} className="w-20 h-20 rounded-xl object-cover mr-4" />
            <div>
              <h3 className="text-xl font-bold text-gray-900">{animalName}</h3>
              <p className="text-sm text-gray-500">{animalBreed}</p>
            </div>
          </div>
          {animal && (
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center">
                <PawPrint className="w-4 h-4 mr-2 text-amber-500" />
                Вид: {animal.species === 'cat' ? 'Кошка' : 'Собака'}
              </div>
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2 text-blue-500" />
                Пол: {animal.gender === 'male' ? 'Самец' : animal.gender === 'female' ? 'Самка' : '—'}
              </div>
              <div className="flex items-center">
                <Heart className="w-4 h-4 mr-2 text-red-500" />
                Статус: {animal.status}
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                Возраст: ~{animal.ageMonths ? Math.max(1, Math.round(animal.ageMonths / 12)) : 1} лет
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
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-gray-900">{record.procedure}</h4>
                            <p className="text-sm text-gray-600">{record.description}</p>
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Plus className="w-4 h-4 mr-2 text-amber-500" />
          Готовность к передаче
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {readyForAdoption ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <AlertCircle className="w-6 h-6 text-amber-500" />
            )}
            <div>
              <div className="font-semibold text-gray-900">
                {readyForAdoption ? 'Подтверждено' : 'Требуется подтверждение'}
              </div>
              <div className="text-sm text-gray-600">
                Ветеринар отмечает готовность питомца к передаче.
              </div>
            </div>
          </div>
          <button
            type="button"
            disabled={readyForAdoption || saving || !animalId}
            onClick={async () => {
              if (!animalId) return;
              setSaving(true);
              try {
                await updateAnimalMedical(Number(animalId), { readyForAdoption: true });
                const animalUpdated = await getAnimal(Number(animalId));
                setAnimal(animalUpdated);
              } catch {
                setError('Не удалось обновить статус готовности');
              } finally {
                setSaving(false);
              }
            }}
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60"
          >
            Подтвердить готовность
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
