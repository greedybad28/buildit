import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { stripMarkdown } from '../utils/markdown';
import { 
  FolderGit2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  PlusCircle, 
  ArrowRight,
  ClipboardList,
  Sparkles,
  ExternalLink,
  Flame,
  Award
} from 'lucide-react';

export default function Dashboard() {
  const { user, token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch projects
        const projRes = await fetch('/api/projects', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const projData = await projRes.json();
        setProjects(Array.isArray(projData) ? projData : []);

        // Fetch submissions
        const subUrl = user.role === 'mentor'
          ? '/api/projects/submissions/all'
          : '/api/projects/submissions/mine';
        
        const subRes = await fetch(subUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const subData = await subRes.json();
        setSubmissions(Array.isArray(subData) ? subData : []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [token, user.role]);

  // Helper: days left
  const getDaysLeft = (deadlineStr) => {
    const diff = new Date(deadlineStr) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  // Helper: format date
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  // ==========================================
  // MAINTAINER / REVIEWER VIEW
  // ==========================================
  if (user.role === 'mentor') {
    const activeProjects = projects.filter(p => p.status === 'open');
    const pendingReviews = submissions.filter(s => s.status === 'pending');
    const completedReviews = submissions.filter(s => s.status !== 'pending');

    return (
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 via-indigo-950/20 to-zinc-900 p-8 border border-zinc-800">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-100 md:text-3xl">Club Management Console</h1>
              <p className="mt-2 text-sm text-zinc-400">
                Hello, <span className="font-semibold text-zinc-200">{user.name}</span>. Oversee active project timelines, review incoming project builds, and guide student members.
              </p>
            </div>
            {user.role === 'mentor' && (
              <Link
                to="/projects?create=true"
                className="flex items-center gap-2 rounded-xl bg-indigo-655 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-indigo-600 active:scale-[0.98] self-start md:self-auto"
              >
                <PlusCircle className="h-4.5 w-4.5" />
                Create New Project
              </Link>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass-panel rounded-xl p-5 shadow-sm">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Active Challenges</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-zinc-100">{activeProjects.length}</span>
              <span className="text-xs text-zinc-500">running cycles</span>
            </div>
          </div>
          <div className="glass-panel rounded-xl p-5 shadow-sm">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Pending Reviews</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${pendingReviews.length > 0 ? 'text-amber-400' : 'text-zinc-100'}`}>
                {pendingReviews.length}
              </span>
              <span className="text-xs text-zinc-500">in queue</span>
            </div>
          </div>
          <div className="glass-panel rounded-xl p-5 shadow-sm">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Reviewed Submissions</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-zinc-100">{completedReviews.length}</span>
              <span className="text-xs text-zinc-500">completed</span>
            </div>
          </div>
          <div className="glass-panel rounded-xl p-5 shadow-sm">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Total Members</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-indigo-400">{projects.reduce((acc, p) => acc + (submissions.filter(s => s.projectId === p.id).length), 0)}</span>
              <span className="text-xs text-zinc-500">submissions logged</span>
            </div>
          </div>
        </div>

        {/* Mid section: Active Projects and Queue summary */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Active Projects List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-200">Current Open Challenges</h2>
              <Link to="/projects" className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {activeProjects.length === 0 ? (
              <div className="glass-panel rounded-xl p-8 text-center text-zinc-500">
                No active projects right now. Click "Create New Project" to launch one!
              </div>
            ) : (
              <div className="space-y-4">
                {activeProjects.map(proj => {
                  const subCount = submissions.filter(s => s.projectId === proj.id).length;
                  const days = getDaysLeft(proj.deadline);
                  
                  return (
                    <div key={proj.id} className="glass-panel card-hover flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl p-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-zinc-200">{proj.title}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize border
                            ${proj.difficultyTier === 'advanced' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                              proj.difficultyTier === 'intermediate' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                              'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                            {proj.difficultyTier}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-1">{proj.description}</p>
                        <div className="flex items-center gap-4 text-[11px] text-zinc-500 mt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {days} days left ({formatDate(proj.deadline)})
                          </span>
                          <span className="flex items-center gap-1">
                            <FolderGit2 className="h-3 w-3" /> {subCount} submissions
                          </span>
                        </div>
                      </div>
                      <Link
                        to={`/projects/${proj.id}`}
                        className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 hover:text-white transition-all text-center"
                      >
                        Manage Project
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Review Queue Summary */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-200">Review Queue</h2>
              <Link to="/reviews" className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                Full Queue <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="glass-panel rounded-xl p-4 space-y-3">
              {pendingReviews.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-500">
                  <CheckCircle2 className="h-8 w-8 text-green-400/80 mx-auto mb-2" />
                  All submissions reviewed!
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/80">
                  {pendingReviews.slice(0, 5).map(sub => (
                    <div key={sub.id} className="py-3 first:pt-0 last:pb-0 flex flex-col gap-1">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-zinc-200">{sub.userName}</span>
                        <span className="text-[10px] text-zinc-500">{formatDate(sub.submittedAt)}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate">Project: {sub.projectTitle}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <a 
                          href={sub.submissionLink} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-1 text-[10px] text-indigo-400 hover:underline"
                        >
                          Code Link <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                        <Link 
                          to="/reviews" 
                          className="text-[10px] font-semibold text-zinc-300 hover:text-white"
                        >
                          Review Now
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // LEARNER VIEW
  // ==========================================
  
  // Find current active project. Let's pick the open project with the earliest deadline.
  const openProjects = projects.filter(p => p.status === 'open');
  const activeProject = openProjects.length > 0
    ? openProjects.sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0]
    : null;

  // Find user's submission for active project (if any)
  const activeSubmission = activeProject 
    ? submissions.find(s => s.projectId === activeProject.id)
    : null;

  // Past projects user completed (either reviewed or needs changes)
  const pastSubmissions = submissions.filter(s => !activeProject || s.projectId !== activeProject.id);
  const reviewedSubmissions = submissions.filter(s => s.status === 'reviewed');
  const needsChangesSubmissions = submissions.filter(s => s.status === 'needs changes');

  const getStatusBadge = (status) => {
    switch (status) {
      case 'reviewed':
        return <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-400"><CheckCircle2 className="h-2.5 w-2.5" /> Reviewed</span>;
      case 'needs changes':
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400"><AlertCircle className="h-2.5 w-2.5" /> Needs Changes</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 border border-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-400"><Clock className="h-2.5 w-2.5" /> Pending Review</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 via-indigo-950/20 to-zinc-900 p-8 border border-zinc-800">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100 md:text-3xl flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-indigo-400" /> Member Console
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Welcome, <span className="font-semibold text-zinc-200">{user.name}</span>. Tackle real projects, build repositories, and earn review milestones.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 rounded-xl bg-zinc-950/40 px-4 py-2 border border-zinc-800/80">
              <Flame className="h-4.5 w-4.5 text-amber-500 animate-bounce" />
              <div>
                <span className="block text-[9px] font-bold text-zinc-500 uppercase">Submissions</span>
                <span className="text-sm font-bold text-zinc-200">{submissions.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-zinc-950/40 px-4 py-2 border border-zinc-800/80">
              <Award className="h-4.5 w-4.5 text-green-500" />
              <div>
                <span className="block text-[9px] font-bold text-zinc-500 uppercase">Milestones</span>
                <span className="text-sm font-bold text-zinc-200">{reviewedSubmissions.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Active Project Details Card */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-zinc-200">Active Challenge</h2>
          
          {activeProject ? (
            <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden border-indigo-500/10">
              <div className="absolute top-0 right-0 flex h-1.5 w-full bg-zinc-800">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400"
                  style={{ width: `${Math.max(10, Math.min(100, (getDaysLeft(activeProject.deadline) / 14) * 100))}%` }}
                />
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-xl font-bold text-zinc-100">{activeProject.title}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize border
                      ${activeProject.difficultyTier === 'advanced' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                        activeProject.difficultyTier === 'intermediate' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                        'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                      {activeProject.difficultyTier}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Launched {formatDate(activeProject.createdAt)}</p>
                </div>

                <div className="flex flex-col items-end">
                  <span className="flex items-center gap-1 text-xs font-semibold text-zinc-400">
                    <Clock className="h-3.5 w-3.5 text-zinc-500" />
                    {getDaysLeft(activeProject.deadline)} days left
                  </span>
                  <span className="text-[10px] text-zinc-500">Deadline: {formatDate(activeProject.deadline)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                  {stripMarkdown(activeProject.description)}
                </p>
                <Link
                  to={`/projects/${activeProject.id}`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-305 hover:underline"
                >
                  View Content <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Objectives List */}
              {activeProject.objectives && activeProject.objectives.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Project Objectives</span>
                  <ul className="grid gap-2 text-xs text-zinc-400">
                    {activeProject.objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Status Section */}
              <div className="border-t border-zinc-800/80 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500">Your Status:</span>
                  {activeSubmission ? (
                    getStatusBadge(activeSubmission.status)
                  ) : (
                    <span className="text-xs font-bold text-zinc-400">Not Submitted</span>
                  )}
                </div>

                <Link
                  to={`/projects/${activeProject.id}`}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-bold text-white transition-all active:scale-[0.98]"
                >
                  {activeSubmission ? 'View Submission & Feedback' : 'Start & Submit Project'}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Active submission feedback peek */}
              {activeSubmission && activeSubmission.feedback && (
                <div className="rounded-xl bg-zinc-950/50 border border-zinc-800/85 p-4 space-y-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider">Reviewer Feedback</span>
                  <p className="text-xs text-zinc-300 italic">"{activeSubmission.feedback}"</p>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-12 text-center text-zinc-500 border border-dashed border-zinc-800">
              No active challenge currently. Click below to explore previous projects.
              <div className="mt-4">
                <Link to="/projects" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:underline">
                  Browse Project Gallery <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* History / Milestones Summary */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-zinc-200">Portfolio Gallery</h2>
          
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Submission Log ({pastSubmissions.length})</span>
            
            {pastSubmissions.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-6">Your completed projects will appear here.</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {pastSubmissions.map(sub => {
                  const proj = projects.find(p => p.id === sub.projectId);
                  return (
                    <div key={sub.id} className="rounded-xl bg-zinc-950/40 border border-zinc-850 p-3.5 flex flex-col gap-1.5">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-bold text-zinc-250 truncate">{proj ? proj.title : 'Deleted Project'}</span>
                        {getStatusBadge(sub.status)}
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-zinc-500">
                        <span className="text-[10px] text-zinc-500">Submitted {formatDate(sub.submittedAt)}</span>
                        <Link 
                          to={`/projects/${sub.projectId}`}
                          className="text-indigo-400 hover:underline"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
