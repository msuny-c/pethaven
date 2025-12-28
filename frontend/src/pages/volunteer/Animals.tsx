import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { getAnimals } from '../../services/api';
import { Animal } from '../../types';
import { AnimalAvatar } from '../../components/AnimalAvatar';
import { Eye, StickyNote, X } from 'lucide-react';
import { NotesModal } from '../../components/modals/NotesModal';

export function VolunteerAnimals() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Animal['status'] | 'all'>('all');
  const [viewAnimal, setViewAnimal] = useState<Animal | null>(null);
  const [notesAnimal, setNotesAnimal] = useState<Animal | null>(null);

  useEffect(() => {
    getAnimals().then(setAnimals).catch(() => setAnimals([]));
  }, []);

  const filtered = animals.filter(
    (a) =>
      (statusFilter === 'all' || a.status === statusFilter) &&
      (a.name.toLowerCase().includes(search.toLowerCase()) ||
        (a.breed || '').toLowerCase().includes(search.toLowerCase()))
  );

  const statusLabel = (status: Animal['status']) => {
    switch (status) {
      case 'available':
        return 'Доступен';
      case 'reserved':
        return 'Зарезервирован';
      case 'adopted':
        return 'Пристроен';
      case 'quarantine':
        return 'Карантин';
      default:
        return 'Недоступен';
    }
  };

  const statusClass = (status: Animal['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'reserved':
        return 'bg-amber-100 text-amber-800';
      case 'adopted':
        return 'bg-blue-100 text-blue-800';
      case 'quarantine':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout title="Питомцы">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <input
            type="text"
            placeholder="Поиск по имени или породе"
            className="w-full md:w-1/2 rounded-lg border-gray-200 px-3 py-2 h-10 focus:ring-amber-500 focus:border-amber-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded-lg border border-gray-200 px-3 py-2 h-10 text-sm text-gray-700 focus:ring-amber-500 focus:border-amber-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Все статусы</option>
            <option value="available">Доступен</option>
            <option value="reserved">Зарезервирован</option>
            <option value="adopted">Пристроен</option>
            <option value="quarantine">Карантин</option>
            <option value="not_available">Недоступен</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[720px]">
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
              {filtered.map((animal) => {
                return (
                  <tr key={animal.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <AnimalAvatar src={animal.photos?.[0]} name={animal.name} className="mr-3" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {animal.name}
                          </div>
                          <div className="text-xs text-gray-500">#{animal.id}</div>
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass(animal.status)}`}>
                        {statusLabel(animal.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="text-gray-500 hover:text-amber-600"
                          onClick={() => setViewAnimal(animal)}
                          title="Просмотр"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="text-gray-500 hover:text-amber-600"
                          onClick={() => setNotesAnimal(animal)}
                          title="Полевые заметки"
                        >
                          <StickyNote className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
          </table>
          {filtered.length === 0 && <div className="p-8 text-center text-gray-500">Нет животных по запросу</div>}
        </div>
      </div>

      {viewAnimal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600" onClick={() => setViewAnimal(null)}>
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4 mb-4">
              {viewAnimal.photos?.[0] ? (
                <img src={viewAnimal.photos[0]} className="w-16 h-16 rounded-lg object-cover border" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-semibold">
                  {viewAnimal.name?.[0] || '?'}
                </div>
              )}
              <div>
                <div className="text-lg font-bold text-gray-900">{viewAnimal.name}</div>
                <div className="text-sm text-gray-500">#{viewAnimal.id}</div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <div><span className="font-semibold">Вид:</span> {viewAnimal.species === 'cat' ? 'Кошка' : viewAnimal.species === 'dog' ? 'Собака' : viewAnimal.species}</div>
              {viewAnimal.breed && <div><span className="font-semibold">Порода:</span> {viewAnimal.breed}</div>}
              {viewAnimal.ageMonths != null && <div><span className="font-semibold">Возраст:</span> {viewAnimal.ageMonths} мес</div>}
              {viewAnimal.description && <div><span className="font-semibold">Описание:</span> {viewAnimal.description}</div>}
              <div><span className="font-semibold">Статус:</span> {statusLabel(viewAnimal.status)}</div>
            </div>
          </div>
        </div>
      )}

      {notesAnimal && (
        <NotesModal animalId={notesAnimal.id} animalName={notesAnimal.name} onClose={() => setNotesAnimal(null)} />
      )}
    </DashboardLayout>
  );
}
