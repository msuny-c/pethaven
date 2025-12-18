import React from 'react';
import { FilterState } from '../types';
import { Filter } from 'lucide-react';
interface FilterBarProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
}
export function FilterBar({
  filters,
  setFilters
}: FilterBarProps) {
  return <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 py-4 mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center text-gray-500 font-medium">
            <Filter className="w-5 h-5 mr-2" />
            <span>Фильтры:</span>
          </div>

          <div className="flex flex-wrap gap-4">
            {/* Species Filter */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {(['all', 'cat', 'dog'] as const).map(type => <button key={type} onClick={() => setFilters({
              ...filters,
              species: type
            })} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filters.species === type ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {type === 'all' ? 'Все' : type === 'cat' ? 'Кошки' : 'Собаки'}
                </button>)}
            </div>

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