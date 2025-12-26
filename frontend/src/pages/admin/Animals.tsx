import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { AnimalModal } from '../../components/modals/AnimalModal';
import { ConfirmModal } from '../../components/modals/ConfirmModal';
import { Animal } from '../../types';
import { createAnimal, deleteAnimal, getAnimals, reviewAnimal, updateAnimal } from '../../services/api';
export function AdminAnimals() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    try {
      const data = await getAnimals();
      setAnimals(data);
      setError(null);
    } catch (e) {
      console.warn('Animals load error', e);
      setError('Не удалось загрузить животных');
    }
  };

  const filteredAnimals = animals.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || (a.breed || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const handleSave = async (animalData: Partial<Animal>) => {
    if (!animalData.name || !animalData.species) return;
    const payload: any = {
      name: animalData.name,
      species: animalData.species,
      breed: animalData.breed,
      ageMonths: animalData.ageMonths || (animalData.age ? animalData.age * 12 : undefined),
      status: animalData.status
    };
    setSaving(true);
    try {
      if (editingAnimal) {
        await updateAnimal(editingAnimal.id, payload);
      } else {
        await createAnimal(payload);
      }
      await refresh();
      setIsModalOpen(false);
      setEditingAnimal(undefined);
    } catch (e) {
      console.error('Save animal error', e);
      setError('Не удалось сохранить карточку животного');
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteAnimal(deleteId);
        await refresh();
      } catch (e) {
        console.error('Delete animal failed', e);
        setError('Не удалось удалить животное');
      } finally {
        setDeleteId(null);
      }
    }
  };
  const translateStatus = (status: Animal['status']) => {
    switch (status) {
      case 'available':
        return 'Доступен';
      case 'quarantine':
        return 'Карантин';
      case 'reserved':
        return 'Зарезервирован';
      case 'adopted':
        return 'Пристроен';
      default:
        return 'Недоступен';
    }
  };
  const statusClass = (status: Animal['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'quarantine':
        return 'bg-red-100 text-red-800';
      case 'reserved':
        return 'bg-amber-100 text-amber-800';
      case 'adopted':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  return <DashboardLayout title="Управление животными" actions={<button onClick={() => {
    setEditingAnimal(undefined);
    setIsModalOpen(true);
  }} disabled={saving} className="flex items-center bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-60">
          <Plus className="w-4 h-4 mr-2" />
          Добавить животное
        </button>}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Поиск по имени или породе..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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
              <th className="px-6 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredAnimals.map(animal => <tr key={animal.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <img src={(animal.photos && animal.photos[0]) || 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=200&q=80'} alt="" className="w-10 h-10 rounded-full object-cover mr-3" />
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
                    {animal.species === 'cat' ? 'Кошка' : 'Собака'}
                  </div>
                  <div className="text-xs text-gray-500">{animal.breed}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {animal.ageMonths ? Math.max(1, Math.round(animal.ageMonths / 12)) : '—'} лет
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {animal.pendingAdminReview ? (
                      <div className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1 inline-flex">
                        На проверке
                      </div>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${statusClass(animal.status)}`}>
                        {translateStatus(animal.status)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {animal.pendingAdminReview && (
                      <>
                        <button
                          onClick={async () => {
                            try {
                              await reviewAnimal(animal.id, true);
                              await refresh();
                            } catch {
                              setError('Не удалось утвердить карточку');
                            }
                          }}
                          className="text-green-600 hover:underline text-sm"
                        >
                          Утвердить
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await reviewAnimal(animal.id, false);
                              await refresh();
                            } catch {
                              setError('Не удалось отправить на доработку');
                            }
                          }}
                          className="text-amber-600 hover:underline text-sm"
                        >
                          На доработку
                        </button>
                      </>
                    )}
                    <button onClick={() => {
                setEditingAnimal(animal);
                setIsModalOpen(true);
              }} className="text-gray-400 hover:text-blue-600">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteId(animal.id)} className="text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>)}
          </tbody>
        </table>
        </div>
      </div>

      {error && <div className="text-sm text-red-600 mb-4">{error}</div>}

      <AnimalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} initialData={editingAnimal} />

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Удаление животного" message="Вы уверены? Это действие нельзя отменить." isDanger />
    </DashboardLayout>;
}
