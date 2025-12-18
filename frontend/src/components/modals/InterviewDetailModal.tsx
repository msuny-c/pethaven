import React from 'react';
import { motion } from 'framer-motion';
import { X, User, PawPrint, Calendar, Clock, Phone, Mail } from 'lucide-react';
import { Interview, Application, Animal, UserProfile } from '../../types';
interface InterviewDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview: Interview;
  application: Application;
  animal: Animal;
  candidate: UserProfile;
  onComplete: () => void;
  onCancel: () => void;
}
export function InterviewDetailModal({
  isOpen,
  onClose,
  interview,
  application,
  animal,
  candidate,
  onComplete,
  onCancel
}: InterviewDetailModalProps) {
  if (!isOpen) return null;
  const animalPhoto = (animal?.photos && animal.photos.length > 0)
    ? animal.photos[0]
    : 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=200&q=80';
  const interviewDate = new Date(interview.scheduledDatetime);
  return <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{
      opacity: 0,
      scale: 0.95
    }} animate={{
      opacity: 1,
      scale: 1
    }} className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-xl font-bold text-gray-900">Детали интервью</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Candidate Info */}
            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="text-lg font-bold text-gray-900">Кандидат</h4>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Имя</div>
                  <div className="font-medium text-gray-900">
                    {candidate.firstName} {candidate.lastName}
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <Mail className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-700">
                    {candidate.email}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-700">
                    {candidate.phoneNumber || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Animal Info */}
            <div className="bg-amber-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-amber-100 rounded-lg mr-3">
                <PawPrint className="w-6 h-6 text-amber-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">Животное</h4>
            </div>

            <div className="mb-4">
              <img src={animalPhoto} alt={animal.name} className="w-full h-48 object-cover rounded-lg" />
            </div>

              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Имя</div>
                  <div className="font-medium text-gray-900">{animal.name}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Порода</div>
                    <div className="text-sm text-gray-700">{animal.breed}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Возраст</div>
                    <div className="text-sm text-gray-700">
                      ~{animal.ageMonths ? Math.max(1, Math.round(animal.ageMonths / 12)) : 1} лет
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Описание</div>
                  <div className="text-sm text-gray-700">
                    {animal.description}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interview Details */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4">
              Информация об интервью
            </h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <div className="text-sm text-gray-500">Дата</div>
                  <div className="font-medium text-gray-900">
                    {interviewDate.toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <div className="text-sm text-gray-500">Время</div>
                  <div className="font-medium text-gray-900">
                    {interviewDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${interview.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : interview.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {interview.status === 'scheduled' ? 'Запланировано' : interview.status === 'completed' ? 'Проведено' : 'Отменено'}
              </span>
            </div>

            {interview.coordinatorNotes && <div>
                <div className="text-sm text-gray-500 mb-2">Заметки</div>
                <div className="text-sm text-gray-700 bg-white p-3 rounded-lg">
                  {interview.coordinatorNotes}
                </div>
              </div>}
          </div>

          {/* Actions */}
          {interview.status === 'scheduled' && <div className="flex space-x-3">
              <button onClick={onCancel} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                Отменить интервью
              </button>
              <button onClick={onComplete} className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors">
                Завершить интервью
              </button>
            </div>}
        </div>
      </motion.div>
    </div>;
}
