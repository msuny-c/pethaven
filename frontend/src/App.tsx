import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
// Public Pages
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Login } from './pages/Login';
import { Catalog } from './pages/Catalog';
import { AnimalProfile } from './pages/AnimalProfile';
import { CandidateAnimalDetail } from './pages/candidate/AnimalDetail';
import { AdoptionForm } from './pages/AdoptionForm';
import { Volunteer } from './pages/Volunteer';
// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminAnimals } from './pages/admin/Animals';
import { AdminUsers } from './pages/admin/Users';
import { AdminReports } from './pages/admin/Reports';
import { AdminVolunteerApplications } from './pages/admin/VolunteerApplications';
// Coordinator Pages
import { CoordinatorDashboard } from './pages/coordinator/Dashboard';
import { CoordinatorApplications } from './pages/coordinator/Applications';
import { CoordinatorInterviews } from './pages/coordinator/Interviews';
import { CoordinatorTransfers } from './pages/coordinator/Transfers';
import { CoordinatorPostAdoption } from './pages/coordinator/PostAdoption';
import { CoordinatorReportDetail } from './pages/coordinator/ReportDetail';
import { CoordinatorShiftManagement } from './pages/coordinator/ShiftManagement';
import { CoordinatorAnimals } from './pages/coordinator/Animals';
import { CandidateProfile } from './pages/coordinator/CandidateProfile';
import { CoordinatorApplicationDetail } from './pages/coordinator/ApplicationDetail';
// Vet Pages
import { VetDashboard } from './pages/vet/Dashboard';
import { VetAnimals } from './pages/vet/Animals';
import { VetMedicalRecords } from './pages/vet/MedicalRecords';
// Volunteer Pages
import { VolunteerDashboard } from './pages/volunteer/Dashboard';
import { VolunteerShifts } from './pages/volunteer/Shifts';
import { VolunteerTasks } from './pages/volunteer/Tasks';
import { VolunteerPostAdoptionReview } from './pages/volunteer/PostAdoptionReview';
import { VolunteerReports } from './pages/volunteer/Reports';
import { VolunteerPending } from './pages/volunteer/Pending';
// Candidate Pages
import { CandidateDashboard } from './pages/candidate/Dashboard';
import { CandidateApplications } from './pages/candidate/MyApplications';
import { CandidateAnimals } from './pages/candidate/Animals';
import { ProfilePage } from './pages/Profile';
import { CandidateReports } from './pages/candidate/Reports';
import { CandidateReportDetail } from './pages/candidate/ReportDetail';
import { CandidateApplicationForm } from './pages/candidate/ApplicationForm';
import { CandidateApplicationDetail } from './pages/candidate/ApplicationDetail';
function ScrollToTop() {
  const {
    pathname
  } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
function Layout({
  children
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const isDashboard = location.pathname.includes('/admin') || location.pathname.includes('/coordinator') || location.pathname.includes('/veterinar') || location.pathname.includes('/volunteer') || location.pathname.includes('/candidate') || location.pathname === '/login' || location.pathname === '/profile';
  return <div className="flex flex-col min-h-screen font-sans text-gray-900">
      {!isDashboard && <Navigation />}
      <main className="flex-grow">{children}</main>
      {!isDashboard && <Footer />}
    </div>;
}
export function App() {
  return <AuthProvider>
      <Router>
        <ScrollToTop />
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/animals" element={<Catalog />} />
            <Route path="/animals/:id" element={<AnimalProfile />} />
            <Route path="/adopt/:id" element={<AdoptionForm />} />
            <Route path="/volunteer" element={<Volunteer />} />

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/animals" element={<AdminAnimals />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/volunteers" element={<AdminVolunteerApplications />} />
            </Route>

            {/* Coordinator Routes */}
            <Route element={<ProtectedRoute allowedRoles={['coordinator']} />}>
              <Route path="/coordinator/dashboard" element={<CoordinatorDashboard />} />
              <Route path="/coordinator/applications" element={<CoordinatorApplications />} />
              <Route path="/coordinator/applications/:id" element={<CoordinatorApplicationDetail />} />
              <Route path="/coordinator/interviews" element={<CoordinatorInterviews />} />
              <Route path="/coordinator/transfers" element={<CoordinatorTransfers />} />
              <Route path="/coordinator/post-adoption" element={<CoordinatorPostAdoption />} />
              <Route path="/coordinator/reports/:id" element={<CoordinatorReportDetail />} />
              <Route path="/coordinator/animals" element={<CoordinatorAnimals />} />
              <Route path="/coordinator/animals/:id" element={<AnimalProfile />} />
              <Route path="/coordinator/shift-management" element={<CoordinatorShiftManagement />} />
              <Route path="/coordinator/candidate/:id" element={<CandidateProfile />} />
            </Route>

            {/* Vet Routes */}
            <Route element={<ProtectedRoute allowedRoles={['veterinar']} />}>
              <Route path="/veterinar/dashboard" element={<VetDashboard />} />
              <Route path="/veterinar/animals" element={<VetAnimals />} />
              <Route path="/veterinar/medical-records/:animalId" element={<VetMedicalRecords />} />
            </Route>

            {/* Volunteer Routes */}
            <Route element={<ProtectedRoute allowedRoles={['volunteer']} />}>
              <Route path="/volunteer/dashboard" element={<VolunteerDashboard />} />
              <Route path="/volunteer/shifts" element={<VolunteerShifts />} />
              <Route path="/volunteer/tasks" element={<VolunteerTasks />} />
              <Route path="/volunteer/post-adoption" element={<VolunteerPostAdoptionReview />} />
              <Route path="/volunteer/reports" element={<VolunteerReports />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['volunteer']} allowVolunteerPending={true} />}>
              <Route path="/volunteer/pending" element={<VolunteerPending />} />
            </Route>

            {/* Candidate Routes */}
            <Route element={<ProtectedRoute allowedRoles={['candidate']} />}>
              <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
              <Route path="/candidate/applications" element={<CandidateApplications />} />
              <Route path="/candidate/applications/:id" element={<CandidateApplicationDetail />} />
              <Route path="/candidate/animals" element={<CandidateAnimals />} />
              <Route path="/candidate/animals/:id" element={<CandidateAnimalDetail />} />
              <Route path="/candidate/apply/:id" element={<CandidateApplicationForm />} />
              <Route path="/candidate/reports" element={<CandidateReports />} />
              <Route path="/candidate/reports/:id" element={<CandidateReportDetail />} />
              <Route path="/candidate/profile" element={<ProfilePage />} />
            </Route>

            {/* General profile for all roles */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'coordinator', 'veterinar', 'volunteer', 'candidate']} />}>
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>;
}
