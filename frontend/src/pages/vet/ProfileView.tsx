import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { getUsers } from '../../services/api';
import { UserProfile } from '../../types';
import { ArrowLeft, Mail, Phone, Stethoscope } from 'lucide-react';

export function VetProfileView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vet, setVet] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!id) return;
    const vetId = Number(id);
    getUsers()
      .then((users) => setVet(users.find((u) => u.id === vetId) || null))
      .catch(() => setVet(null));
  }, [id]);

  const fullName = useMemo(() => {
    if (!vet) return '';
    return `${vet.firstName || ''} ${vet.lastName || ''}`.trim();
  }, [vet]);

  return (
    <DashboardLayout
      title="Профиль ветеринара"
      actions={
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </button>
      }
    >
      {!vet ? (
        <div className="p-8 text-center text-gray-500">Профиль не найден</div>
      ) : (
        <div className="max-w-3xl bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xl font-bold">
              {(fullName[0] || 'V').toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Stethoscope className="w-4 h-4 text-amber-600" />
                <h2 className="text-xl font-bold text-gray-900">{fullName || 'Ветеринар'}</h2>
              </div>
              <div className="text-sm text-gray-600">{vet.email}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-gray-100 bg-gray-50 flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <div className="text-sm text-gray-700">{vet.email}</div>
            </div>
            <div className="p-4 rounded-lg border border-gray-100 bg-gray-50 flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-400" />
              <div className="text-sm text-gray-700">{vet.phoneNumber || 'Телефон не указан'}</div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
