import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import Landing from './pages/Landing';
import { useAuth, useUI } from './store';
import { Loading, Logo } from './components/ui';
import { resources } from '../../shared/resources';
import { pathFor } from './utils/format';
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ResourcePage = lazy(() => import('./pages/ResourcePage'));
const Auth = lazy(() => import('./pages/Auth'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));
const Admin = lazy(() => import('./pages/Admin'));
const Legal = lazy(() => import('./pages/Legal'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const TalentRoster = lazy(() => import('./pages/TalentRoster'));
const PublicInvoicePay = lazy(() => import('./pages/PublicInvoicePay'));
const EscrowVaultPage = lazy(() => import('./pages/EscrowVaultPage'));
const SocialStudioPage = lazy(() => import('./pages/SocialStudioPage'));
const AIStudioPage = lazy(() => import('./pages/AIStudioPage'));
const PublicContractSign = lazy(() => import('./pages/PublicContractSign'));
const VideoReviewStudioPage = lazy(() => import('./pages/VideoReviewStudioPage'));
const PublicMediaKit = lazy(() => import('./pages/PublicMediaKit'));
function Protected({ admin = false }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="p-8">
        <Loading />
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
function GuestOnly() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="mx-auto max-w-6xl p-8">
        <Loading />
      </div>
    );
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return <Outlet />;
}
export default function App() {
  const { init, setUser } = useAuth();
  const theme = useUI((s) => s.theme);
  useEffect(() => {
    init();
    const expired = () => setUser(null);
    window.addEventListener('session-expired', expired);
    return () => window.removeEventListener('session-expired', expired);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl p-8">
          <Loading />
        </div>
      }
    >
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/" element={<Landing />} />
          <Route path="/landing" element={<Landing />} />
          {[
            'login',
            'register',
            'forgot-password',
            'verify-email',
            'verify-reset-otp',
            'reset-password',
            'complete-account',
          ].map((path) => (
            <Route key={path} path={`/${path}`} element={<Auth />} />
          ))}
        </Route>
        <Route path="/privacy" element={<Legal privacy />} />
        <Route path="/terms" element={<Legal />} />
        <Route path="/pay/:id" element={<PublicInvoicePay />} />
        <Route path="/sign/:token" element={<PublicContractSign />} />
        <Route path="/u/:username" element={<PublicMediaKit />} />
        <Route path="/media-kit/:username" element={<PublicMediaKit />} />
        <Route element={<Protected />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            {Object.keys(resources).flatMap((resource) =>
              ['', '/new', '/:id', '/:id/edit'].map((suffix) => (
                <Route
                  key={resource + suffix}
                  path={pathFor(resource) + suffix}
                  element={<ResourcePage key={resource} resource={resource} />}
                />
              )),
            )}
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/talent" element={<TalentRoster />} />
            <Route path="/escrow" element={<EscrowVaultPage />} />
            <Route path="/social" element={<SocialStudioPage />} />
            <Route path="/ai-studio" element={<AIStudioPage />} />
            <Route path="/review-studio" element={<VideoReviewStudioPage />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/profile" element={<Settings key="profile" profilePage />} />
            <Route path="/settings" element={<Settings key="settings" />} />
            <Route path="/revenue" element={<Navigate to="/finance/revenue" replace />} />
            <Route path="/expenses" element={<Navigate to="/finance/expenses" replace />} />
            <Route element={<Protected admin />}>
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/users" element={<Admin />} />
            </Route>
          </Route>
        </Route>
        <Route
          path="*"
          element={
            <div className="flex min-h-screen flex-col items-center justify-center gap-5 p-6">
              <Logo />
              <h1 className="text-3xl font-semibold">A little off the beaten path.</h1>
              <p className="text-sm text-muted">This page doesn’t exist. Let’s get you back.</p>
              <Link className="btn btn-primary" to="/dashboard">
                Back to your workspace
              </Link>
            </div>
          }
        />
      </Routes>
    </Suspense>
  );
}
