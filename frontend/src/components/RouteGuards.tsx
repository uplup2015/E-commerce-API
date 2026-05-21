import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingState } from '@/components/Status';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute() {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <LoadingState label="Restoring session..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  return <Outlet />;
}

export function AdminRoute() {
  const { user, initializing } = useAuth();

  if (initializing) return <LoadingState label="Checking permissions..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/products" replace />;

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { user, initializing } = useAuth();

  if (initializing) return <LoadingState label="Restoring session..." />;
  if (user?.role === 'ADMIN') return <Navigate to="/admin/products" replace />;
  if (user) return <Navigate to="/products" replace />;

  return <Outlet />;
}
