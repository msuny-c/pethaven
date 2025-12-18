import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Search, Shield, ToggleLeft, ToggleRight, Trash2, PlusCircle } from 'lucide-react';
import { ConfirmModal } from '../../components/modals/ConfirmModal';
import { Role, UserProfile } from '../../types';
import { createUser, deleteUser, getUsers, updateUserRoles, updateUserStatus } from '../../services/api';

export function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
    const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'coordinator' as Role
  });
  const [creating, setCreating] = useState(false);
  const roleLabels: Record<string, string> = {
    admin: 'Администратор',
    coordinator: 'Координатор',
    veterinar: 'Ветеринар',
    volunteer: 'Волонтер',
    candidate: 'Кандидат'
  };

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) return;
    setCreating(true);
    try {
      await createUser({
        email: newUser.email,
        password: newUser.password,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phoneNumber: newUser.phoneNumber,
        roles: [newUser.role]
      });
      setNewUser({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        role: 'coordinator'
      });
      await refresh();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Не удалось создать пользователя';
      alert(msg);
    } finally {
      setCreating(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-700',
      coordinator: 'bg-blue-100 text-blue-700',
      veterinar: 'bg-green-100 text-green-700',
      volunteer: 'bg-amber-100 text-amber-700',
      candidate: 'bg-gray-100 text-gray-700'
    };
    return colors[role] || colors.candidate;
  };

  return (
    <DashboardLayout title="Управление пользователями">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center mb-3">
          <PlusCircle className="w-4 h-4 text-amber-500 mr-2" />
          <h3 className="font-bold text-gray-900">Создать аккаунт сотрудника</h3>
        </div>
        <form className="grid grid-cols-1 md:grid-cols-5 gap-3" onSubmit={handleCreate}>
          <input required type="text" placeholder="Имя" className="rounded-lg border-gray-200 px-3 py-2 focus:ring-amber-500 focus:border-amber-500" value={newUser.firstName} onChange={(e) => setNewUser((prev) => ({ ...prev, firstName: e.target.value }))} />
          <input required type="text" placeholder="Фамилия" className="rounded-lg border-gray-200 px-3 py-2 focus:ring-amber-500 focus:border-amber-500" value={newUser.lastName} onChange={(e) => setNewUser((prev) => ({ ...prev, lastName: e.target.value }))} />
          <input required type="email" placeholder="Email" className="rounded-lg border-gray-200 px-3 py-2 focus:ring-amber-500 focus:border-amber-500" value={newUser.email} onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))} />
          <input required type="password" placeholder="Пароль" className="rounded-lg border-gray-200 px-3 py-2 focus:ring-amber-500 focus:border-amber-500" value={newUser.password} onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))} />
          <div className="flex items-center space-x-2">
            <select className="flex-1 rounded-lg border-gray-200 px-3 py-2 focus:ring-amber-500 focus:border-amber-500" value={newUser.role} onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value as Role }))}>
              <option value="coordinator">Координатор</option>
              <option value="veterinar">Ветеринар</option>
              <option value="admin">Администратор</option>
            </select>
            <button type="submit" disabled={creating} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 disabled:opacity-50">
              {creating ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center">
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
        </div>

        <table className="w-full text-left">
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
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(primaryRole)}`}>
                      <Shield className="w-3 h-3 mr-1" />
                      {roleLabels[primaryRole] || primaryRole}
                    </span>
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
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => handleActiveToggle(user.id, !isActive)} className="flex items-center text-sm text-gray-700">
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

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Удаление пользователя"
        message="Вы уверены? Это действие нельзя отменить."
        isDanger
      />
    </DashboardLayout>
  );
}
