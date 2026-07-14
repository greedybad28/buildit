import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  UserCircle, 
  Mail, 
  ShieldCheck, 
  Calendar, 
  FolderGit2, 
  CheckCircle, 
  AlertCircle,
  Clock, 
  Award,
  Crown,
  ExternalLink
} from 'lucide-react';

export default function Profile() {
  const { user, token } = useAuth();
  
  const [submissions, setSubmissions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch all projects to map submission details
        const projRes = await fetch('/api/projects', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const projData = await projRes.json();
        setProjects(Array.isArray(projData) ? projData : []);

        // Fetch user's submissions
        const subRes = await fetch('/api/projects/submissions/mine', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const subData = await subRes.json();
        setSubmissions(Array.isArray(subData) ? subData : []);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [token]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'reviewed':
        return <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-400"><CheckCircle className="h-2.5 w-2.5" /> Reviewed</span>;
      case 'needs changes':
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400"><AlertCircle className="h-2.5 w-2.5" /> Needs Changes</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-zinc-700/15 border border-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-400"><Clock className="h-2.5 w-2.5" /> Pending Review</span>;
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Badge Logic
  const reviewedCount = submissions.filter(s => s.status === 'reviewed').length;
  const earnedBadges = [];

  if (user.role === 'mentor') {
    earnedBadges.push({
      title: 'Club Captain',
      desc: 'Mentor status. Coordinates tasks and reviews builds.',
      icon: Crown,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
    });
  }

  if (submissions.length >= 1) {
    earnedBadges.push({
      title: 'First Commit',
      desc: 'Attempted and submitted your first coding project.',
      icon: FolderGit2,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    });
  }

  if (reviewedCount >= 1) {
    earnedBadges.push({
      title: 'Bronze Builder',
      desc: 'Earned 1 fully approved project milestone.',
      icon: Award,
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20'
    });
  }

  if (reviewedCount >= 3) {
    earnedBadges.push({
      title: 'Silver Craftsman',
      desc: 'Earned 3 approved project milestones.',
      icon: Award,
      color: 'text-zinc-300 bg-zinc-300/10 border-zinc-300/20'
    });
  }

  if (reviewedCount >= 5) {
    earnedBadges.push({
      title: 'Gold Architect',
      desc: 'Earned 5+ approved project milestones.',
      icon: Award,
      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-550/20'
    });
  }

  return (
    <div className="space-y-8">
      {/* Profile info banner */}
      <div className="glass-panel rounded-2xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-indigo-950/5 to-zinc-950 pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 border-2 border-zinc-700 font-bold text-2xl text-zinc-200 shadow-inner">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-100">{user.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-zinc-400">
              <span className="flex items-center gap-1"><UserCircle className="h-3.5 w-3.5 text-zinc-550" /> @{user.username}</span>
              <span className="h-1 w-1 rounded-full bg-zinc-700" />
              <span className="flex items-center gap-1 capitalize font-semibold text-indigo-400">{user.role}</span>
              <span className="h-1 w-1 rounded-full bg-zinc-700" />
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-zinc-550" /> Joined {formatDate(user.joinedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Badges */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-zinc-200">Earned Badges</h2>
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            {earnedBadges.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-550">
                Submit project solutions and earn review approvals to unlock badges!
              </div>
            ) : (
              <div className="space-y-3.5">
                {earnedBadges.map((badge, i) => {
                  const Icon = badge.icon;
                  return (
                    <div key={i} className={`flex items-start gap-3 rounded-xl border p-3.5 ${badge.color}`}>
                      <div className="mt-0.5 shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-zinc-200">{badge.title}</span>
                        <p className="mt-1 text-[10px] text-zinc-450 leading-relaxed">{badge.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Submission logs */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-zinc-200">Submission History</h2>
          
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center text-zinc-500">
              No submissions logged. Go to the projects page to find open challenges!
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {submissions.map(sub => {
                const proj = projects.find(p => p.id === sub.projectId);
                return (
                  <div key={sub.id} className="glass-panel rounded-xl p-5 border border-zinc-850 flex flex-col justify-between gap-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-zinc-200">{proj ? proj.title : 'Deleted Project'}</h3>
                        <span className="block text-[10px] text-zinc-550 mt-1">Submitted {formatDate(sub.submittedAt)}</span>
                      </div>
                      {getStatusBadge(sub.status)}
                    </div>

                    <div className="space-y-2">
                      <span className="block text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Submission Link</span>
                      <a
                        href={sub.submissionLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
                      >
                        {sub.submissionLink} <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    {sub.feedback && (
                      <div className="rounded-lg bg-zinc-950/45 border border-zinc-850 p-3 space-y-1">
                        <span className="block text-[9px] font-bold text-zinc-450 uppercase tracking-wider">Reviewer Feedback</span>
                        <p className="text-xs text-zinc-300 italic">"{sub.feedback}"</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
