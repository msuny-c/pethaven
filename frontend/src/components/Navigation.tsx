import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PawPrint, Menu, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const {
    user,
    primaryRole,
    isAuthenticated
  } = useAuth();
  const links = [{
    name: 'Главная',
    path: '/'
  }, {
    name: 'Питомцы',
    path: '/animals'
  }, {
    name: 'О приюте',
    path: '/about'
  }];
  const getDashboardLink = () => {
    if (!user) return '/login';
    return `/${primaryRole}/dashboard`;
  };
  return <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-amber-500 p-1.5 rounded-lg group-hover:bg-amber-600 transition-colors">
              <PawPrint className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              Pet Haven
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {links.map(link => <Link key={link.path} to={link.path} className={`text-sm font-medium transition-colors hover:text-amber-600 ${location.pathname === link.path ? 'text-amber-600' : 'text-gray-600'}`}>
                {link.name}
              </Link>)}

            {!isAuthenticated && <Link to="/register" className="text-sm font-medium text-gray-600 hover:text-amber-600 transition-colors">
                Регистрация
              </Link>}
            {isAuthenticated ? <Link to={getDashboardLink()} className="flex items-center text-sm font-medium text-gray-700 hover:text-amber-600 transition-colors">
                <User className="w-4 h-4 mr-2" />
                Кабинет
              </Link> : <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-amber-600 transition-colors">
                Вход
              </Link>}

            <Link to="/volunteer" className="bg-amber-500 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-amber-600 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
              Помочь приюту
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 hover:text-gray-900 focus:outline-none">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && <motion.div initial={{
        opacity: 0,
        height: 0
      }} animate={{
        opacity: 1,
        height: 'auto'
      }} exit={{
        opacity: 0,
        height: 0
      }} className="md:hidden bg-white border-b border-gray-100 overflow-hidden">
            <div className="px-4 pt-2 pb-6 space-y-2">
              {links.map(link => <Link key={link.path} to={link.path} onClick={() => setIsOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === link.path ? 'bg-amber-50 text-amber-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                  {link.name}
                </Link>)}
              <Link to="/volunteer" onClick={() => setIsOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/volunteer' ? 'bg-amber-50 text-amber-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                Помочь приюту
              </Link>
              <div className="pt-4 border-t border-gray-100 mt-2">
                {!isAuthenticated && <Link to="/register" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-amber-600">
                    Регистрация кандидата
                  </Link>}
                {isAuthenticated ? <Link to={getDashboardLink()} onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-amber-600">
                    Личный кабинет
                  </Link> : <Link to="/login" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-amber-600">
                    Вход для сотрудников
                  </Link>}
              </div>
            </div>
          </motion.div>}
      </AnimatePresence>
    </nav>;
}
