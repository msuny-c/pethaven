import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Agreement, Application, Animal } from '../../types';
import { getAgreements, getApplications, getAnimals } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, PawPrint, FileText } from 'lucide-react';

export function CandidateAgreements() {
  const { user } = useAuth();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [applications, setApplications] = useState<Record<number, Application>>({});
  const [animals, setAnimals] = useState<Record<number, Animal>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [agrs, apps, animalsRes] = await Promise.all([getAgreements(), getApplications(), getAnimals()]);
        const myApps = apps.filter((a) => a.candidateId === user.id);
        const appsMap: Record<number, Application> = {};
        myApps.forEach((a) => (appsMap[a.id] = a));
        setApplications(appsMap);
        const myAgreements = agrs.filter((a) => appsMap[a.applicationId]);
        setAgreements(myAgreements);
        const animalMap: Record<number, Animal> = {};
        animalsRes.forEach((a) => (animalMap[a.id] = a));
        setAnimals(animalMap);
      } catch (e) {
        console.error('Failed to load agreements', e);
      }
    })();
  }, [user]);

  return (
    <DashboardLayout title="Договоры и передачи">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {agreements.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Пока нет договоров</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {agreements.map((agreement) => {
              const app = applications[agreement.applicationId];
              const animal = app ? animals[app.animalId] : undefined;
              return (
                <div key={agreement.id} className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <img
                      src={
                        (animal?.photos && animal.photos[0]) ||
                        'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=200&q=80'
                      }
                      alt={animal?.name}
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-amber-500" />
                        <span className="font-semibold text-gray-900">
                          Договор #{agreement.id} • {animal?.name || `Заявка ${agreement.applicationId}`}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 gap-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          {agreement.confirmedAt
                            ? 'Передача подтверждена'
                            : agreement.signedUrl
                              ? 'Подписан, ждёт проверки'
                              : 'Ожидает подписи'}
                        </span>
                        <span className="flex items-center text-xs text-gray-500">
                          <PawPrint className="w-3 h-3 mr-1" />
                          {animal?.breed}
                        </span>
                        {agreement.signedDate && (
                          <span className="flex items-center text-xs text-gray-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            Подписан: {agreement.signedDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/candidate/agreements/${agreement.id}`}
                    className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600"
                  >
                    Открыть
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
