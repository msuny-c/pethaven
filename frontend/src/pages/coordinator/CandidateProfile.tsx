import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { ArrowLeft, Mail, Phone, FileText, Calendar } from 'lucide-react';
import { PersonAvatar } from '../../components/PersonAvatar';
import { AnimalAvatar } from '../../components/AnimalAvatar';
import { Application, Animal, UserProfile } from '../../types';
import { getAnimals, getApplications, getUsers } from '../../services/api';

export function CandidateProfile() {
  const { id } = useParams();
  const [candidate, setCandidate] = useState<UserProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [animals, setAnimals] = useState<Record<number, Animal>>({});

  useEffect(() => {
    if (!id) return;
    const candidateId = Number(id);
    Promise.all([getUsers(), getApplications(), getAnimals()]).then(([usersData, apps, animalsList]) => {
      setCandidate(usersData.find((u) => u.id === candidateId) || null);
      setApplications(apps.filter((a) => a.candidateId === candidateId));
      const map: Record<number, Animal> = {};
      animalsList.forEach((a) => (map[a.id] = a));
      setAnimals(map);
    });
  }, [id]);

  const latestEmail = useMemo(() => candidate?.email, [candidate]);
  const latestPhone = useMemo(() => candidate?.phoneNumber, [candidate]);

  if (!candidate) {
    return (
      <DashboardLayout title="Профиль кандидата">
        <div className="text-center py-12 text-gray-500">Кандидат не найден</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Профиль кандидата"
      actions={
        <Link
          to="/coordinator/applications"
          className="flex items-center text-gray-600 hover:text-gray-900 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к заявкам
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="text-center mb-6">
              <PersonAvatar
                src={candidate.avatarUrl}
                name={candidate.email}
                sizeClass="w-24 h-24"
                className="mx-auto mb-4 border-4 border-amber-100"
              />
              <h2 className="text-xl font-bold text-gray-900">
                {candidate.firstName} {candidate.lastName}
              </h2>
              <p className="text-sm text-gray-500">Кандидат на адопцию</p>
            </div>

            <div className="space-y-4 border-t border-gray-100 pt-6">
              <div className="flex items-center text-sm">
                <Mail className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-600">{latestEmail || '—'}</span>
              </div>

              <div className="flex items-center text-sm">
                <Phone className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-600">{latestPhone || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-amber-500" />
              История заявок
            </h3>

            {applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map((app) => {
                  const animal = animals[app.animalId];
                  return (
                    <Link
                      to={`/coordinator/applications/${app.id}`}
                      key={app.id}
                      className="block border border-gray-100 rounded-lg p-4 hover:border-amber-200 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          {animal && (
                            <AnimalAvatar
                              src={animal.photos?.[0]}
                              name={animal.name}
                              sizeClass="w-12 h-12"
                              roundedClassName="rounded-lg"
                              className="mr-3"
                            />
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{animal?.name}</div>
                            <div className="text-xs text-gray-500">{animal?.breed}</div>
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            app.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : app.status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : app.status === 'under_review'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {app.status === 'approved'
                            ? 'Одобрено'
                            : app.status === 'rejected'
                              ? 'Отклонено'
                              : app.status === 'under_review'
                                ? 'На рассмотрении'
                                : 'Подано'}
                        </span>
                      </div>

                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        Подано: {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '—'}
                      </div>

                      {app.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                          <span className="font-medium">Комментарий:</span> {app.notes}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Нет поданных заявок</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
