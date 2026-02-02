import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './contexts/ToastContext';

import MainLayout from './layouts/MainLayout';
import CompanyLayout from './layouts/CompanyLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import CompanyOnboarding from './pages/company/CompanyOnboarding';
import WorkerOnboarding from './pages/worker/WorkerOnboarding';
import WorkerDashboard from './pages/worker/WorkerDashboard';
import CompanyDashboard from './pages/company/CompanyDashboard';
import Jobs from './pages/Jobs';
import CreateJob from './pages/CreateJob';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';
import MyJobs from './pages/MyJobs';
import Wallet from './pages/Wallet';
import CompanyCreateJob from './pages/company/CompanyCreateJob';
import CompanyJobs from './pages/company/CompanyJobs';
import CompanyProfile from './pages/company/CompanyProfile';
import CompanyAnalytics from './pages/company/CompanyAnalytics';
import CompanyJobDetails from './pages/company/CompanyJobDetails';
import CompanyJobCandidates from './pages/company/CompanyJobCandidates';
import CompanyMessages from './pages/company/CompanyMessages';
import WorkerPublicProfile from './pages/company/WorkerPublicProfile';

// Componente para redirecionar usuários logados da raiz
function HomeRedirect() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        // Simple check: if metadata says company, go company, else worker dashboard
        // For robustness we could check table specific data, but auth metadata or just default to dashboard is safer
        navigate('/dashboard');
      }
      setChecking(false);
    });
  }, [navigate]);

  if (checking) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return <Onboarding />;
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>

            {/* Onboarding Routes - still protected as they need user session but not full layout yet if incomplete */}
            <Route path="/company/onboarding" element={<CompanyOnboarding />} />
            <Route path="/worker/onboarding" element={<WorkerOnboarding />} />

            {/* Worker Layout Routes */}
            <Route path="/" element={<MainLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="jobs" element={<Jobs />} />
              <Route path="my-jobs" element={<MyJobs />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="wallet" element={<Wallet />} />
              <Route path="profile" element={<Profile />} />
              <Route path="messages" element={<Messages />} />
              <Route path="create" element={<CreateJob />} /> {/* Legacy? */}
              <Route path="worker/dashboard" element={<WorkerDashboard />} />
            </Route>

            {/* Company Layout Routes */}
            <Route path="/company" element={<CompanyLayout />}>
              <Route path="dashboard" element={<CompanyDashboard />} />
              <Route path="create" element={<CompanyCreateJob />} />
              <Route path="jobs" element={<CompanyJobs />} />
              <Route path="jobs/:id" element={<CompanyJobDetails />} />
              <Route path="jobs/:id/edit" element={<CompanyCreateJob />} />
              <Route path="jobs/:id/candidates" element={<CompanyJobCandidates />} />
              <Route path="worker/:id" element={<WorkerPublicProfile />} />
              <Route path="profile" element={<CompanyProfile />} />
              <Route path="messages" element={<CompanyMessages />} />
              <Route path="analytics" element={<CompanyAnalytics />} />
            </Route>

          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
