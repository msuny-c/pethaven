import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PawPrint, UserPlus, AtSign, Lock, Phone, ArrowLeft } from 'lucide-react';
import { registerCandidate } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authenticate } = useAuth();
  const redirectTo = (location.state as { redirectTo?: string } | null)?.redirectTo;
  const isValidPhone = (value: string) => {
    if (!value.trim()) return true;
    const digits = value.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15 && /^[+]?[\d\s\-()]+$/.test(value);
  };
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password || !form.firstName || !form.lastName) {
      setError('Заполните обязательные поля');
      return;
    }
    if (!isValidPhone(form.phone)) {
      setError('Введите корректный номер телефона');
      return;
    }
    setLoading(true);
    try {
      const user = await registerCandidate({
        ...form,
        role: 'candidate'
      });
      authenticate(user);
      navigate(redirectTo || '/candidate/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Не удалось зарегистрироваться';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 relative">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          На главную
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-2xl mb-4 shadow-lg transform -rotate-6">
            <PawPrint className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Регистрация кандидата</h1>
          <p className="text-gray-500 mt-2">
            Создайте аккаунт, чтобы подать заявки на животных.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                <UserPlus className="w-4 h-4 mr-2" /> Имя
              </span>
              <input
                value={form.firstName}
                onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                required
                type="text"
                className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                <UserPlus className="w-4 h-4 mr-2" /> Фамилия
              </span>
              <input
                value={form.lastName}
                onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                required
                type="text"
                className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              <AtSign className="w-4 h-4 mr-2" /> Email
            </span>
            <input
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
              type="email"
              className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Phone className="w-4 h-4 mr-2" /> Телефон (необязательно)
            </span>
            <input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              type="tel"
              className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Lock className="w-4 h-4 mr-2" /> Пароль
            </span>
            <input
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required
              type="password"
              className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500"
            />
          </label>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors disabled:opacity-70"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {loading ? 'Создаем аккаунт...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-amber-600 font-semibold hover:text-amber-700">
            Войти
          </Link>
        </div>
      </div>
    </div>
  );
}
