import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { addSpecies, deleteSpecies, getAnimalSpecies, getSetting, setSetting } from '../../services/api';
import { useAppModal } from '../../contexts/AppModalContext';

export function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    reportOffset: '30',
    reportWindow: '7'
  });
  const [species, setSpecies] = useState<string[]>([]);
  const [newSpecies, setNewSpecies] = useState('');
  const { showMessage, showConfirm } = useAppModal();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [reportOffset, reportWindow, speciesList] = await Promise.all([
          getSetting('report_offset_days').catch(() => getSetting('report_interval_days').catch(() => '')),
          getSetting('report_fill_days').catch(() => ''),
          getAnimalSpecies().catch(() => [])
        ]);
        setSettings({
          reportOffset: reportOffset || '30',
          reportWindow: reportWindow || '7'
        });
        setSpecies(speciesList || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await Promise.all([
        setSetting('report_offset_days', settings.reportOffset || '30'),
        setSetting('report_fill_days', settings.reportWindow || '7')
      ]);
      await showMessage('Настройки сохранены', 'Готово');
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Не удалось сохранить настройки';
      await showMessage(msg, 'Ошибка');
    } finally {
      setSaving(false);
    }
  };
  const addNewSpecies = async () => {
    if (!newSpecies.trim()) return;
    try {
      await addSpecies(newSpecies.trim());
      const updated = await getAnimalSpecies();
      setSpecies(updated);
      setNewSpecies('');
    } catch (e: any) {
      await showMessage(e?.response?.data?.message || 'Не удалось добавить вид', 'Ошибка');
    }
  };
  const removeSpecies = async (name: string) => {
    const ok = await showConfirm({ message: `Удалить категорию "${name}"?`, title: 'Удаление вида', confirmLabel: 'Удалить', cancelLabel: 'Отмена' });
    if (!ok) return;
    try {
      await deleteSpecies(name);
      setSpecies((prev) => prev.filter((s) => s !== name));
    } catch (e: any) {
      await showMessage(e?.response?.data?.message || 'Не удалось удалить вид', 'Ошибка');
    }
  };

  return (
    <DashboardLayout title="Настройки">
      <div className="space-y-6">
        {loading && <div className="text-sm text-gray-500">Загружаем параметры...</div>}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase text-gray-500">Постсопровождение</div>
                <div className="font-semibold text-gray-900">Отчёты новых владельцев</div>
              </div>
            </div>
            <label className="block text-sm text-gray-700">
              Через сколько дней после отправки запросить следующий отчёт
              <input
                type="number"
                min={1}
                className="mt-2 w-full rounded-lg border-gray-200 px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
                value={settings.reportOffset}
                onChange={(e) => setSettings((s) => ({ ...s, reportOffset: e.target.value }))}
              />
            </label>
            <label className="block text-sm text-gray-700">
              Время на заполнение (дней)
              <input
                type="number"
                min={1}
                className="mt-2 w-full rounded-lg border-gray-200 px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
                value={settings.reportWindow}
                onChange={(e) => setSettings((s) => ({ ...s, reportWindow: e.target.value }))}
              />
            </label>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase text-gray-500">Категории животных</div>
                <div className="font-semibold text-gray-900">Виды для карточек</div>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Новый вид (например, собака)"
                className="flex-1 rounded-lg border-gray-200 px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
                value={newSpecies}
                onChange={(e) => setNewSpecies(e.target.value)}
              />
              <button
                onClick={addNewSpecies}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600"
              >
                Добавить
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {species.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center bg-amber-50 text-amber-800 border border-amber-100 rounded-full px-3 py-1 text-sm"
                >
                  {s}
                  <button
                    onClick={() => removeSpecies(s)}
                    className="ml-2 text-amber-600 hover:text-red-600"
                    title="Удалить вид"
                  >
                    ×
                  </button>
                </span>
              ))}
              {species.length === 0 && <span className="text-sm text-gray-500">Список пуст</span>}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 disabled:opacity-50"
          >
            {saving ? 'Сохраняем...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
