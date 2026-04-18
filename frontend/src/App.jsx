import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getThemeColors } from './stores/themeStore';
import useAuthStore from './stores/authStore';
import MainLayout from './components/layout/MainLayout';
import SuperAdminRegister from './pages/auth/SuperAdminRegister';
import Login from './pages/auth/Login';
import TeamLeadRegister from './pages/auth/TeamLeadRegister';
import MemberCodeLogin from './pages/auth/MemberCodeLogin';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/dashboard/Dashboard';
import Members from './pages/members/Members';
import PrayerChains from './pages/prayer-chains/PrayerChains';
import Payments from './pages/payments/Payments';
import Rehearsals from './pages/rehearsals/Rehearsals';
import Songs from './pages/songs/Songs';
import Chat from './pages/chat/Chat';
import Checklists from './pages/checklists/Checklists';
import Uniforms from './pages/uniforms/Uniforms';
import Landing from './pages/Landing';
import Settings from './pages/settings/Settings';
import Broadcast from './pages/broadcast/Broadcast';
import PrayerCalendar from './pages/prayer-chains/PrayerCalendar';
import MemberRegister from './pages/member/MemberRegister';
import MemberDashboard from './pages/member/MemberDashboard';
import Attendance from './pages/attendance/Attendance';
import InviteMembers from './pages/invite/InviteMembers';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('rechoir_token');
  const userStr = localStorage.getItem('rechoir_user');
  const user = userStr ? JSON.parse(userStr) : null;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  const initialize = useAuthStore((state) => state.initialize);
  
  useEffect(() => {
    console.log('App - calling initialize');
    initialize();
  }, [initialize]);
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<SuperAdminRegister />} />
          <Route path="/register-team" element={<TeamLeadRegister />} />
          <Route path="/member-code-login" element={<MemberCodeLogin />} />
          <Route path="/member-register" element={<MemberRegister />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/members" element={<Members />} />
            <Route path="/prayer-chains" element={<PrayerChains />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/rehearsals" element={<Rehearsals />} />
            <Route path="/songs" element={<Songs />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/checklists" element={<Checklists />} />
            <Route path="/uniforms" element={<Uniforms />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/broadcast" element={<Broadcast />} />
            <Route path="/prayer-calendar" element={<PrayerCalendar />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/invite" element={<InviteMembers />} />
          </Route>

          <Route path="/member/dashboard" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<MemberDashboard />} />
          </Route>

          <Route path="/member/chat" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Chat />} />
          </Route>

          <Route path="/member/songs" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Songs />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;