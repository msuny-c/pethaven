import React, { useEffect, useState } from 'react';
import { FilterState } from '../types';
import { Search } from 'lucide-react';
import { getAnimalSpecies } from '../services/api';
interface FilterBarProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  query: string;
  onQueryChange: (value: string) => void;
}
export function FilterBar({
  filters,
  setFilters,
  query,
  onQueryChange
}: FilterBarProps) {
  const [speciesOptions, setSpeciesOptions] = useState<string[]>([]);

  useEffect(() => {
    getAnimalSpecies().then(setSpeciesOptions).catch(() => setSpeciesOptions([]));
  }, []);

  return <div className="py-4 mb-8">
      <div className="w-full">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6 justify-between">
          <div className="w-full lg:flex-1 relative lg:mr-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск по имени или породе..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div className="flex-1 w-full flex flex-wrap gap-3 items-center lg:justify-end">
            <select
              value={filters.species}
              onChange={(e) => setFilters({ ...filters, species: e.target.value })}
              className="h-11 min-w-[170px] bg-gray-100 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 px-4 cursor-pointer hover:bg-gray-200 transition-colors"
            >
              <option value="all">Все животные</option>
              {speciesOptions.map((s) => (
                <option key={s} value={s}>
                  {s === 'cat' ? 'Кошки' : s === 'dog' ? 'Собаки' : s}
                </option>
              ))}
            </select>
            <select value={filters.age} onChange={e => setFilters({
            ...filters,
            age: e.target.value as FilterState['age']
          })} className="h-11 min-w-[170px] bg-gray-100 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 px-4 cursor-pointer hover:bg-gray-200 transition-colors">
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
