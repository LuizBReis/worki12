
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import WorkerDashboard from './pages/worker/WorkerDashboard';
import CompanyDashboard from './pages/company/CompanyDashboard';
import Jobs from './pages/Jobs';
import CreateJob from './pages/CreateJob';
import Messages from './pages/Messages';
import Profile from './pages/Profile';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Onboarding />} />
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<MainLayout />}>
          {/* Shared/Legacy Routes */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="create" element={<CreateJob />} />
          <Route path="messages" element={<Messages />} />
          <Route path="profile" element={<Profile />} />

          {/* Role-Based Routes */}
          <Route path="worker/dashboard" element={<WorkerDashboard />} />
          <Route path="company/dashboard" element={<CompanyDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
