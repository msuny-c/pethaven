import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, ChevronLeft, ChevronRight, X as Close } from 'lucide-react';
import { getAnimal, getAnimalMedia } from '../services/api';
import { Animal, AnimalMedia } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function AnimalProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [media, setMedia] = useState<AnimalMedia[]>([]);
  const [lightbox, setLightbox] = useState<{ open: boolean; index: number }>({ open: false, index: 0 });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const animalId = Number(id);
    Promise.all([
      getAnimal(animalId).catch(() => null),
      getAnimalMedia(animalId).catch(() => [])
    ]).then(([a, m]) => {
      setAnimal(a);
      setMedia(m);
      setLoading(false);
    });
  }, [id]);

  const mediaPhotos = media.map((m) => m.url || m.fileUrl).filter(Boolean) as string[];
  const basePhoto = (animal?.photos && animal.photos[0]) || null;
  const photoList = [basePhoto, ...mediaPhotos].filter(Boolean) as string[];

  useEffect(() => {
    if (photoList.length < 2 || lightbox.open) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % photoList.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [photoList.length, lightbox.open]);

  useEffect(() => {
    if (currentSlide >= photoList.length) {
      setCurrentSlide(0);
    }
  }, [photoList.length, currentSlide]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">Загружаем карточку...</div>
      </div>;
  }

  if (!animal) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-3">Питомец не найден</p>
          <button onClick={() => navigate('/animals')} className="text-amber-600 hover:text-amber-700 font-medium">
            Вернуться в каталог
          </button>
        </div>
      </div>;
  }

  const statusText = animal.status === 'available' ? 'Доступен' : animal.status === 'reserved' ? 'Зарезервирован' : animal.status === 'quarantine' ? 'На карантине' : 'Пристроен';
  const statusClass = animal.status === 'available' ? 'bg-green-100 text-green-700' : animal.status === 'reserved' ? 'bg-amber-100 text-amber-700' : animal.status === 'quarantine' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700';
  const canApply = animal.status === 'available';
  const ready = animal.readyForAdoption || animal.medical?.readyForAdoption;
  const isCandidate = user?.roles?.includes('candidate');
  const showApplyButton = canApply && (!user || isCandidate);

  const handleApplyClick = () => {
    if (!animal) return;
    if (!user) {
      navigate('/register', { state: { redirectTo: `/candidate/apply/${animal.id}` } });
      return;
    }
    if (isCandidate) {
      navigate(`/candidate/apply/${animal.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4 relative group">
              {photoList.length > 0 ? (
                <img src={photoList[currentSlide]} alt={animal.name} className="w-full h-96 object-cover transition-opacity duration-500" />
              ) : (
                <div className="w-full h-96 flex items-center justify-center text-gray-400">Фото отсутствуют</div>
              )}
              {photoList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setCurrentSlide((prev) => (prev - 1 + photoList.length) % photoList.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentSlide((prev) => (prev + 1) % photoList.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              {photoList.length > 1 && (
                <div className="absolute bottom-3 inset-x-0 flex justify-center gap-2">
                  {photoList.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`w-2 h-2 rounded-full ${currentSlide === i ? 'bg-white' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              )}
              {photoList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setLightbox({ open: true, index: currentSlide })}
                  className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full hover:bg-black/60"
                >
                  Открыть в полноэкранном
                </button>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">О {animal.name}</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                {animal.description || 'Описание уточняется'}
              </p>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
              <div className="mb-6">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusClass}`}>
                  {statusText}
                </span>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Вид:</span>
                  <span className="font-medium text-gray-900">
                    {animal.species === 'cat' ? 'Кошка' : animal.species === 'dog' ? 'Собака' : animal.species}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Порода:</span>
                  <span className="font-medium text-gray-900">{animal.breed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Возраст:</span>
                  <span className="font-medium text-gray-900">{animal.ageMonths != null ? `${animal.ageMonths} мес` : '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Пол:</span>
                  <span className="font-medium text-gray-900">{animal.gender === 'male' ? 'Самец' : animal.gender === 'female' ? 'Самка' : 'Не указан'}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6 mb-6">
                <h4 className="text-sm font-bold text-gray-900 mb-3">Медицинский статус</h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Готов к передаче</span>
                  {ready ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                </div>
              </div>

              {showApplyButton && (
                <button
                  onClick={handleApplyClick}
                  className="w-full bg-amber-500 text-white py-3 rounded-lg font-medium hover:bg-amber-600 transition-colors mb-3"
                >
                  {!user ? 'Зарегистрироваться' : 'Подать заявку из кабинета'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {lightbox.open && photoList.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <button className="absolute top-6 right-6 text-white hover:text-gray-300" onClick={() => setLightbox({ open: false, index: 0 })}>
            <Close className="w-8 h-8" />
          </button>
          <button className="absolute left-6 text-white hover:text-gray-300" onClick={() => setLightbox((prev) => ({ open: true, index: (prev.index - 1 + photoList.length) % photoList.length }))}>
            <ChevronLeft className="w-10 h-10" />
          </button>
          <div className="max-w-5xl w-full">
            <img
              src={photoList[lightbox.index]}
              alt={animal.name}
              className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
          <button className="absolute right-6 text-white hover:text-gray-300" onClick={() => setLightbox((prev) => ({ open: true, index: (prev.index + 1) % photoList.length }))}>
            <ChevronRight className="w-10 h-10" />
          </button>
        </div>
      )}
    </div>
  );
}
