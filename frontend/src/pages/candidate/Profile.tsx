import React, { useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { uploadAvatar, updateMyProfile } from '../../services/api';
import { Save, User, Mail, Phone, Upload } from 'lucide-react';
export function CandidateProfile() {
  const {
    user,
    updateUser
  } = useAuth();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || ''
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const isValidPhone = (value: string) => {
    if (!value.trim()) return true;
    const digits = value.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15 && /^[+]?[\d\s\-()]+$/.test(value);
  };
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone(formData.phoneNumber)) {
      alert('Введите корректный номер телефона');
      return;
    }
    setSaving(true);
    updateMyProfile({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: formData.phoneNumber
    }).then(async (updated) => {
      if (avatarFile) {
        setUploading(true);
        try {
          const avatarUpdated = await uploadAvatar(avatarFile);
          const cacheBusted = avatarUpdated.avatarUrl
            ? `${avatarUpdated.avatarUrl}${avatarUpdated.avatarUrl.includes('?') ? '&' : '?'}t=${Date.now()}`
            : null;
          updateUser({ avatarUrl: cacheBusted || undefined });
          setAvatarFile(null);
          if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
          }
          setAvatarPreview(cacheBusted);
        } finally {
          setUploading(false);
        }
      }
      updateUser({
        firstName: updated.firstName,
        lastName: updated.lastName,
        phoneNumber: updated.phoneNumber
      });
      alert('Профиль обновлен!');
    }).catch(() => {
      alert('Не удалось обновить профиль');
    }).finally(() => setSaving(false));
  };
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setAvatarFile(file);
    const preview = URL.createObjectURL(file);
    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return preview;
    });
  };
  return <DashboardLayout title="Мой профиль">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center">
            <label className="relative w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-2xl font-bold border-4 border-white shadow-sm mr-6 cursor-pointer group overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt={user?.email} className="w-full h-full rounded-full object-cover" />
              ) : user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.email} className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-10 h-10" />
              )}
              <div className="absolute inset-0 bg-black/40 text-white text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                {uploading ? '...' : 'Обновить'}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user?.email}</h2>
              <p className="text-gray-500">Кандидат</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  Имя
                </label>
                <input type="text" value={formData.firstName} onChange={e => setFormData({
                ...formData,
                firstName: e.target.value
              })} className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  Фамилия
                </label>
                <input type="text" value={formData.lastName} onChange={e => setFormData({
                ...formData,
                lastName: e.target.value
              })} className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  Email
                </label>
                <input type="email" value={formData.email} disabled className="w-full rounded-lg border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  Телефон
                </label>
                <input type="tel" value={formData.phoneNumber} onChange={e => setFormData({
                ...formData,
                phoneNumber: e.target.value
              })} placeholder="+7 (999) 000-00-00" className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button type="submit" className="px-6 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors flex items-center" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Сохраняем...' : 'Сохранить изменения'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>;
}
