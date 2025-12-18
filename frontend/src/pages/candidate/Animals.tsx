import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { AnimalCard } from '../../components/AnimalCard';
import { getAnimals } from '../../services/api';
import { Animal, FilterState } from '../../types';
import { FilterBar } from '../../components/FilterBar';
import { Search } from 'lucide-react';
export function CandidateAnimals() {
  const [availableAnimals, setAvailableAnimals] = useState<Animal[]>([]);
  const [filters, setFilters] = useState<FilterState>({ species: 'all', age: 'all' });
  const [query, setQuery] = useState('');
  useEffect(() => {
    getAnimals().then(data => setAvailableAnimals(data.filter(a => a.status === 'available')));
  }, []);

  const filtered = availableAnimals.filter((animal) => {
    const q = query.trim().toLowerCase();
    if (q) {
      const haystack = `${animal.name} ${animal.breed || ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.species !== 'all' && animal.species !== filters.species) return false;
    const ageYears = animal.ageMonths ? animal.ageMonths / 12 : 0;
    if (filters.age !== 'all') {
      if (filters.age === 'baby' && ageYears >= 1) return false;
      if (filters.age === 'young' && (ageYears < 1 || ageYears > 3)) return false;
      if (filters.age === 'adult' && (ageYears <= 3 || ageYears > 7)) return false;
      if (filters.age === 'senior' && ageYears <= 7) return false;
    }
    return true;
  });

  return <DashboardLayout title="Каталог животных">
      <div className="mb-4">
        <div className="max-w-xl relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Поиск по имени или породе..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
        <FilterBar filters={filters} setFilters={setFilters} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(animal => <AnimalCard key={animal.id} animal={animal} />)}
      </div>
    </DashboardLayout>;
}
