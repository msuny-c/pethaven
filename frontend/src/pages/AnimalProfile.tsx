import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Check, ArrowLeft, Share2, AlertCircle, Edit2, Save, XCircle, ChevronDown, ChevronLeft, ChevronRight, X as Close } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAnimal, updateAnimal, getAnimalMedia, uploadAnimalMedia, addAnimalNote, updateAnimalMedical, getAnimalNotes } from '../services/api';
import { Animal, AnimalMedia } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
export function AnimalProfile() {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ name: string; breed?: string; ageMonths?: number; description?: string; status?: Animal['status']; gender?: Animal['gender']; species?: Animal['species'] }>({
    name: '',
    breed: '',
    ageMonths: undefined,
    description: '',
    status: undefined,
    gender: undefined,
    species: undefined
  });
  const [statusOpen, setStatusOpen] = useState(false);
  const [speciesOpen, setSpeciesOpen] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);
  const [media, setMedia] = useState<AnimalMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [photoDescription, setPhotoDescription] = useState('');
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState<{ id: number; animalId: number; authorId: number; note: string; createdAt: string }[]>([]);
  const [medicalForm, setMedicalForm] = useState<{ readyForAdoption?: boolean }>({});
  const [lightbox, setLightbox] = useState<{ open: boolean; index: number }>({ open: false, index: 0 });
  const canEdit = !!user && (user.roles.includes('admin') || user.roles.includes('coordinator'));
  const isVolunteer = !!user && user.roles.includes('volunteer');
  const isVet = !!user && user.roles.includes('veterinar');
  const canManageMedia = canEdit || isVolunteer;
  const canAddNotes = canManageMedia;
  const canEditMedical = isVet || (!!user && user.roles.includes('admin'));
  const statusLocked = animal?.status === 'adopted';
  const statusOptions: Array<{ value: Animal['status']; label: string }> = [
    { value: 'quarantine', label: 'Карантин' },
    { value: 'available', label: 'Доступен' },
    { value: 'reserved', label: 'Зарезервирован' },
    { value: 'adopted', label: 'Пристроен' },
    { value: 'not_available', label: 'Недоступен' }
  ];
  useEffect(() => {
    if (id) {
      getAnimal(Number(id)).then(data => {
        setAnimal(data);
        if (data) {
          setForm({
            name: data.name,
            breed: data.breed,
            ageMonths: data.ageMonths,
            description: data.description || '',
            status: data.status,
            gender: data.gender,
            species: data.species
          });
          setMedicalForm({
            readyForAdoption: data.readyForAdoption ?? data.medical?.readyForAdoption
          });
        }
        setLoading(false);
      });
      getAnimalMedia(Number(id)).then(setMedia).catch(() => setMedia([]));
      getAnimalNotes(Number(id)).then(setNotes).catch(() => setNotes([]));
    }
  }, [id]);
  const isNotFound = !loading && !animal;
  if (isNotFound) {
    return canEdit ? <DashboardLayout title="Питомец не найден">
        <div className="p-8 text-center text-gray-500">Нет данных по питомцу</div>
      </DashboardLayout> : <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Питомец не найден
          </h2>
          <Link to="/animals" className="text-amber-600 hover:underline">
            Вернуться в каталог
          </Link>
        </div>
      </div>;
  }
  if (loading || !animal) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">Загружаем карточку...</div>
      </div>;
  }
  const photoList = media.map((m) => m.url || m.fileUrl).filter(Boolean) as string[];
  const heroPhoto = photoList[0] || (animal.photos && animal.photos[0]) || 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=900&q=80';
  const isCandidate = user?.roles?.includes('candidate');
  const canApply = animal?.status === 'available';
  const closeLightbox = () => setLightbox({ open: false, index: 0 });
  const shiftLightbox = (delta: number) => {
    if (!photoList.length) return;
    setLightbox((prev) => {
      const next = (prev.index + delta + photoList.length) % photoList.length;
      return { open: true, index: next };
    });
  };
  const currentStatus = form.status || animal?.status || 'available';
  const statusBadge = (status: Animal['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-700';
      case 'reserved':
        return 'bg-amber-100 text-amber-700';
      case 'adopted':
        return 'bg-blue-100 text-blue-700';
      case 'quarantine':
        return 'bg-red-100 text-red-700';
      case 'not_available':
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleSave = async () => {
    if (!animal || saving) return;
    setSaving(true);
    try {
      const updated = await updateAnimal(animal.id, {
        name: form.name,
        breed: form.breed,
        ageMonths: form.ageMonths,
        description: form.description,
        status: statusLocked ? animal.status : form.status,
        gender: form.gender,
        species: form.species
      });
      setAnimal(updated);
      setEditing(false);
    } catch {
      alert('Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  const content = <>
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Breadcrumb / Back */}
      {!canEdit && <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link to="/animals" className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад в каталог
          </Link>
        </div>}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Photos */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} className="space-y-4">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-gray-100 shadow-lg relative group cursor-pointer" onClick={() => setLightbox({ open: true, index: 0 })}>
              <img src={heroPhoto} alt={animal.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm">Открыть</div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {photoList.map((url, i) => (
                <div key={i} className="aspect-square rounded-xl bg-gray-100 overflow-hidden cursor-pointer hover:opacity-80 transition" onClick={() => setLightbox({ open: true, index: i })}>
                  <img src={url} alt={animal.name} className="w-full h-full object-cover" />
                </div>
              ))}
              {photoList.length === 0 && [...Array(3)].map((_, i) => <div key={i} className="aspect-square rounded-xl bg-gray-100 overflow-hidden opacity-50" />)}
            </div>
            {canManageMedia && (
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Фото питомца</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input type="file" accept="image/*" onChange={(e) => setFileInput(e.target.files?.[0] || null)} className="text-sm text-gray-700" />
                  <input type="text" placeholder="Описание (необязательно)" value={photoDescription} onChange={(e) => setPhotoDescription(e.target.value)} className="rounded-lg border-gray-300 px-3 py-2 focus:ring-amber-500 focus:border-amber-500" />
                  <button onClick={async () => {
                if (!fileInput || !animal) return;
                setUploading(true);
                try {
                  const saved = await uploadAnimalMedia(animal.id, fileInput, photoDescription || undefined);
                  setMedia((prev) => [saved, ...prev]);
                  setPhotoDescription('');
                  setFileInput(null);
                } catch (err: any) {
                  const msg = err?.response?.data?.message || 'Не удалось загрузить фото';
                  alert(msg);
                } finally {
                  setUploading(false);
                }
              }} disabled={uploading || !fileInput} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-600 disabled:opacity-50">
                    {uploading ? 'Загружаем...' : 'Загрузить'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Файлы загружаются в безопасное хранилище и будут доступны в карточке и каталоге.
                </p>
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          delay: 0.2
        }}>
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6 gap-4">
              <div className="flex-1 min-w-0">
                {editing ? <input className="text-4xl font-bold text-gray-900 mb-2 w-full border-b border-gray-200 focus:outline-none focus:border-amber-500" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /> : <h1 className="text-4xl font-bold text-gray-900 mb-2 truncate">
                      {animal.name}
                    </h1>}
                <div className="text-xl text-gray-500 flex items-center gap-2 flex-wrap">
                  {editing ? <>
                      <input className="rounded-lg border-gray-300 px-2 py-1 focus:ring-amber-500 focus:border-amber-500" value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} placeholder="Порода" />
                      <input type="number" min={0} className="w-24 rounded-lg border-gray-300 px-2 py-1 focus:ring-amber-500 focus:border-amber-500" value={form.ageMonths ?? ''} onChange={e => setForm({ ...form, ageMonths: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="мес." />
                      <div className="relative">
                        <button type="button" onClick={() => {
                setSpeciesOpen((v) => !v);
                setGenderOpen(false);
              }} className="rounded-lg border border-amber-200 bg-white px-3 py-1 flex items-center gap-2 text-sm text-gray-700">
                          {form.species === 'dog' || animal.species === 'dog' ? 'Собака' : 'Кошка'}
                          <ChevronDown className="w-4 h-4 text-amber-500" />
                        </button>
                        {speciesOpen && <div className="absolute z-10 mt-1 w-40 bg-white border border-amber-100 rounded-xl shadow-lg">
                            {[
              { value: 'cat', label: 'Кошка' },
              { value: 'dog', label: 'Собака' }
            ].map(opt => <button key={opt.value} className={`w-full text-left px-3 py-2 text-sm hover:bg-amber-50 ${opt.value === (form.species || animal.species) ? 'font-semibold text-amber-700' : 'text-gray-700'}`} onClick={() => {
              setForm({ ...form, species: opt.value as Animal['species'] });
              setSpeciesOpen(false);
            }}>
                                    {opt.label}
                                  </button>)}
                          </div>}
                      </div>
                      <div className="relative">
                        <button type="button" onClick={() => {
                setGenderOpen((v) => !v);
                setSpeciesOpen(false);
              }} className="rounded-lg border border-amber-200 bg-white px-3 py-1 flex items-center gap-2 text-sm text-gray-700">
                          {(form.gender || animal.gender) === 'male' ? 'Мальчик' : (form.gender || animal.gender) === 'female' ? 'Девочка' : 'Пол'}
                          <ChevronDown className="w-4 h-4 text-amber-500" />
                        </button>
                        {genderOpen && <div className="absolute z-10 mt-1 w-40 bg-white border border-amber-100 rounded-xl shadow-lg">
                            {[
              { value: 'male', label: 'Мальчик' },
              { value: 'female', label: 'Девочка' }
            ].map(opt => <button key={opt.value} className={`w-full text-left px-3 py-2 text-sm hover:bg-amber-50 ${opt.value === (form.gender || animal.gender) ? 'font-semibold text-amber-700' : 'text-gray-700'}`} onClick={() => {
              setForm({ ...form, gender: opt.value as Animal['gender'] });
              setGenderOpen(false);
            }}>
                                    {opt.label}
                                  </button>)}
                          </div>}
                      </div>
                    </> : <>{animal.breed || 'Питомец'} • ~{animal.ageMonths ? Math.max(1, Math.round(animal.ageMonths / 12)) : 1} лет</>}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Вид: {form.species ? (form.species === 'cat' ? 'Кошка' : 'Собака') : animal.species === 'cat' ? 'Кошка' : 'Собака'} • Пол: {(form.gender || animal.gender) === 'male' ? 'Мальчик' : (form.gender || animal.gender) === 'female' ? 'Девочка' : 'Не указан'}
                </div>
                </div>
            <div className="flex items-center gap-2 flex-wrap">
              {editing ? (
                statusLocked ? (
                  <div className="space-y-1">
                    <div className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide ${statusBadge(currentStatus)}`}>
                      {statusOptions.find((s) => s.value === currentStatus)?.label || 'Статус'}
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <button type="button" onClick={() => setStatusOpen((v) => !v)} className="px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide bg-amber-50 border border-amber-200 text-amber-700 flex items-center gap-2">
                      {statusOptions.find((s) => s.value === currentStatus)?.label || 'Статус'}
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {statusOpen && <div className="absolute z-10 mt-2 w-48 bg-white rounded-xl shadow-lg border border-amber-100 overflow-hidden">
                        {statusOptions.map((opt) => <button key={opt.value} className={`w-full text-left px-4 py-2 text-sm hover:bg-amber-50 ${opt.value === (form.status || animal.status) ? 'font-semibold text-amber-700' : 'text-gray-700'}`} onClick={() => {
                    setForm((f) => ({ ...f, status: opt.value }));
                    setStatusOpen(false);
                  }}>
                              {opt.label}
                            </button>)}
                      </div>}
                  </div>
                )
              ) : (
                <div className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide ${statusBadge(currentStatus)}`}>
                  {statusOptions.find((s) => s.value === currentStatus)?.label || 'Статус'}
                </div>
              )}
                {animal.pendingAdminReview && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                    На проверке
                  </span>
                )}
                {canEdit && !editing && <button onClick={() => setEditing(true)} className="inline-flex items-center px-3 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600">
                    <Edit2 className="w-4 h-4 mr-2" /> Редактировать
                  </button>}
                {!canEdit && isCandidate && canApply && (
                  <button
                    onClick={() => navigate(`/candidate/apply/${animal.id}`)}
                    className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600"
                  >
                    Подать заявку
                  </button>
                )}
              </div>
            </div>

            <div className="prose prose-lg text-gray-600 mb-8">
              {editing ? <textarea className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Описание питомца" /> : <p>{animal.description || 'Описание уточняется.'}</p>}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3 mb-8">
              <h3 className="text-lg font-semibold text-gray-900">Полевые заметки</h3>
              <div className="space-y-2">
                {notes.length > 0 ? notes.map((n) => (
                  <div key={n.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                    <div className="text-sm text-gray-900">{n.note}</div>
                    <div className="text-xs text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                )) : <p className="text-sm text-gray-500">Заметок пока нет</p>}
              </div>
              {canAddNotes && (
                <div className="space-y-2 pt-2">
                  <textarea
                    rows={3}
                    className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Что произошло на смене: поведение, аппетит, состояние..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <button
                      disabled={!noteText.trim()}
                      onClick={async () => {
                        if (!noteText.trim()) return;
                        try {
                          await addAnimalNote(animal.id, noteText.trim());
                          const updated = await getAnimalNotes(animal.id);
                          setNotes(updated);
                          setNoteText('');
                        } catch (err: any) {
                          const msg = err?.response?.data?.message || 'Не удалось сохранить заметку';
                          alert(msg);
                        }
                      }}
                      className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 disabled:opacity-50"
                    >
                      Сохранить заметку
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Medical Info */}
            <div className="mb-10 bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center justify-between">
                <span>Медицинская карта</span>
                {canEditMedical && <Link to={`/veterinar/medical-records/${animal.id}`} className="text-sm text-blue-600 hover:underline">История процедур</Link>}
              </h3>
              <div className="flex flex-wrap gap-3 mb-4 items-center">
                {animal.readyForAdoption || animal.medical?.readyForAdoption ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-lg bg-green-50 text-green-700 text-sm font-medium">
                    <Check className="w-3 h-3 mr-1.5" /> Готов к передаче
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-lg bg-amber-50 text-amber-700 text-sm font-medium">
                    <AlertCircle className="w-3 h-3 mr-1.5" /> Требуется допуск ветеринара
                  </span>
                )}
                {!canEditMedical && <span className="text-xs text-gray-500">Статус ставит ветеринар</span>}
              </div>
              {canEditMedical && (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <label className="flex items-center space-x-2 text-sm">
                      <input type="checkbox" checked={!!medicalForm.readyForAdoption} onChange={(e) => setMedicalForm((prev) => ({ ...prev, readyForAdoption: e.target.checked }))} />
                      <span>Готов к передаче</span>
                    </label>
                  </div>
                  <div className="flex justify-end pt-3">
                    <button
                      onClick={async () => {
                        try {
                          const updated = await updateAnimalMedical(animal.id, medicalForm);
                          setAnimal(updated);
                          alert('Медицинский статус обновлён');
                        } catch (err: any) {
                          const msg = err?.response?.data?.message || 'Не удалось обновить';
                          alert(msg);
                        }
                      }}
                      className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600"
                    >
                      Сохранить мед. данные
                    </button>
                  </div>
                </>
              )}
             
            </div>

            {/* Actions */}
            {!canEdit && <div className="flex flex-col sm:flex-row gap-4">
                <Link to={`/adopt/${animal.id}`} className="flex-1 inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-amber-500 rounded-xl hover:bg-amber-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                  <Check className="w-5 h-5 mr-2" />
                  Подать заявку
                </Link>
                <button className="inline-flex items-center justify-center px-6 py-4 text-base font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>}

            {canEdit && editing && <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button onClick={handleSave} disabled={saving} className="inline-flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50">
                  <Save className="w-4 h-4 mr-2" /> Сохранить
                </button>
                <button onClick={() => setEditing(false)} className="inline-flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-300">
                  <XCircle className="w-4 h-4 mr-2" /> Отмена
                </button>
              </div>}
          </motion.div>
        </div>
      </div>
    </div>
    {lightbox.open && photoList.length > 0 && (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <button className="absolute top-6 right-6 text-white hover:text-gray-300" onClick={closeLightbox}>
          <Close className="w-8 h-8" />
        </button>
        <button className="absolute left-6 text-white hover:text-gray-300" onClick={() => shiftLightbox(-1)}>
          <ChevronLeft className="w-10 h-10" />
        </button>
        <div className="max-w-5xl w-full">
          <img
            src={photoList[lightbox.index]}
            alt={animal.name}
            className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
        <button className="absolute right-6 text-white hover:text-gray-300" onClick={() => shiftLightbox(1)}>
          <ChevronRight className="w-10 h-10" />
        </button>
      </div>
    )}
  </>;

  if (canEdit) {
    return <DashboardLayout title={`Питомец: ${animal?.name || ''}`}>
        {content}
      </DashboardLayout>;
  }
  return content;
}
