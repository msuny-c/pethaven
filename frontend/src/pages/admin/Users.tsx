import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Search, ToggleLeft, ToggleRight, Trash2, PlusCircle, Edit2 } from 'lucide-react';
import { ConfirmModal } from '../../components/modals/ConfirmModal';
import { Role, UserProfile } from '../../types';
import { createUser, deleteUser, getUsers, updateUserRoles, updateUserStatus, updateUserProfileAdmin } from '../../services/api';

export function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'coordinator' as Role
  });

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    const data = await getUsers();
    setUsers(data);
  };

  const filteredUsers = users.filter(
    (u) => (`${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRoleChange = async (userId: number, role: Role) => {
    const updated = await updateUserRoles(userId, [role]);
    setUsers((list) => list.map((u) => (u.id === userId ? updated : u)));
  };

  const handleActiveToggle = async (userId: number, active: boolean) => {
    const updated = await updateUserStatus(userId, active);
    setUsers((list) => list.map((u) => (u.id === userId ? updated : u)));
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteUser(deleteId);
      setDeleteId(null);
      await refresh();
    }
  };

  const handleSave = async () => {
    const localErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) localErrors.firstName = 'Укажите имя';
    if (!formData.lastName.trim()) localErrors.lastName = 'Укажите фамилию';
    if (!formData.email.trim()) localErrors.email = 'Укажите email';
    if (formData.phoneNumber.trim()) {
      const digits = formData.phoneNumber.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 15 || !/^[+]?[\d\s\-()]+$/.test(formData.phoneNumber)) {
        localErrors.phoneNumber = 'Введите корректный телефон';
      }
    }
    if (!editingUser && !formData.password.trim()) localErrors.password = 'Пароль обязателен';
    setErrors(localErrors);
    if (Object.keys(localErrors).length > 0) return;
    setCreating(true);
    try {
      if (editingUser) {
        const updated = await updateUserProfileAdmin(editingUser.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber
        });
        await updateUserRoles(editingUser.id, [formData.role]);
        setUsers((list) => list.map((u) => (u.id === updated.id ? { ...u, ...updated, roles: [formData.role] } : u)));
      } else {
        await createUser({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          roles: [formData.role]
        });
        await refresh();
      }
      setIsModalOpen(false);
      setEditingUser(null);
      setErrors({});
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        role: 'coordinator'
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Не удалось сохранить пользователя';
      alert(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardLayout title="Управление пользователями">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск по имени или email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => {
              setEditingUser(null);
              setFormData({
                email: '',
                password: '',
                firstName: '',
                lastName: '',
                phoneNumber: '',
                role: 'coordinator'
              });
              setErrors({});
              setIsModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Новый сотрудник
          </button>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[720px]">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-3">Пользователь</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Роль</th>
              <th className="px-6 py-3">Статус</th>
              <th className="px-6 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map((user) => {
              const primaryRole = user.roles && user.roles.length > 0 ? user.roles[0] : 'candidate';
              const isActive = user.active !== false;
              return (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-xs text-gray-500">ID: {user.id}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                <td className="px-6 py-4">
                  <select
                    className="rounded-lg border-gray-200 text-sm bg-white shadow-inner px-3 py-1.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    value={primaryRole}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                  >
                    <option value="candidate">Кандидат</option>
                    <option value="volunteer">Волонтёр</option>
                    <option value="veterinar">Ветеринар</option>
                    <option value="coordinator">Координатор</option>
                    <option value="admin">Администратор</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => handleActiveToggle(user.id, !isActive)} className="flex items-center text-sm text-gray-700 w-32 justify-start">
                    {isActive ? (
                      <>
                        <ToggleRight className="w-5 h-5 text-green-500 mr-2" /> Активен
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-5 h-5 text-red-500 mr-2" /> Заблокирован
                      </>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => {
                      setEditingUser(user);
                      setFormData({
                        email: user.email,
                        password: '',
                        firstName: user.firstName || '',
                        lastName: user.lastName || '',
                        phoneNumber: user.phoneNumber || '',
                        role: primaryRole as Role
                      });
                      setErrors({});
                      setIsModalOpen(true);
                    }}
                    className="text-gray-400 hover:text-blue-600 mx-2"
                    title="Редактировать"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteId(user.id)} className="text-gray-400 hover:text-red-600 mx-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Удаление пользователя"
        message="Вы уверены? Это действие нельзя отменить."
        isDanger
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{editingUser ? 'Редактирование сотрудника' : 'Новый сотрудник'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label className="text-sm text-gray-600">Имя</label>
                <input
                  type="text"
                  className={`mt-1 w-full rounded-lg border px-3 py-2 focus:ring-amber-500 focus:border-amber-500 ${errors.firstName ? 'border-red-300' : 'border-gray-200'}`}
                  value={formData.firstName}
                  onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                />
                {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="text-sm text-gray-600">Фамилия</label>
                <input
                  type="text"
                  className={`mt-1 w-full rounded-lg border px-3 py-2 focus:ring-amber-500 focus:border-amber-500 ${errors.lastName ? 'border-red-300' : 'border-gray-200'}`}
                  value={formData.lastName}
                  onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                />
                {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>}
              </div>
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <input
                  type="email"
                  disabled={!!editingUser}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-50 ${errors.email ? 'border-red-300' : 'border-gray-200'}`}
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                />
                {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="text-sm text-gray-600">Телефон</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border-gray-200 px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData((p) => ({ ...p, phoneNumber: e.target.value }))}
                />
              </div>
              {!editingUser && (
                <div>
                  <label className="text-sm text-gray-600">Пароль</label>
                  <input
                    type="password"
                    className={`mt-1 w-full rounded-lg border px-3 py-2 focus:ring-amber-500 focus:border-amber-500 ${errors.password ? 'border-red-300' : 'border-gray-200'}`}
                    value={formData.password}
                    onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                  />
                  {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
                </div>
              )}
              <div>
                <label className="text-sm text-gray-600">Роль</label>
                <select
                  className="mt-1 w-full rounded-lg border-gray-200 px-3 py-2 h-11 focus:ring-amber-500 focus:border-amber-500"
                  value={formData.role}
                  onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value as Role }))}
                >
                  <option value="candidate">Кандидат</option>
                  <option value="volunteer">Волонтёр</option>
                  <option value="veterinar">Ветеринар</option>
                  <option value="coordinator">Координатор</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">Отмена</button>
              <button
                onClick={handleSave}
                disabled={creating}
                className="px-4 py-2 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 disabled:opacity-50"
              >
                {creating ? 'Сохраняем...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
