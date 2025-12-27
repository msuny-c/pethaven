import React from 'react';
import { Link } from 'react-router-dom';
import { PawPrint } from 'lucide-react';
export function Footer() {
  return <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12 items-start">
          {/* Brand */}
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
          </div>

          {/* Quick Links */}
          <div className="md:text-right md:ml-auto">
            <h3 className="text-white font-bold text-lg mb-6">Навигация</h3>
            <ul className="space-y-4 md:space-y-3">
              <li>
                <Link to="/animals" className="hover:text-amber-500 transition-colors inline-flex items-center justify-end gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                  <span>Наши питомцы</span>
                </Link>
              </li>
              <li>
                <Link to="/volunteer" className="hover:text-amber-500 transition-colors inline-flex items-center justify-end gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                  <span>Стать волонтёром</span>
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-amber-500 transition-colors inline-flex items-center justify-end gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                  <span>О приюте</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>© 2025 Pet Haven. Все права защищены.</p>
        </div>
      </div>
    </footer>;
}
