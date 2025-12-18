import React from 'react';
import { Link } from 'react-router-dom';
import { PawPrint, Mail, Phone, MapPin, Clock, Instagram, Send } from 'lucide-react';
export function Footer() {
  return <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="bg-amber-500 p-1.5 rounded-lg">
                <PawPrint className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                Pet Haven
              </span>
            </Link>
            <p className="text-gray-400 leading-relaxed max-w-xs">
              Мы помогаем животным найти любящий дом, а людям — верных друзей.
              Присоединяйтесь к нашей миссии добра.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="bg-gray-800 p-2 rounded-full hover:bg-amber-500 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="bg-gray-800 p-2 rounded-full hover:bg-amber-500 hover:text-white transition-colors">
                <Send className="h-5 w-5" />
              </a>
              <a href="#" className="bg-gray-800 p-2 rounded-full hover:bg-amber-500 hover:text-white transition-colors">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.07 11.25L14.17 6H13V4H11V6H9.83L8.93 11.25H15.07M17.63 18H6.37C3.96 18 2 19.96 2 22.37V24H22V22.37C22 19.96 20.04 18 17.63 18M12 2C13.11 2 14 2.89 14 4V6H10V4C10 2.89 10.89 2 12 2Z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Навигация</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/animals" className="hover:text-amber-500 transition-colors flex items-center">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2"></span>
                  Наши питомцы
                </Link>
              </li>
              <li>
                <Link to="/volunteer" className="hover:text-amber-500 transition-colors flex items-center">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2"></span>
                  Стать волонтёром
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-amber-500 transition-colors flex items-center">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2"></span>
                  О приюте
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-amber-500 transition-colors flex items-center">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2"></span>
                  Контакты
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Контакты</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
                <span>Санкт-Петербург, ул. Примерная, 123</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 text-amber-500 mr-3 flex-shrink-0" />
                <span>+7 (812) 123-45-67</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 text-amber-500 mr-3 flex-shrink-0" />
                <span>info@pethaven.ru</span>
              </li>
              <li className="flex items-start">
                <Clock className="h-5 w-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p>Пн-Пт: 10:00 - 18:00</p>
                  <p>Сб-Вс: 11:00 - 17:00</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>© 2025 Pet Haven. Все права защищены.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">
              Политика конфиденциальности
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Условия использования
            </a>
          </div>
        </div>
      </div>
    </footer>;
}