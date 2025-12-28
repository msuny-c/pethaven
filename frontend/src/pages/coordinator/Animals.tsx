import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Plus, Search, Edit2, StickyNote, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimalModal } from '../../components/modals/AnimalModal';
import { NotesModal } from '../../components/modals/NotesModal';
import { Animal } from '../../types';
import { createAnimal, deleteAnimalMedia, getAnimals, uploadAnimalMedia, updateAnimal, requestAnimalReview } from '../../services/api';
import { AnimalAvatar } from '../../components/AnimalAvatar';

export function CoordinatorAnimals() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | undefined>(undefined);
  const [notesAnimal, setNotesAnimal] = useState<Animal | undefined>(undefined);
  const [adminComment, setAdminComment] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Animal['status'] | 'all'>('all');

  const loadAnimals = () => {
    getAnimals().then(setAnimals);
  };

  useEffect(() => {
    loadAnimals();
  }, []);

  const filteredAnimals = useMemo(() => {
    return animals.filter((a) => {
      const matchesSearch =
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.breed || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [animals, searchTerm, statusFilter]);

  const handleSave = async (animalData: Partial<Animal> & { mainPhoto?: File | null; extraPhotos?: File[] }) => {
    setIsSaving(true);
    try {
      const payload = {
        name: animalData.name || 'Без имени',
        species: animalData.species || 'dog',
        breed: animalData.breed,
        ageMonths: animalData.ageMonths ?? null,
        gender: animalData.gender || 'male',
        status: (animalData.status as Animal['status']) || 'quarantine',
        description: animalData.description
      };
      const hasNewMedia = Boolean(animalData.mainPhoto || (animalData.extraPhotos && animalData.extraPhotos.length));
      let created = editingAnimal;
      if (editingAnimal) {
        created = await updateAnimal(editingAnimal.id, payload);
      } else {
        created = await createAnimal(payload);
      }
      if (created?.id) {
        if (editingAnimal && hasNewMedia) {
          await deleteAnimalMedia(created.id);
        }
        if (animalData.extraPhotos?.length) {
          for (const file of animalData.extraPhotos) {
            await uploadAnimalMedia(created.id, file);
          }
        }
        if (animalData.mainPhoto) {
          await uploadAnimalMedia(created.id, animalData.mainPhoto);
        }
      }
      await loadAnimals();
      setEditingAnimal(undefined);
      setIsSaving(false);
      return { ok: true };
    } catch (err: any) {
      setIsSaving(false);
      const validation = err?.response?.data?.validation as Record<string, string[]> | undefined;
      const errors: Record<string, string> = {};
      if (validation) {
        Object.entries(validation).forEach(([key, messages]) => {
          const msg = messages && messages[0];
          if (!msg) return;
          const humanKey = key === 'name' ? 'Имя' : key === 'species' ? 'Вид' : key === 'gender' ? 'Пол' : key === 'ageMonths' ? 'Возраст' : key;
          const humanMsg = msg === 'must not be blank' ? 'Поле обязательно' : msg === 'must not be null' ? 'Поле обязательно' : msg;
          errors[key] = `${humanKey}: ${humanMsg}`;
        });
      }
      const message = err?.response?.data?.message || 'Не удалось сохранить карточку';
      return { ok: false, errors: Object.keys(errors).length ? errors : undefined, message };
    }
  };

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
    <DashboardLayout title="Управление животными">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск по имени или породе..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <select
              className="h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:ring-amber-500 focus:border-amber-500"
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
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить животное
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[720px]">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-3">Имя / ID</th>
              <th className="px-6 py-3">Вид / Порода</th>
              <th className="px-6 py-3">Возраст</th>
              <th className="px-6 py-3">Статус</th>
              <th className="px-6 py-3">Проверка</th>
              <th className="px-6 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredAnimals.map((animal) => {
            const isAdopted = animal.status === 'adopted';
            return (
              <tr key={animal.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <AnimalAvatar src={animal.photos?.[0]} name={animal.name} className="mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">{animal.name}</div>
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
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusClass(animal.status)}`}
                  >
                    {statusLabel(animal.status)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {animal.pendingAdminReview ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100" title="На проверке у администратора">
                        ⏳
                      </span>
                    ) : animal.adminReviewComment ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100" title="Отклонено/доработка">
                        ✖
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100" title="Утверждено">
                        ✓
                      </span>
                    )}
                    {animal.adminReviewComment && !animal.pendingAdminReview && (
                      <button
                        onClick={() => setAdminComment(animal.adminReviewComment || null)}
                        className="text-gray-500 hover:text-amber-600"
                        title="Комментарий администратора"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    )}
                    {!animal.pendingAdminReview && !isAdopted && animal.adminReviewComment && (
                      <button
                        onClick={async () => {
                          await requestAnimalReview(animal.id);
                          loadAnimals();
                        }}
                        className="text-amber-600 hover:text-amber-700 text-xs font-semibold underline"
                      >
                        На проверку
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right text-sm text-gray-400">
                    <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingAnimal(animal);
                        setIsModalOpen(true);
                      }}
                      className="text-gray-400 hover:text-blue-600"
                      title="Редактировать"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setNotesAnimal(animal)}
                      className="p-2 rounded-lg text-gray-500"
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
        </div>
      </div>

      <AnimalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAnimal(undefined);
        }}
        onSave={handleSave}
        initialData={editingAnimal}
      />
      {notesAnimal && (
        <NotesModal animalId={notesAnimal.id} animalName={notesAnimal.name} onClose={() => setNotesAnimal(undefined)} />
      )}
      {adminComment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-gray-900">Комментарий администратора</h3>
              <button onClick={() => setAdminComment(null)} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-line">{adminComment}</p>
            <div className="flex justify-end mt-4">
              <button onClick={() => setAdminComment(null)} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600">
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}

      {isSaving && (
        <div className="text-sm text-gray-500 mt-2">Сохраняем новое животное...</div>
      )}
    </DashboardLayout>
  );
}
