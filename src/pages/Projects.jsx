import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { stripMarkdown } from '../utils/markdown';
import { 
  FolderGit2, 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  ArrowLeft,
  Search,
  Eye
} from 'lucide-react';

export default function Projects() {
  const { user, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Check if '?create=true' is in URL
  const queryParams = new URLSearchParams(location.search);
  const showCreateFormInitial = queryParams.get('create') === 'true';

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(showCreateFormInitial);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficultyTier: 'beginner',
    deadline: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sync isCreating with URL queries
  useEffect(() => {
    setIsCreating(queryParams.get('create') === 'true');
  }, [location.search]);

  // Fetch Projects list
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [token]);

  // Handle Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    if (!formData.title || !formData.description || !formData.deadline) {
      setFormError('Title, markdown content, and deadline date are required');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          difficultyTier: formData.difficultyTier,
          deadline: formData.deadline,
          description: formData.description,
          objectives: [],
          resources: []
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to create project');
      }

      // Success
      setIsCreating(false);
      navigate('/projects');
      setFormData({
        title: '',
        description: '',
        difficultyTier: 'beginner',
        deadline: '',
      });
      fetchProjects();
    } catch (err) {
      setFormError(err.message || 'An error occurred during project creation');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Project (Mentor only)
  const handleDeleteProject = async (projectId, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm('Are you sure you want to delete this project? All submissions for this project will be deleted.')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setProjects(projects.filter(p => p.id !== projectId));
      } else {
        const err = await response.json();
        alert(err.message || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Delete project error:', error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-450 uppercase">Open</span>;
      case 'reviewing':
        return <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-450 uppercase">Reviewing</span>;
      default:
        return <span className="rounded-full bg-zinc-700/15 border border-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-400 uppercase">Closed</span>;
    }
  };

  // Filter projects
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesTier = tierFilter === 'all' || p.difficultyTier === tierFilter;
    return matchesSearch && matchesStatus && matchesTier;
  });

  const getDaysLeft = (deadlineStr) => {
    const diff = new Date(deadlineStr) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isCreating && user.role === 'mentor') {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setIsCreating(false);
              navigate('/projects');
            }} 
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Create Project Challenge</h1>
            <p className="text-xs text-zinc-500">Design a new project cycle using markdown styling.</p>
          </div>
        </div>

        {formError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-center text-xs font-semibold text-red-400">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 space-y-6 shadow-xl">
          {/* Main Info */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-3">
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Project Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="e.g. Build a Web API with Express & SQLite"
                className="w-full rounded-xl bg-zinc-950/60 border border-zinc-800/80 py-2.5 px-4 text-sm text-zinc-205 focus:border-indigo-500/85 focus:outline-none"
              />
            </div>
            
            <div className="md:col-span-1">
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Difficulty Tier</label>
              <select
                name="difficultyTier"
                value={formData.difficultyTier}
                onChange={handleInputChange}
                className="w-full rounded-xl bg-zinc-950/60 border border-zinc-800/80 py-2.5 px-3 text-sm text-zinc-205 focus:border-indigo-500/85 focus:outline-none"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Deadline Date</label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleInputChange}
                required
                className="w-full rounded-xl bg-zinc-950/60 border border-zinc-800/80 py-2.5 px-4 text-sm text-zinc-205 focus:border-indigo-500/85 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Markdown Contents (Objectives, description, links, etc.)</label>
            </div>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={15}
              placeholder={`# Description
Provide a description of the project challenge.

## Objectives
- [ ] Requirement 1
- [ ] Requirement 2

## Resources
- [Study Link](https://domain.com)
`}
              className="w-full rounded-xl bg-zinc-950/60 border border-zinc-800/80 p-4 text-xs font-mono text-zinc-202 placeholder-zinc-650 focus:border-indigo-500/85 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="border-t border-zinc-800/85 pt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                navigate('/projects');
              }}
              className="rounded-xl border border-zinc-800 bg-transparent px-4.5 py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-bold text-white transition-all active:scale-[0.98]"
            >
              {submitting ? 'Creating...' : 'Publish Project'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-150">Project Gallery</h1>
          <p className="text-xs text-zinc-500 mt-1">Browse active coding cycles and past community projects.</p>
        </div>

        {user.role === 'mentor' && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white transition-all active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" /> Create Project
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-550" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-zinc-950/40 border border-zinc-800/80 py-2 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-550 focus:border-indigo-500/80 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Status */}
          <div className="flex items-center gap-1.5 flex-1 md:flex-initial">
            <span className="text-[10px] text-zinc-500 font-bold uppercase hidden sm:inline">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl bg-zinc-950/40 border border-zinc-800/80 py-1.5 px-3 text-xs text-zinc-350 focus:outline-none focus:border-indigo-500/80 w-full"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="reviewing">Reviewing</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Difficulty */}
          <div className="flex items-center gap-1.5 flex-1 md:flex-initial">
            <span className="text-[10px] text-zinc-500 font-bold uppercase hidden sm:inline">Difficulty</span>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="rounded-xl bg-zinc-950/40 border border-zinc-800/80 py-1.5 px-3 text-xs text-zinc-355 focus:outline-none focus:border-indigo-500/80 w-full"
            >
              <option value="all">All Tiers</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="glass-panel rounded-2xl p-16 text-center text-zinc-500">
          No projects match your current filters.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map(proj => {
            const daysLeft = getDaysLeft(proj.deadline);
            return (
              <Link 
                key={proj.id}
                to={`/projects/${proj.id}`}
                className="glass-panel card-hover flex flex-col justify-between rounded-2xl p-5 shadow-sm relative overflow-hidden"
              >
                {/* Visual card header top-bar indicator */}
                <div className={`absolute top-0 left-0 right-0 h-1 
                  ${proj.status === 'open' ? 'bg-blue-500' : 
                    proj.status === 'reviewing' ? 'bg-amber-500' : 
                    'bg-zinc-650'}`} 
                />

                <div className="space-y-4">
                  {/* Status & Tier */}
                  <div className="flex justify-between items-center">
                    {getStatusBadge(proj.status)}
                    
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase border
                      ${proj.difficultyTier === 'advanced' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                        proj.difficultyTier === 'intermediate' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                        'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                      {proj.difficultyTier}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-zinc-150 line-clamp-1">{proj.title}</h3>
                    <p className="text-xs text-zinc-450 mt-1.5 line-clamp-3 leading-relaxed">{stripMarkdown(proj.description)}</p>
                  </div>
                </div>

                {/* Card Footer info */}
                <div className="border-t border-zinc-800/80 pt-4 mt-5 flex justify-between items-center text-[10px] text-zinc-550">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Due {formatDate(proj.deadline)}
                  </span>
                  
                  {proj.status === 'open' ? (
                    <span className="flex items-center gap-1 text-blue-400 font-semibold">
                      <Clock className="h-3 w-3" />
                      {daysLeft} days left
                    </span>
                  ) : (
                    <span className="font-medium capitalize">
                      {proj.status}
                    </span>
                  )}

                  {user.role === 'mentor' && (
                    <button
                      onClick={(e) => handleDeleteProject(proj.id, e)}
                      className="p-1 text-zinc-550 hover:text-red-400 rounded transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
