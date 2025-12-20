import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { getAnimals } from '../../services/api';
import { Animal } from '../../types';
import { Link } from 'react-router-dom';

export function VolunteerAnimals() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAnimals().then(setAnimals).catch(() => setAnimals([]));
  }, []);

  const filtered = animals.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.breed || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Питомцы">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <input
            type="text"
            placeholder="Поиск по имени или породе"
            className="w-full md:w-1/2 rounded-lg border-gray-200 px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((animal) => (
            <Link
              key={animal.id}
              to={`/volunteer/animals/${animal.id}`}
              className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition bg-gray-50"
            >
              <img
                src={(animal.photos && animal.photos[0]) || 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=400&q=80'}
                alt={animal.name}
                className="w-full h-40 object-cover rounded-lg mb-3"
              />
              <div className="font-semibold text-gray-900">{animal.name}</div>
              <div className="text-sm text-gray-600">{animal.breed}</div>
              <div className="mt-2 text-xs text-gray-500 capitalize">Статус: {animal.status}</div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="text-sm text-gray-500 col-span-full text-center py-8">Нет животных по запросу</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
