import React, { useEffect, useState } from 'react';
import { FilterState } from '../types';
import { Filter } from 'lucide-react';
import { getAnimals } from '../services/api';
interface FilterBarProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
}
export function FilterBar({
  filters,
  setFilters
}: FilterBarProps) {
  const [speciesOptions, setSpeciesOptions] = useState<string[]>([]);

  useEffect(() => {
    getAnimals().then((animals) => {
      const unique = Array.from(new Set(animals.filter((a) => a.status === 'available').map((a) => a.species)));
      setSpeciesOptions(unique);
    }).catch(() => setSpeciesOptions([]));
  }, []);

  return <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 py-4 mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center text-gray-500 font-medium">
            <Filter className="w-5 h-5 mr-2" />
            <span>Фильтры:</span>
          </div>

          <div className="flex flex-wrap gap-4">
            {/* Species Filter */}
            <select
              value={filters.species}
              onChange={(e) => setFilters({ ...filters, species: e.target.value })}
              className="bg-gray-100 border-none text-gray-700 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block p-2.5 px-4 cursor-pointer hover:bg-gray-200 transition-colors"
            >
              <option value="all">Все животные</option>
              {speciesOptions.map((s) => (
                <option key={s} value={s}>
                  {s === 'cat' ? 'Кошки' : s === 'dog' ? 'Собаки' : s}
                </option>
              ))}
            </select>

            {/* Age Filter */}
            <select value={filters.age} onChange={e => setFilters({
            ...filters,
            age: e.target.value as FilterState['age']
          })} className="bg-gray-100 border-none text-gray-700 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block p-2.5 px-4 cursor-pointer hover:bg-gray-200 transition-colors">
              <option value="all">Любой возраст</option>
              <option value="baby">Малыши (до 1 года)</option>
              <option value="young">Молодые (1-3 года)</option>
              <option value="adult">Взрослые (3-7 лет)</option>
              <option value="senior">Пожилые (7+ лет)</option>
            </select>
          </div>
        </div>
      </div>
    </div>;
}
