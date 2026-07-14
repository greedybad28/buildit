import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, RefreshCw, LogOut, Clock } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, refreshUser, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-zinc-400">Loading student club console...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Handle Pending status
  if (user.status === 'pending') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <div className="glass-panel w-full max-w-md rounded-2xl p-8 text-center shadow-2xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
            <Clock className="h-8 w-8 animate-pulse" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-zinc-100">Approval Pending</h2>
          <p className="mb-6 text-sm text-zinc-400">
            Welcome, <span className="font-semibold text-zinc-200">{user.name}</span>! Your account has been registered. 
            A club Mentor must approve your membership before you can access projects and challenges.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => refreshUser()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 px-4 py-3 text-sm font-semibold text-zinc-200 transition-all hover:bg-zinc-700 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" /> Check Status Again
            </button>
            <button
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900/40 border border-zinc-800/80 px-4 py-3 text-sm font-semibold text-zinc-400 transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle Rejected status
  if (user.status === 'rejected') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <div className="glass-panel w-full max-w-md rounded-2xl p-8 text-center shadow-2xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-zinc-100">Application Declined</h2>
          <p className="mb-6 text-sm text-zinc-400">
            Unfortunately, your request to join the club has been declined by the maintainers. If you believe this is a mistake, contact a club coordinator.
          </p>
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 px-4 py-3 text-sm font-semibold text-zinc-200 transition-all hover:bg-zinc-700 hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Go back to Login
          </button>
        </div>
      </div>
    );
  }

  // Check Role permissions
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <div className="glass-panel w-full max-w-md rounded-2xl p-8 text-center shadow-2xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-zinc-100">Access Denied</h2>
          <p className="mb-6 text-sm text-zinc-400">
            You do not have the required permissions (`{allowedRoles.join(', ')}`) to view this page. Current role: <span className="font-semibold capitalize text-indigo-400">{user.role}</span>.
          </p>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  return children;
}
