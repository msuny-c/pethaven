import React from 'react';
import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';
import { Animal } from '../types';
import { useAuth } from '../contexts/AuthContext';
interface AnimalCardProps {
  animal: Animal;
}
export function AnimalCard({
  animal
}: AnimalCardProps) {
  const {
    user
  } = useAuth();
  const primaryRole = user?.roles?.[0];
  // Determine link destination based on role
  const linkPath = primaryRole === 'candidate' ? `/candidate/animals/${animal.id}` : `/animals/${animal.id}`;
  const photo = animal.photos && animal.photos.length > 0 ? animal.photos[0] : 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=900&q=80';
  const ageYears = animal.ageMonths ? Math.max(1, Math.round(animal.ageMonths / 12)) : 1;
  return <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="relative h-64 overflow-hidden">
        <img src={photo} alt={animal.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute bottom-4 left-4">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm ${animal.status === 'available' ? 'bg-green-500 text-white' : animal.status === 'reserved' ? 'bg-amber-500 text-white' : 'bg-gray-500 text-white'}`}>
            {animal.status === 'available' ? 'Ищет дом' : animal.status === 'reserved' ? 'Забронирован' : animal.status === 'quarantine' ? 'На карантине' : 'Усыновлен'}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{animal.name}</h3>
            <p className="text-sm text-gray-500">{animal.breed}</p>
          </div>
          <div className="text-right">
            <span className="block text-lg font-bold text-amber-500">
              ~{ageYears} лет
            </span>
            <span className="text-xs text-gray-400">
              {animal.gender === 'female' ? 'Девочка' : 'Мальчик'}
            </span>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-6 line-clamp-2">
          {animal.description || animal.behavior?.notes || 'Описание уточняется'}
        </p>

        <Link to={linkPath} className="block w-full py-3 px-4 bg-gray-50 hover:bg-amber-50 text-gray-900 hover:text-amber-700 font-medium rounded-lg transition-colors text-center border border-gray-200 hover:border-amber-200 flex items-center justify-center">
          <Info className="w-4 h-4 mr-2" />
          Подробнее
        </Link>
      </div>
    </div>;
}
