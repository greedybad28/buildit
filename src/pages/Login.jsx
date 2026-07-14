import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Code, Eye, EyeOff, User, Lock, Sparkles } from 'lucide-react';

export default function Login() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'member'
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.username, formData.password);
        navigate('/');
      } else {
        await signup(formData.username, formData.password, formData.role);
        navigate('/');
      }
    } catch (err) {
      setFormError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-zinc-950 to-zinc-950 pointer-events-none" />
      
      <div className="glass-panel relative w-full max-w-md rounded-2xl p-8 shadow-2xl">
        {/* Branding header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-650/10 text-indigo-400">
            <Code className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            {isLogin ? 'Welcome Back' : 'Join DevClub'}
          </h1>
          <p className="mt-1.5 text-xs text-zinc-400">
            {isLogin ? 'Sign in to access your dashboard' : 'Create an account to start building projects'}
          </p>
        </div>

        {formError && (
          <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-center text-xs font-semibold text-red-400">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                placeholder="e.g. alexsmith"
                className="w-full rounded-xl bg-zinc-950/60 border border-zinc-800/80 py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-650 focus:border-indigo-500/80 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="••••••••"
                className="w-full rounded-xl bg-zinc-950/60 border border-zinc-800/80 py-2.5 pl-10 pr-10 text-sm text-zinc-200 placeholder-zinc-650 focus:border-indigo-500/80 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Target Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full rounded-xl bg-zinc-950/60 border border-zinc-800/80 py-2.5 px-3 text-sm text-zinc-200 focus:border-indigo-500/80 focus:outline-none"
              >
                <option value="member">Member (default)</option>
                <option value="mentor">Mentor</option>
              </select>
              <p className="mt-1.5 text-[10px] text-zinc-500">
                Note: Access requires approval by an active club Mentor.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-650 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-600 active:scale-[0.98] disabled:bg-indigo-750 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Register Account'}
                {!isLogin && <Sparkles className="h-4 w-4" />}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setFormError('');
            }}
            className="text-xs font-medium text-zinc-400 hover:text-indigo-400 transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
