import { ReactNode, useEffect, useState } from "react";
import { subscribeToAuthState, AuthState } from "@/lib/auth";
import { User } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

interface ProtectedRouteProps {
  children: (user: User) => ReactNode;
  adminOnly?: boolean;
  roleRequired?: string[];
}

export default function ProtectedRoute({ children, adminOnly, roleRequired }: ProtectedRouteProps) {
  const [authState, setAuthState] = useState<AuthState>({ user: null, userData: null, loading: true });
  const [, setLocation] = useLocation();

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(setAuthState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!authState.loading && !authState.user) {
      setLocation("/login");
    }
  }, [authState.loading, authState.user, setLocation]);

  if (authState.loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-64" />
            </div>
            <div>
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!authState.user || !authState.userData) {
    return null;
  }

  // Check admin access
  if (adminOnly && !authState.userData.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
          <p className="text-gray-600">Anda tidak memiliki akses ke halaman ini.</p>
        </div>
      </div>
    );
  }

  // Check role access
  if (roleRequired && !roleRequired.includes(authState.userData.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
          <p className="text-gray-600">Role Anda tidak memiliki akses ke halaman ini.</p>
        </div>
      </div>
    );
  }

  return <>{children(authState.userData)}</>;
}
