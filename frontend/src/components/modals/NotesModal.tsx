import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getAnimalNotes, addAnimalNote } from '../../services/api';

interface NotesModalProps {
  animalId: number | null;
  animalName?: string;
  onClose: () => void;
}

export function NotesModal({ animalId, animalName, onClose }: NotesModalProps) {
  const [notes, setNotes] = useState<{ id: number; animalId: number; authorId: number; authorName?: string; authorAvatar?: string; note: string; createdAt: string }[]>([]);
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!animalId) return;
    setLoading(true);
    getAnimalNotes(animalId)
      .then((list) => setNotes(list))
      .finally(() => setLoading(false));
  }, [animalId]);

  if (!animalId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Полевые заметки</h3>
            <p className="text-sm text-gray-500">Питомец: {animalName || `#${animalId}`}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
          {loading ? (
            <div className="text-sm text-gray-500">Загружаем заметки...</div>
          ) : notes.length === 0 ? (
            <div className="text-sm text-gray-500">Заметок пока нет</div>
          ) : (
            notes.map((n) => (
              <div key={n.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                <div className="flex items-center gap-2 mb-1">
                  {n.authorAvatar ? (
                    <img src={n.authorAvatar} alt={n.authorName || ''} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-semibold">
                      {(n.authorName || 'П')[0]}
                    </div>
                  )}
                  <div className="text-xs text-gray-600">
                    <span className="font-semibold">{n.authorName || `#${n.authorId}`}</span> •{' '}
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-sm text-gray-900 whitespace-pre-line">{n.note}</div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Новая заметка</label>
          <textarea
            rows={3}
            className="w-full rounded-lg border border-gray-300 focus:ring-amber-500 focus:border-amber-500 px-3 py-2"
            placeholder="Что произошло на смене: поведение, аппетит, состояние..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
          <div className="flex justify-end">
            <button
              onClick={async () => {
                if (!noteText.trim() || !animalId) return;
                setSaving(true);
                try {
                  await addAnimalNote(animalId, noteText.trim());
                  const updated = await getAnimalNotes(animalId);
                  setNotes(updated);
                  setNoteText('');
                } finally {
                  setSaving(false);
                }
              }}
              disabled={!noteText.trim() || saving}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 disabled:opacity-50"
            >
              {saving ? 'Сохраняем...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
