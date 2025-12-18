import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PawPrint, LogIn, AtSign, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const demoAccounts = [{
  email: 'admin@shelter.ru',
  role: 'admin',
  password: 'admin123'
}, {
  email: 'coordinator@shelter.ru',
  role: 'coordinator',
  password: 'coordinator123'
}, {
  email: 'vet@shelter.ru',
  role: 'veterinar',
  password: 'vet123'
}, {
  email: 'volunteer1@shelter.ru',
  role: 'volunteer',
  password: 'volunteer123'
}, {
  email: 'candidate1@mail.ru',
  role: 'candidate',
  password: 'candidate123'
}];

export function Login() {
  const {
    login
  } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(demoAccounts[0].email);
  const [password, setPassword] = useState(demoAccounts[0].password);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (!ok) {
      setError('Неверные учетные данные');
      return;
    }
    const stored = localStorage.getItem('petHavenUser');
    const parsed = stored ? JSON.parse(stored) : null;
    const role = parsed?.roles?.[0];
    if (role) {
      navigate(`/${role}/dashboard`);
    } else {
      navigate('/');
    }
  };

  return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-2xl mb-4 shadow-lg transform -rotate-6">
            <PawPrint className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Вход в систему</h1>
          <p className="text-gray-500 mt-2">Используйте email и пароль из списка ниже.</p>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          <label className="block">
            <span className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              <AtSign className="w-4 h-4 mr-2" /> Email
            </span>
            <input value={email} onChange={e => setEmail(e.target.value)} required type="email" className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Lock className="w-4 h-4 mr-2" /> Пароль
            </span>
            <input value={password} onChange={e => setPassword(e.target.value)} required type="password" className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" />
          </label>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button type="submit" className="w-full inline-flex items-center justify-center bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors">
            <LogIn className="w-4 h-4 mr-2" /> Войти
          </button>
        </form>

        <div className="mt-6">
          <div className="text-xs text-gray-500 mb-2">Быстрый выбор email:</div>
          <div className="flex flex-wrap gap-2">
            {demoAccounts.map(account => <button key={account.email} onClick={() => {
            setEmail(account.email);
            setPassword(account.password);
            setError('');
          }} className="px-3 py-1 text-xs rounded-full border border-gray-200 hover:border-amber-500">
                {account.role}
              </button>)}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          Pet Haven Information System v1.0
        </div>
      </div>
    </div>;
}
