import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { getVolunteerApplications } from '../services/api';
interface ProtectedRouteProps {
  allowedRoles?: string[];
  allowVolunteerPending?: boolean;
}
export function ProtectedRoute({
  allowedRoles,
  allowVolunteerPending = false
}: ProtectedRouteProps) {
  const {
    user,
    primaryRole,
    isAuthenticated
  } = useAuth();
  const allowedRolesKey = allowedRoles?.join(',') || '';
  const [checkingVolunteer, setCheckingVolunteer] = useState(false);
  const [volunteerApproved, setVolunteerApproved] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (primaryRole === 'volunteer' && allowedRoles?.includes('volunteer') && !allowVolunteerPending) {
      setCheckingVolunteer(true);
      getVolunteerApplications().then(apps => {
        if (cancelled) return;
        const hasApproved = apps.some(a => a.status === 'approved');
        setVolunteerApproved(hasApproved);
      }).catch(() => {
        if (cancelled) return;
        setVolunteerApproved(false);
      }).finally(() => {
        if (cancelled) return;
        setCheckingVolunteer(false);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [primaryRole, allowedRolesKey, allowVolunteerPending]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && primaryRole && !allowedRoles.includes(primaryRole)) {
    // Redirect to their appropriate dashboard if they try to access unauthorized route
    return <Navigate to={`/${primaryRole}/dashboard`} replace />;
  }
  if (checkingVolunteer) {
    return <div className="p-6 text-center text-gray-600">Проверяем статус волонтера...</div>;
  }
  if (!allowVolunteerPending && allowedRoles?.includes('volunteer') && primaryRole === 'volunteer' && volunteerApproved === false) {
    return <Navigate to="/volunteer/pending" replace />;
  }
  return <Outlet />;
}
