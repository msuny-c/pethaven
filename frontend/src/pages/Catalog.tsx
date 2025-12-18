import React, { useEffect, useState } from 'react';
import { AnimalCard } from '../components/AnimalCard';
import { FilterBar } from '../components/FilterBar';
import { FilterState } from '../types';
import { motion } from 'framer-motion';
import { SearchX, Search } from 'lucide-react';
import { getAnimals } from '../services/api';
import { Animal } from '../types';
export function Catalog() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    species: 'all',
    age: 'all'
  });
  const [query, setQuery] = useState('');
  useEffect(() => {
    getAnimals().then(data => setAnimals(data.filter(a => a.status === 'available')));
  }, []);
  const filteredAnimals = animals.filter(animal => {
    const q = query.trim().toLowerCase();
    if (q) {
      const haystack = `${animal.name} ${animal.breed || ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    // Species filter
    if (filters.species !== 'all' && animal.species !== filters.species) return false;
    // Age filter (convert months to years)
    const ageYears = animal.ageMonths ? animal.ageMonths / 12 : 0;
    if (filters.age !== 'all') {
      if (filters.age === 'baby' && ageYears >= 1) return false;
      if (filters.age === 'young' && (ageYears < 1 || ageYears > 3)) return false;
      if (filters.age === 'adult' && (ageYears <= 3 || ageYears > 7)) return false;
      if (filters.age === 'senior' && ageYears <= 7) return false;
    }
    return true;
  });
  return <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Наши питомцы
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Здесь вы можете найти верного друга. Используйте фильтры, чтобы
            подобрать питомца, который идеально впишется в вашу жизнь.
          </p>
          <div className="mt-6 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск по имени или породе..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <FilterBar filters={filters} setFilters={setFilters} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {filteredAnimals.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAnimals.map(animal => <AnimalCard key={animal.id} animal={animal} />)}
          </div> : <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} className="text-center py-20">
            <div className="bg-white p-8 rounded-full inline-flex mb-6 shadow-sm">
              <SearchX className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Никого не найдено
            </h3>
            <p className="text-gray-500">
              Попробуйте изменить параметры фильтрации
            </p>
            <button onClick={() => setFilters({
          species: 'all',
          age: 'all'
        })} className="mt-6 text-amber-600 font-medium hover:text-amber-700 underline">
              Сбросить фильтры
            </button>
          </motion.div>}
      </div>
    </div>;
}
