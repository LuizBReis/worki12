import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import CompanyLayout from './layouts/CompanyLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import CompanyOnboarding from './pages/company/CompanyOnboarding';
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
import WorkerPublicProfile from './pages/company/WorkerPublicProfile';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Onboarding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/company/onboarding" element={<CompanyOnboarding />} />

        <Route path="/" element={<MainLayout />}>
          {/* Main Worker Routes */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="my-jobs" element={<MyJobs />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="profile" element={<Profile />} />

          {/* Secondary/Legacy Routes */}
          <Route path="messages" element={<Messages />} />
          <Route path="create" element={<CreateJob />} />

          {/* Worker Specific (explicit) */}
          <Route path="worker/dashboard" element={<WorkerDashboard />} />
        </Route>

        {/* Company Routes */}
        <Route path="/company" element={<CompanyLayout />}>
          <Route path="dashboard" element={<CompanyDashboard />} />
          <Route path="create" element={<CompanyCreateJob />} />
          <Route path="jobs" element={<CompanyJobs />} />
          <Route path="jobs/:id" element={<CompanyJobDetails />} />
          <Route path="jobs/:id/edit" element={<CompanyCreateJob />} />
          <Route path="jobs/:id/candidates" element={<CompanyJobCandidates />} />
          <Route path="worker/:id" element={<WorkerPublicProfile />} />
          <Route path="profile" element={<CompanyProfile />} />
          <Route path="analytics" element={<CompanyAnalytics />} />
          {/* Add more company routes here later */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
