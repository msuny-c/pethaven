import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Heart } from 'lucide-react';
export function HeroSection() {
  return <section className="relative min-h-[85vh] flex items-center bg-gradient-to-br from-amber-50 via-white to-gray-50 overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-amber-100/30 rounded-l-[100px] transform translate-x-1/3 z-0" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{
          opacity: 0,
          x: -30
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          duration: 0.8
        }}>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium mb-6">
              <Heart className="w-4 h-4 mr-2 fill-current" />
              Подарите дом счастью
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.1] mb-6 tracking-tight">
              Найдите своего <br />
              <span className="text-amber-500">лучшего друга</span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-lg leading-relaxed">
              Каждое животное заслуживает любящий дом. В Pet Haven мы соединяем
              сердца и создаем счастливые истории.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-4">
              <Link to="/animals" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-amber-500 rounded-full hover:bg-amber-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                Посмотреть питомцев
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link to="/volunteer" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-gray-700 bg-white border-2 border-gray-200 rounded-full hover:border-amber-500 hover:text-amber-600 transition-all">
                Стать волонтёром
              </Link>
              <Link to="/register" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-amber-600 bg-amber-50 border-2 border-amber-100 rounded-full hover:border-amber-400 hover:bg-amber-100 transition-all">
                Зарегистрироваться как кандидат
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-8 text-gray-500 text-sm font-medium">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                120+ нашли дом
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                50+ волонтёров
              </div>
            </div>
          </motion.div>

          <motion.div initial={{
          opacity: 0,
          scale: 0.9
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          duration: 0.8,
          delay: 0.2
        }} className="relative hidden lg:block">
            <div className="relative z-10 rounded-[40px] overflow-hidden shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <img src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1000&q=80" alt="Happy dog" className="w-full h-auto object-cover" />
            </div>
            {/* Decorative elements */}
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
          </motion.div>
        </div>
      </div>
    </section>;
}
