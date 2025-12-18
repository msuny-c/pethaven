import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Plus, Calendar, Syringe, Stethoscope, Scissors, Pill } from 'lucide-react';
import { MedicalRecord } from '../../types';
import { getAnimal, getMedicalRecords, createMedicalRecord } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export function VetMedicalRecords() {
  const { animalId } = useParams();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [animalName, setAnimalName] = useState<string>('');
  const [animalBreed, setAnimalBreed] = useState<string>('');
  const [animalPhoto, setAnimalPhoto] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const { primaryRole } = useAuth();
  const [saving, setSaving] = useState(false);
  const toggles = [
    { key: 'vaccination', label: 'Вакцинация', icon: Syringe },
    { key: 'sterilization', label: 'Стерилизация', icon: Scissors },
    { key: 'microchip', label: 'Чипирование', icon: Stethoscope }
  ] as const;

  useEffect(() => {
    if (animalId) {
      const idNum = Number(animalId);
      (async () => {
        try {
          const animal = await getAnimal(idNum);
          if (animal) {
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'vaccination':
        return Syringe;
      case 'checkup':
        return Stethoscope;
      case 'surgery':
        return Scissors;
      case 'treatment':
        return Pill;
      default:
        return Stethoscope;
    }
  };
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'vaccination':
        return 'Вакцинация';
      case 'checkup':
        return 'Плановый осмотр';
      case 'surgery':
        return 'Операция';
      case 'treatment':
        return 'Лечение/обработка';
      case 'sterilization':
        return 'Стерилизация';
      case 'microchip':
        return 'Чипирование';
      default:
        return type;
    }
  };

  const status = {
    vaccination: records.some((r) => r.procedure === 'vaccination'),
    sterilization: records.some((r) => r.procedure === 'sterilization'),
    microchip: records.some((r) => r.procedure === 'microchip')
  };

  const toggleProcedure = async (procedure: 'vaccination' | 'sterilization' | 'microchip') => {
    if (!animalId || saving || status[procedure]) return;
    setSaving(true);
    try {
      await createMedicalRecord({
        animalId: Number(animalId),
        procedure,
        description: procedure === 'vaccination' ? 'Вакцинация выполнена' : procedure === 'sterilization' ? 'Стерилизация выполнена' : 'Чип установлен',
        administeredDate: new Date().toISOString().slice(0, 10),
        vetId: 1
      });
      const updated = await getMedicalRecords(Number(animalId));
      setRecords(updated);
    } catch {
      setError('Не удалось обновить статус процедуры.');
    } finally {
      setSaving(false);
    }
  };

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
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">История процедур</h3>
          </div>

          <div className="p-6">
            {records.length > 0 ? (
              <div className="space-y-4">
                {records
                  .sort((a, b) => new Date(b.administeredDate).getTime() - new Date(a.administeredDate).getTime())
                  .map((record) => {
                    const TypeIcon = getTypeIcon(record.procedure);
                    return (
                      <div key={record.id} className="p-4 border border-gray-100 rounded-lg flex items-start space-x-4">
                        <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
                          <TypeIcon className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="font-bold text-gray-900">{getTypeLabel(record.procedure)}</h4>
                              <p className="text-sm text-gray-600">{record.description}</p>
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {record.administeredDate}
                            </div>
                          </div>
                          {record.nextDueDate && (
                            <div className="text-xs text-amber-600 mt-2">
                              Следующая дата: {record.nextDueDate}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
          Ключевые процедуры
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {toggles.map((item) => {
          const checked = status[item.key];
          const Icon = item.icon;
          return <button key={item.key} type="button" onClick={() => toggleProcedure(item.key)} disabled={checked || saving} className={`flex items-center p-4 rounded-xl border transition ${checked ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50 text-gray-700'} disabled:opacity-60`}>
                <Icon className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">{item.label}</div>
                  <div className="text-xs text-gray-500">{checked ? 'Уже выполнено' : 'Отметить выполнение'}</div>
                </div>
              </button>;
        })}
        </div>
      </div>
    </DashboardLayout>
  );
}
