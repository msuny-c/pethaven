import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { Calendar, PawPrint } from 'lucide-react';
import { Application, Animal, Agreement } from '../../types';
import { getApplications, getAnimals, getAgreements } from '../../services/api';
import { AnimalAvatar } from '../../components/AnimalAvatar';
import { useAuth } from '../../contexts/AuthContext';
export function CandidateApplications() {
  const { user } = useAuth();
  const [myApps, setMyApps] = useState<Application[]>([]);
  const [animalMap, setAnimalMap] = useState<Record<number, Animal>>({});
  const [agreements, setAgreements] = useState<Record<number, Agreement>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [appsRes, animalsRes, agreementsRes] = await Promise.allSettled([
        getApplications(),
        getAnimals(),
        getAgreements()
      ]);

      if (appsRes.status === 'fulfilled') {
        setMyApps(appsRes.value.filter((a) => a.candidateId === user.id));
      } else {
        console.error('Failed to load applications', appsRes.reason);
      }

      if (animalsRes.status === 'fulfilled') {
        const map: Record<number, Animal> = {};
        animalsRes.value.forEach((a) => (map[a.id] = a));
        setAnimalMap(map);
      } else {
        console.error('Failed to load animals', animalsRes.reason);
      }

      if (agreementsRes.status === 'fulfilled') {
        const agrMap: Record<number, Agreement> = {};
        agreementsRes.value.forEach((a) => {
          agrMap[a.applicationId] = a;
        });
        setAgreements(agrMap);
      } else {
        console.warn('Agreements not available for this user', agreementsRes.reason);
      }
    })();
  }, [user]);

  return <DashboardLayout title="Мои заявки">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {myApps.length > 0 ? <div className="divide-y divide-gray-100">
            {myApps.map(app => {
          const animal = animalMap[app.animalId];
          return <div key={app.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start">
                    <AnimalAvatar
                      src={animal?.photos?.[0]}
                      name={animal?.name}
                      sizeClass="w-16 h-16"
                      roundedClassName="rounded-lg"
                      className="mr-4"
                    />
                      <div>
                        <div className="flex items-center mb-1">
                          <h3 className="text-lg font-bold text-gray-900 mr-3">
                            {animal?.name}
                          </h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${app.status === 'approved' ? 'bg-green-100 text-green-700' : app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                            {app.status === 'submitted'
                              ? 'Отправлено'
                              : app.status === 'under_review'
                                ? 'На рассмотрении'
                                : app.status === 'approved'
                                  ? 'Одобрено'
                                  : app.status === 'cancelled'
                                    ? 'Отменено'
                                    : 'Отклонено'}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <PawPrint className="w-3 h-3 mr-1" />
                          {animal?.breed}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          Подано: {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : ''}
                        </div>
                      </div>
                    </div>
                    <Link to={`/candidate/applications/${app.id}`} className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600">
                      Открыть
                    </Link>
                  </div>
                </div>;
        })}
          </div> : <div className="p-12 text-center text-gray-500">
            <p>У вас пока нет заявок</p>
          </div>}
      </div>
    </DashboardLayout>;
}
