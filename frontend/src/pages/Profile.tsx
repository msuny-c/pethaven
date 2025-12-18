import React, { useState } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { uploadAvatar, updateMyProfile, deactivateSelf } from '../services/api';
import { Upload, Mail, Shield, User, Phone, Save, Trash2, Lock } from 'lucide-react';

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState('');
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phoneNumber: user?.phoneNumber || ''
  });
  if (!user) {
    return <DashboardLayout title="Профиль">
        <div className="p-8 text-center text-gray-500">Необходимо войти</div>
      </DashboardLayout>;
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const updated = await uploadAvatar(e.target.files[0]);
      updateUser({ avatarUrl: updated.avatarUrl });
    } catch {
      alert('Не удалось загрузить аватар');
    } finally {
      setUploading(false);
    }
  };

  const roleLabels: Record<string, string> = {
    admin: 'Администратор',
    coordinator: 'Координатор',
    volunteer: 'Волонтер',
    candidate: 'Кандидат',
    veterinar: 'Ветеринар'
  };
  const formatRole = (role: string) => roleLabels[role] || role;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  const displayName = fullName || user.email;

  return <DashboardLayout title="Профиль">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 flex items-center space-x-4 border-b border-gray-100 bg-gray-50">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-sm bg-amber-100 flex items-center justify-center">
              {user.avatarUrl
            ? <img src={user.avatarUrl} alt={user.email} className="w-full h-full object-cover" />
            : <User className="w-10 h-10 text-amber-500" />}
            </div>
            <div className="flex-1">
              <div className="text-xl font-bold text-gray-900">{displayName}</div>
              <div className="text-sm text-gray-500">
                Роли: {user.roles.map(formatRole).join(', ')}
              </div>
            </div>
            <label className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Загрузка...' : 'Обновить аватар'}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
        </div>

        <div className="p-6 space-y-4">
            <div className="flex items-center text-sm text-gray-700">
              <Mail className="w-4 h-4 mr-2 text-gray-400" />
              {user.email}
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <Shield className="w-4 h-4 mr-2 text-gray-400" />
              Доступ: {user.roles.map(formatRole).join(' • ')}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Имя</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Фамилия</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 flex items-center gap-1">
                  <Phone className="w-4 h-4 text-gray-400" /> Телефон
                </label>
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                  className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="+7 (___) ___-__-__"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={async () => {
                  setSaving(true);
                  try {
                    const updated = await updateMyProfile(form);
                    updateUser({
                      firstName: updated.firstName,
                      lastName: updated.lastName,
                      phoneNumber: updated.phoneNumber
                    });
                    alert('Профиль обновлен');
                  } catch {
                    alert('Не удалось обновить профиль');
                  } finally {
                    setSaving(false);
                  }
                }}
                className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Сохраняем...' : 'Сохранить'}
              </button>
            </div>

            {!user.roles.includes('admin') && (
              <div className="mt-6 border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                  <Lock className="w-4 h-4 text-gray-400" />
                  Удалить аккаунт
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Введите пароль"
                    className="rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500 px-3 py-2"
                  />
                  <div className="text-xs text-gray-500 md:col-span-1">
                    После удаления доступ будет заблокирован. Администратор сможет восстановить вручную.
                  </div>
                  <button
                    onClick={async () => {
                      if (!password) {
                        alert('Введите пароль для подтверждения');
                        return;
                      }
                      setDeleting(true);
                      try {
                        await deactivateSelf(password);
                        alert('Аккаунт деактивирован');
                        window.location.href = '/login';
                      } catch (e: any) {
                        const msg = e?.response?.data?.message || 'Не удалось удалить аккаунт';
                        alert(msg);
                      } finally {
                        setDeleting(false);
                      }
                    }}
                    disabled={deleting}
                    className="inline-flex items-center justify-center px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleting ? 'Удаляем...' : 'Удалить аккаунт'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>;
}
