import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimalModal } from '../../components/modals/AnimalModal';
import { Animal } from '../../types';
import { createAnimal, getAnimals, updateAnimalStatus } from '../../services/api';

const STATUS_OPTIONS: Array<{ value: Animal['status']; label: string }> = [
  { value: 'quarantine', label: 'Карантин' },
  { value: 'available', label: 'Доступен' },
  { value: 'reserved', label: 'Зарезервирован' },
  { value: 'adopted', label: 'Пристроен' },
  { value: 'not_available', label: 'Недоступен' }
];

export function CoordinatorAnimals() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [openStatusId, setOpenStatusId] = useState<number | null>(null);

  const loadAnimals = () => {
    getAnimals().then(setAnimals);
  };

  useEffect(() => {
    loadAnimals();
  }, []);

  const filteredAnimals = useMemo(() => {
    return animals.filter(
      (a) =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.breed || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [animals, searchTerm]);

  const handleSave = async (animalData: Partial<Animal>) => {
    setIsSaving(true);
    const payload = {
      name: animalData.name || 'Без имени',
      species: animalData.species || 'dog',
      breed: animalData.breed,
      ageMonths:
        animalData.ageMonths ??
        (animalData.age ? Math.max(1, Math.round(animalData.age * 12)) : undefined),
      status: (animalData.status as Animal['status']) || 'quarantine',
      behaviorNotes: animalData.behavior?.notes,
      medicalSummary: animalData.medical
        ? [
            animalData.medical.vaccinated ? 'вакцинирован' : null,
            animalData.medical.sterilized ? 'стерилизован' : null,
            animalData.medical.microchipped ? 'чипирован' : null
          ]
            .filter(Boolean)
            .join(', ')
        : undefined
    };
    await createAnimal(payload);
    await loadAnimals();
    setIsSaving(false);
  };

  const handleStatusChange = async (id: number, status: Animal['status']) => {
    await updateAnimalStatus(id, status);
    setAnimals((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    setOpenStatusId(null);
  };

  return (
    <DashboardLayout
      title="Управление животными"
      actions={
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить животное
        </button>
      }
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск по имени или породе..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-3">Имя / ID</th>
              <th className="px-6 py-3">Вид / Порода</th>
              <th className="px-6 py-3">Возраст</th>
              <th className="px-6 py-3">Статус</th>
              <th className="px-6 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredAnimals.map((animal) => (
              <tr key={animal.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <img
                      src={
                        (animal.photos && animal.photos[0]) ||
                        'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=200&q=80'
                      }
                      alt={animal.name}
                      className="w-10 h-10 rounded-full object-cover mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{animal.name}</div>
                      <div className="text-xs text-gray-500">#{animal.id}</div>
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
                  <div className="space-y-2">
                    <select
                      className="rounded-lg border border-amber-200 bg-white text-sm text-gray-700 px-3 py-1.5"
                      value={animal.status}
                      onChange={(e) => handleStatusChange(animal.id, e.target.value as Animal['status'])}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {animal.pendingAdminReview && (
                      <div className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1">
                        На проверке у администратора
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right text-sm text-gray-400">
                  <Link to={`/coordinator/animals/${animal.id}`} className="text-amber-600 hover:underline">
                    Открыть карточку
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={undefined}
      />

      {isSaving && (
        <div className="text-sm text-gray-500 mt-2">Сохраняем новое животное...</div>
      )}
    </DashboardLayout>
  );
}
