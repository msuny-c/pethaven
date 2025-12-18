import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HeroSection } from '../components/HeroSection';
import { AnimalCard } from '../components/AnimalCard';
import { getAnimals } from '../services/api';
import { Animal } from '../types';
import { ArrowRight, CheckCircle2, Heart, Users, Home as HomeIcon } from 'lucide-react';
import { motion } from 'framer-motion';
export function Home() {
  const [featuredAnimals, setFeaturedAnimals] = useState<Animal[]>([]);
  useEffect(() => {
    getAnimals().then(data => {
      const available = data.filter(a => a.status === 'available');
      setFeaturedAnimals(available.slice(0, 6));
    }).catch(() => setFeaturedAnimals([]));
  }, []);
  const stats = [{
    label: 'Животных нашли дом',
    value: '120+',
    icon: HomeIcon
  }, {
    label: 'Активных волонтёров',
    value: '50+',
    icon: Users
  }, {
    label: 'Успешных адопций',
    value: '95%',
    icon: Heart
  }];
  const steps = [{
    title: 'Выберите питомца',
    desc: 'Изучите наш каталог и найдите того, кто западет в душу.',
    step: '01'
  }, {
    title: 'Подайте заявку',
    desc: 'Заполните простую анкету, чтобы мы узнали вас лучше.',
    step: '02'
  }, {
    title: 'Пройдите интервью',
    desc: 'Пообщайтесь с куратором и познакомьтесь с питомцем.',
    step: '03'
  }, {
    title: 'Заберите домой',
    desc: 'Подпишите договор и начните новую счастливую жизнь.',
    step: '04'
  }];
  return <div className="min-h-screen bg-white">
      <HeroSection />

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.1
          }} className="bg-amber-50 rounded-2xl p-8 text-center hover:shadow-md transition-shadow">
                <div className="inline-flex p-3 bg-amber-100 rounded-full text-amber-600 mb-4">
                  <stat.icon className="w-8 h-8" />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Featured Animals */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Ищут дом
              </h2>
              <p className="text-gray-600 max-w-xl">
                Познакомьтесь с нашими подопечными. Они очень ждут своего
                человека.
              </p>
            </div>
            <Link to="/animals" className="hidden sm:flex items-center text-amber-600 font-bold hover:text-amber-700 transition-colors">
              Смотреть всех
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredAnimals.map(animal => <AnimalCard key={animal.id} animal={animal} />)}
          </div>

          <div className="mt-12 text-center sm:hidden">
            <Link to="/animals" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-amber-500 hover:bg-amber-600">
              Смотреть всех питомцев
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Как забрать питомца?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Процесс адопции создан так, чтобы убедиться, что вы и питомец
              идеально подходите друг другу.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gray-100 -z-10" />

            {steps.map((step, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.1
          }} className="bg-white p-6 relative">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-amber-50 shadow-sm">
                  <span className="text-3xl font-bold text-amber-500">
                    {step.step}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-500 text-center text-sm leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Готовы изменить чью-то жизнь?
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Ваш будущий друг уже ждет вас. Сделайте первый шаг навстречу
            счастью.
          </p>
          <Link to="/animals" className="inline-flex items-center justify-center px-10 py-4 text-lg font-bold text-gray-900 bg-amber-500 rounded-full hover:bg-amber-400 transition-all shadow-lg hover:shadow-amber-500/20">
            Найти друга
          </Link>
        </div>
      </section>
    </div>;
}
