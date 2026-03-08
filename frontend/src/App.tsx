import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

import { Suspense, lazy } from 'react';

// Lazy Load Layouts
const MainLayout = lazy(() => import('./layouts/MainLayout'));
const CompanyLayout = lazy(() => import('./layouts/CompanyLayout'));

// Lazy Load Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const CompanyOnboarding = lazy(() => import('./pages/company/CompanyOnboarding'));
const WorkerOnboarding = lazy(() => import('./pages/worker/WorkerOnboarding'));
const WorkerDashboard = lazy(() => import('./pages/worker/WorkerDashboard'));
const CompanyDashboard = lazy(() => import('./pages/company/CompanyDashboard'));
const Jobs = lazy(() => import('./pages/Jobs'));
const Messages = lazy(() => import('./pages/Messages'));
const Profile = lazy(() => import('./pages/Profile'));
const Analytics = lazy(() => import('./pages/Analytics'));
const MyJobs = lazy(() => import('./pages/MyJobs'));
const Wallet = lazy(() => import('./pages/Wallet'));

// Company Pages
const CompanyCreateJob = lazy(() => import('./pages/company/CompanyCreateJob'));
const CompanyJobs = lazy(() => import('./pages/company/CompanyJobs'));
const CompanyProfile = lazy(() => import('./pages/company/CompanyProfile'));
const CompanyAnalytics = lazy(() => import('./pages/company/CompanyAnalytics'));
const CompanyJobDetails = lazy(() => import('./pages/company/CompanyJobDetails'));
const CompanyJobCandidates = lazy(() => import('./pages/company/CompanyJobCandidates'));
const CompanyMessages = lazy(() => import('./pages/company/CompanyMessages'));
const CompanyWallet = lazy(() => import('./pages/company/CompanyWallet'));
const WorkerPublicProfile = lazy(() => import('./pages/company/WorkerPublicProfile'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Admin = lazy(() => import('./pages/Admin'));
const Help = lazy(() => import('./pages/Help'));

// Loading Component
const PageLoader = () => (
  <div className="h-screen w-full flex items-center justify-center bg-[#F4F4F0]">
    <Loader2 className="animate-spin text-primary" size={48} />
  </div>
);

// Componente para redirecionar usuários logados da raiz
function HomeRedirect() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const userType = user.user_metadata?.user_type;
        if (userType === 'hire') {
          navigate('/company/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
      setChecking(false);
    });
  }, [navigate]);

  if (checking) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return <Onboarding />;
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <ToastProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<HomeRedirect />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/termos" element={<Terms />} />
                  <Route path="/privacidade" element={<Privacy />} />
                  <Route path="/esqueci-senha" element={<ForgotPassword />} />
                  <Route path="/redefinir-senha" element={<ResetPassword />} />
                  <Route path="/ajuda" element={<Help />} />

                  {/* Protected Routes */}
                  <Route element={<ProtectedRoute />}>

                    {/* Admin Route - standalone layout */}
                    <Route path="/admin" element={<Admin />} />

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
                      <Route path="wallet" element={<CompanyWallet />} />
                      <Route path="analytics" element={<CompanyAnalytics />} />
                    </Route>

                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </ToastProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
