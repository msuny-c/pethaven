import React, { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { submitApplication, getAnimal, registerCandidate } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Animal } from '../types';
export function AdoptionForm() {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const {
    user,
    authenticate
  } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    reason: '',
    experience: '',
    housing: 'Квартира',
    housingOwnership: 'Собственное'
  });
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!user && (!form.email || !form.password || !form.firstName || !form.lastName)) {
      alert('Заполните контактные данные и пароль для регистрации');
      return;
    }
    setSending(true);
    try {
      if (!user) {
        const registered = await registerCandidate({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          role: 'candidate'
        });
        authenticate(registered);
      }
      await submitApplication(Number(id), {
        reason: form.reason,
        experience: form.experience,
        housing: `${form.housing} (${form.housingOwnership})`
      });
      setSubmitted(true);
      window.scrollTo(0, 0);
      setTimeout(() => navigate('/candidate/applications'), 800);
    } catch (err: any) {
      console.error(err);
      const message = err?.response?.data?.message || 'Не удалось отправить заявку. Попробуйте позже.';
      alert(message);
    } finally {
      setSending(false);
    }
  };
  useEffect(() => {
    if (id) {
      getAnimal(Number(id)).then(setAnimal);
    }
  }, [id]);
  if (!animal) return <div>Animal not found</div>;
  if (submitted) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div initial={{
        opacity: 0,
        scale: 0.9
      }} animate={{
        opacity: 1,
        scale: 1
      }} className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Заявка отправлена!
          </h2>
          <p className="text-gray-600 mb-8">
            Спасибо за ваш интерес к {animal.name}. Наш координатор свяжется с
            вами в течение 24 часов для обсуждения деталей. Мы перенаправим вас
            в личный кабинет.
          </p>
          <button onClick={() => navigate('/animals')} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors">
            Вернуться к питомцам
          </button>
        </motion.div>
      </div>;
  }
  return <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-900 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-amber-500 p-6 text-white">
            <h1 className="text-2xl font-bold">Заявка на адопцию</h1>
            <p className="opacity-90 mt-1">Вы хотите забрать: {animal.name}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Personal Info */}
            {!user && <div className="space-y-4">
                <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <ShieldCheck className="w-4 h-4 text-amber-500 mr-2" />
                  Мы создадим кабинет кандидата и сразу подадим заявку на этого питомца.
                </div>
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">
                  Личные данные
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Имя
                    </label>
                    <input required type="text" value={form.firstName} onChange={e => setForm(prev => ({
                  ...prev,
                  firstName: e.target.value
                }))} className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Фамилия
                    </label>
                    <input required type="text" value={form.lastName} onChange={e => setForm(prev => ({
                  ...prev,
                  lastName: e.target.value
                }))} className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input required type="email" value={form.email} onChange={e => setForm(prev => ({
                  ...prev,
                  email: e.target.value
                }))} className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Телефон
                    </label>
                    <input required type="tel" value={form.phone} onChange={e => setForm(prev => ({
                  ...prev,
                  phone: e.target.value
                }))} className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Пароль для входа
                  </label>
                  <input required type="password" value={form.password} onChange={e => setForm(prev => ({
                ...prev,
                password: e.target.value
              }))} className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" />
                  <p className="text-xs text-gray-500 mt-1">Используется для входа в личный кабинет кандидата.</p>
                </div>
              </div>}

            {/* Living Conditions */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-2 pt-4">
                Условия проживания
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тип жилья
                  </label>
                  <select className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" value={form.housing} onChange={e => setForm(prev => ({
                    ...prev,
                    housing: e.target.value
                  }))}>
                    <option value="Квартира">Квартира</option>
                    <option value="Частный дом">Частный дом</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Собственность
                  </label>
                  <select className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" value={form.housingOwnership} onChange={e => setForm(prev => ({
                    ...prev,
                    housingOwnership: e.target.value
                  }))}>
                    <option value="Собственное жилье">Собственное жилье</option>
                    <option value="Аренда">Аренда</option>
                    <option value="Живу с родителями">Живу с родителями</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Experience */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-2 pt-4">
                Опыт и семья
              </h3>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Есть ли другие животные?
                  </label>
                  <textarea rows={2} className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" placeholder="Если да, опишите их (вид, возраст, характер)" value={form.experience} onChange={e => setForm(prev => ({
                ...prev,
                experience: e.target.value
              }))}></textarea>
                </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Почему вы выбрали именно этого питомца?
                  </label>
                  <textarea required rows={4} className="w-full rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500" value={form.reason} onChange={e => setForm(prev => ({
                ...prev,
                reason: e.target.value
              }))}></textarea>
                </div>
              </div>

            <div className="pt-6">
              <button type="submit" disabled={sending} className="w-full bg-amber-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-amber-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-70">
                {sending ? 'Отправляем...' : 'Отправить заявку'}
              </button>
              <p className="text-xs text-gray-500 text-center mt-4">
                Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>;
}
