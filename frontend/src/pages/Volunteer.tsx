import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Clock, BookOpen, Camera, Dog, Shovel } from 'lucide-react';
import { registerCandidate, submitVolunteerApplication } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
export function Volunteer() {
  const navigate = useNavigate();
  const { user, authenticate, primaryRole } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    motivation: '',
    availability: ''
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user && (!form.email || !form.password || !form.firstName || !form.lastName)) {
      alert('Заполните контакты и пароль для регистрации волонтера');
      return;
    }
    if (!form.motivation) {
      alert('Опишите мотивацию');
      return;
    }
    setSubmitting(true);
    try {
      if (!user) {
        const registered = await registerCandidate({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          role: 'volunteer'
        });
        authenticate(registered);
      }
      await submitVolunteerApplication({
        motivation: form.motivation,
        availability: form.availability,
        firstName: form.firstName || user?.firstName,
        lastName: form.lastName || user?.lastName,
        email: form.email || user?.email,
        phone: form.phone || user?.phoneNumber
      });
      setSent(true);
      setTimeout(() => navigate('/volunteer/pending'), 800);
    } catch (err: any) {
      console.error(err);
      const message = err?.response?.data?.message || 'Не удалось отправить анкету';
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };
  const benefits = [{
    icon: Heart,
    title: 'Помогайте животным',
    desc: 'Ваша забота делает их жизнь лучше каждый день.'
  }, {
    icon: Clock,
    title: 'Гибкий график',
    desc: 'Приходите тогда, когда вам удобно. Даже час в неделю важен.'
  }, {
    icon: BookOpen,
    title: 'Обучение',
    desc: 'Мы научим вас языку тела животных и правильному уходу.'
  }];
  const activities = [{
    icon: Dog,
    title: 'Выгул собак',
    desc: 'Прогулки в парке и активные игры на площадке.'
  }, {
    icon: Heart,
    title: 'Социализация',
    desc: 'Общение с кошками и пугливыми животными.'
  }, {
    icon: Shovel,
    title: 'Помощь в уходе',
    desc: 'Уборка вольеров, кормление и расчесывание.'
  }, {
    icon: Camera,
    title: 'Фотосъемка',
    desc: 'Создание красивых фото для анкет питомцев.'
  }];
  return <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative py-24 bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <img src="https://images.unsplash.com/photo-1559096996-18d2f2343b63?auto=format&fit=crop&w=2000&q=80" alt="Volunteers" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.h1 initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} className="text-4xl md:text-6xl font-bold text-white mb-6">
            Станьте частью команды <br />
            <span className="text-amber-500">Pet Haven</span>
          </motion.h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            Волонтеры — это сердце нашего приюта. Без вашей помощи мы не смогли
            бы спасать столько жизней.
          </p>
          <button onClick={() => {
          if (user) {
            navigate(primaryRole ? `/${primaryRole}/dashboard` : '/profile');
            return;
          }
          document.getElementById('form')?.scrollIntoView({
            behavior: 'smooth'
          });
        }} className="bg-amber-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-amber-600 transition-colors">
            Заполнить анкету
          </button>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {benefits.map((item, i) => <motion.div key={i} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: i * 0.1
          }} className="text-center">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-600">
                  <item.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.desc}</p>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Activities */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Чем занимаются волонтеры?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {activities.map((item, i) => <div key={i} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <item.icon className="w-10 h-10 text-amber-500 mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>)}
          </div>
        </div>
      </section>

      {/* Form */}
      <section id="form" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-900 p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                Анкета волонтера
              </h2>
              <p className="text-gray-400">
                Заполните форму, и мы пригласим вас на ознакомительную встречу
              </p>
            </div>

            {user ? <div className="p-8 space-y-4 text-center">
                <p className="text-gray-700 font-medium">
                  Вы уже авторизованы. Подать или посмотреть заявку можно в личном кабинете.
                </p>
                <button onClick={() => navigate(primaryRole ? `/${primaryRole}/dashboard` : '/profile')} className="inline-flex items-center justify-center px-6 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors">
                  Перейти в кабинет
                </button>
              </div> : <form className="p-8 space-y-6" onSubmit={handleSubmit}>
                <div className="text-sm text-gray-700 bg-amber-50 border border-amber-100 p-3 rounded-lg">
                  Мы создадим аккаунт волонтера и сразу подадим заявку. Функции волонтера станут доступны после одобрения администратором.
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Имя
                    </label>
                    <input type="text" value={form.firstName} onChange={e => setForm(prev => ({
                  ...prev,
                  firstName: e.target.value
                }))} className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Фамилия
                    </label>
                    <input type="text" value={form.lastName} onChange={e => setForm(prev => ({
                  ...prev,
                  lastName: e.target.value
                }))} className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input type="email" value={form.email} onChange={e => setForm(prev => ({
                  ...prev,
                  email: e.target.value
                }))} className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Телефон
                    </label>
                    <input type="tel" value={form.phone} onChange={e => setForm(prev => ({
                  ...prev,
                  phone: e.target.value
                }))} className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Пароль для входа
                    </label>
                    <input type="password" value={form.password} onChange={e => setForm(prev => ({
                  ...prev,
                  password: e.target.value
                }))} className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" required />
                    <p className="text-xs text-gray-500 mt-1">Используется для входа в личный кабинет волонтера.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Удобные дни для посещения
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => <label key={day} className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" className="rounded text-amber-500 focus:ring-amber-500" onChange={e => {
                setForm(prev => {
                  const current = prev.availability ? prev.availability.split(',').map(v => v.trim()).filter(Boolean) : [];
                  const next = e.target.checked ? [...current, day] : current.filter(v => v !== day);
                  return { ...prev, availability: next.join(', ') };
                });
              }} />
                        <span className="text-gray-700">{day}</span>
                      </label>)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Опыт общения с животными
                  </label>
                  <textarea rows={3} value={form.motivation} onChange={e => setForm(prev => ({
              ...prev,
              motivation: e.target.value
            }))} className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" required placeholder="Расскажите, почему хотите помогать, и ваш опыт" />
                </div>

                <button type="submit" disabled={submitting} className="w-full bg-amber-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-amber-600 transition-colors shadow-lg disabled:opacity-60">
                  {submitting ? 'Отправляем...' : 'Отправить анкету'}
                </button>
                {sent && <p className="text-center text-green-600 text-sm">Анкета отправлена. Доступ откроется после одобрения.</p>}
              </form>}
          </div>
        </div>
      </section>
    </div>;
}
