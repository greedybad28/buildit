import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FolderGit2, 
  ClipboardCheck, 
  Users, 
  UserCircle, 
  PlusCircle, 
  LogOut,
  Menu,
  X,
  Code
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const links = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Projects', to: '/projects', icon: FolderGit2 },
    // Only Mentors see Review Queue
    ...(user.role === 'mentor'
      ? [{ name: 'Review Queue', to: '/reviews', icon: ClipboardCheck }] 
      : []),
    { name: 'Members', to: '/members', icon: Users },
    { name: 'Profile', to: '/profile', icon: UserCircle },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'mentor':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-800';
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-3 md:hidden">
        <Link to="/" className="flex items-center gap-2 font-bold text-zinc-100">
          <Code className="h-5 w-5 text-indigo-400" />
          <span>DevClub</span>
        </Link>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="text-zinc-400 hover:text-zinc-200 focus:outline-none"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside className={`
        fixed bottom-0 top-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-800 bg-zinc-900/90 transition-transform duration-300 md:static md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo/Branding */}
        <div className="flex h-16 items-center gap-3 border-b border-zinc-850 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
            <Code className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-zinc-100">DevClub Portal</span>
            <p className="text-[10px] text-zinc-500">Project-Based Learning</p>
          </div>
        </div>

        {/* User Block */}
        <div className="border-b border-zinc-850 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-zinc-950/40 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 font-bold text-zinc-200">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-zinc-200">{user.name}</p>
              <div className="mt-0.5 flex">
                <span className={`rounded border px-1.5 py-0.5 text-[9px] font-medium capitalize ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 px-4 py-4">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-200
                  ${isActive 
                    ? 'bg-indigo-500/10 text-indigo-400' 
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {link.name}
              </NavLink>
            );
          })}

          {/* Quick Create Project Button (Mentor only) */}
          {user.role === 'mentor' && (
            <Link
              to="/projects?create=true"
              onClick={() => setIsOpen(false)}
              className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-indigo-500 active:scale-[0.98]"
            >
              <PlusCircle className="h-4 w-4" />
              Create Project
            </Link>
          )}
        </nav>

        {/* Footer / Logout */}
        <div className="border-t border-zinc-850 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-500 transition-colors hover:bg-zinc-800/40 hover:text-zinc-300"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
