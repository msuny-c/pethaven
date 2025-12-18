import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
export function About() {
  return <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            О приюте Pet Haven
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Мы — команда энтузиастов, объединенных одной целью: сделать так,
            чтобы у каждого животного был дом, полная миска и любящий хозяин.
          </p>
        </div>
      </div>

      {/* Mission */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <img src="https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&w=1000&q=80" alt="Shelter team" className="rounded-3xl shadow-2xl" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Наша миссия
              </h2>
              <div className="prose prose-lg text-gray-600">
                <p className="mb-4">
                  Pet Haven был основан в 2020 году группой волонтеров. Мы
                  начинали с небольшой передержки, а сегодня это современный
                  центр помощи животным.
                </p>
                <p className="mb-4">
                  Мы не просто ищем дом для животных. Мы лечим, социализируем и
                  готовим их к жизни в семье. Мы также проводим просветительскую
                  работу, рассказывая об ответственном отношении к питомцам.
                </p>
                <p>
                  Наш приют существует исключительно на пожертвования
                  неравнодушных людей. Каждый рубль идет на корм, лекарства и
                  улучшение условий жизни наших подопечных.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-8">Контакты</h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <MapPin className="w-6 h-6 text-amber-500 mr-4 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg">Адрес</h3>
                    <p className="text-gray-400">
                      Санкт-Петербург, ул. Примерная, 123
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Вход со двора, синие ворота
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Phone className="w-6 h-6 text-amber-500 mr-4 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg">Телефон</h3>
                    <p className="text-gray-400">+7 (812) 123-45-67</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Ежедневно с 10:00 до 20:00
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Mail className="w-6 h-6 text-amber-500 mr-4 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg">Email</h3>
                    <p className="text-gray-400">info@pethaven.ru</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="w-6 h-6 text-amber-500 mr-4 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg">Режим работы</h3>
                    <p className="text-gray-400">Пн-Пт: 10:00 - 18:00</p>
                    <p className="text-gray-400">Сб-Вс: 11:00 - 17:00</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Посещение только по предварительной записи
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="bg-gray-800 rounded-2xl h-full min-h-[300px] flex items-center justify-center border border-gray-700">
              <p className="text-gray-500">Интерактивная карта</p>
            </div>
          </div>
        </div>
      </section>
    </div>;
}