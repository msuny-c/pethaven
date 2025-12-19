import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { getSetting, setSetting } from '../../services/api';

export function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    reportInterval: '30',
    vaccInterval: '365'
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [reportInterval, vaccInterval] = await Promise.all([
          getSetting('report_interval_days').catch(() => ''),
          getSetting('vaccination_interval_days').catch(() => '')
        ]);
        setSettings({
          reportInterval: reportInterval || '30',
          vaccInterval: vaccInterval || '365'
        });
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
        setSetting('report_interval_days', settings.reportInterval || '30'),
        setSetting('vaccination_interval_days', settings.vaccInterval || '365')
      ]);
      alert('Настройки сохранены');
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Не удалось сохранить настройки';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Настройки">
      <div className="space-y-6">
        {loading && <div className="text-sm text-gray-500">Загружаем параметры...</div>}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs uppercase text-gray-500">Постсопровождение</div>
                <div className="font-semibold text-gray-900">Отчёты новых владельцев</div>
              </div>
              <span className="text-xs text-gray-500">интервалы</span>
            </div>
            <label className="block text-sm text-gray-700">
              Период отчётов (дней)
              <input
                type="number"
                min={1}
                className="mt-2 w-full rounded-lg border-gray-200 px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
                value={settings.reportInterval}
                onChange={(e) => setSettings((s) => ({ ...s, reportInterval: e.target.value }))}
              />
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Используется для авто-планирования следующих отчётов после отправки текущего.
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs uppercase text-gray-500">Медицина</div>
                <div className="font-semibold text-gray-900">Вакцинации</div>
              </div>
              <span className="text-xs text-gray-500">интервалы</span>
            </div>
            <label className="block text-sm text-gray-700">
              Период вакцинации (дней)
              <input
                type="number"
                min={1}
                className="mt-2 w-full rounded-lg border-gray-200 px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
                value={settings.vaccInterval}
                onChange={(e) => setSettings((s) => ({ ...s, vaccInterval: e.target.value }))}
              />
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Используется для напоминаний по повторным прививкам.
            </p>
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
