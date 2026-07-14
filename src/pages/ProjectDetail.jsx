import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { parseMarkdown } from '../utils/markdown';
import { 
  Clock, 
  Calendar, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle,
  Edit3, 
  X,
  Send,
  Users,
  AlertTriangle
} from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [members, setMembers] = useState([]); // Used by mentors to see who submitted
  const [loading, setLoading] = useState(true);

  // Member submission state
  const [mySubmission, setMySubmission] = useState(null);
  const [submissionLink, setSubmissionLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Mentor edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    difficultyTier: '',
    deadline: '',
    status: ''
  });
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const fetchProjectData = async () => {
    try {
      // 1. Fetch Project Details
      const projRes = await fetch(`/api/projects/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!projRes.ok) throw new Error('Project not found');
      const projData = await projRes.json();
      setProject(projData);

      if (projData) {
        setEditForm({
          title: projData.title,
          description: projData.description,
          difficultyTier: projData.difficultyTier,
          deadline: projData.deadline,
          status: projData.status
        });
      }

      // 2. Conditional fetches based on roles
      if (user.role === 'mentor') {
        // Fetch all submissions for this project
        const subRes = await fetch(`/api/projects/${id}/submissions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const subData = await subRes.json();
        setSubmissions(Array.isArray(subData) ? subData : []);

        // Fetch all users list
        const userRes = await fetch('/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const userData = await userRes.json();
        setMembers(Array.isArray(userData) ? userData : []);
      } else {
        // If Member, fetch my submissions and filter
        const mineRes = await fetch('/api/projects/submissions/mine', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const mineData = await mineRes.json();
        if (Array.isArray(mineData)) {
          const match = mineData.find(s => s.projectId === id);
          setMySubmission(match || null);
          if (match) {
            setSubmissionLink(match.submissionLink);
          }
        }
      }
    } catch (err) {
      console.error(err);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id, token, user.role]);

  // Handle Submit Project (Member)
  const handleSubmissionSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess(false);
    setSubmitting(true);

    if (!submissionLink.trim()) {
      setSubmitError('Please enter a valid link');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/projects/${id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ submissionLink })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Submission failed');
      }

      setSubmitSuccess(true);
      setMySubmission(data);
      fetchProjectData();
    } catch (err) {
      setSubmitError(err.message || 'An error occurred during submission');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Project handlers (Mentor only)
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...editForm,
          objectives: [],
          resources: []
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Update failed');

      setProject(data);
      setIsEditing(false);
      setEditSuccess('Project updated successfully');
      setTimeout(() => setEditSuccess(''), 3000);
      fetchProjectData();
    } catch (err) {
      setEditError(err.message || 'An error occurred during project update');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-400 uppercase">Open</span>;
      case 'reviewing':
        return <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-400 uppercase">Reviewing</span>;
      default:
        return <span className="rounded-full bg-zinc-700/15 border border-zinc-800 px-2.5 py-0.5 text-xs font-bold text-zinc-400 uppercase">Closed</span>;
    }
  };

  const getSubBadge = (status) => {
    switch (status) {
      case 'reviewed':
        return <span className="rounded-full bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-400 capitalize">Reviewed</span>;
      case 'needs changes':
        return <span className="rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400 capitalize">Needs Changes</span>;
      default:
        return <span className="rounded-full bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-[10px] font-bold text-zinc-400 capitalize">Pending</span>;
    }
  };

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

  if (!project) return null;

  // Split members for mentors view: Submitted vs Not Submitted (only filter member roles)
  const learners = members.filter(m => m.role === 'member');
  const submittedUsers = submissions.map(s => s.userId);
  const notSubmittedLearners = learners.filter(l => !submittedUsers.includes(l.id));

  return (
    <div className="space-y-8">
      {/* Back link */}
      <div>
        <Link to="/projects" className="text-xs font-semibold text-zinc-400 hover:text-indigo-400 transition-colors flex items-center gap-1">
          <X className="h-3.5 w-3.5" /> Back to Project Gallery
        </Link>
      </div>

      {editSuccess && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-center text-xs font-semibold text-green-400">
          {editSuccess}
        </div>
      )}

      {/* Main Grid: Details or Editing Form */}
      {isEditing ? (
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-zinc-100">Edit Project</h1>
            <button 
              onClick={() => setIsEditing(false)} 
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
          </div>

          {editError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-center text-xs font-semibold text-red-400">
              {editError}
            </div>
          )}

          <form onSubmit={handleEditSubmit} className="glass-panel rounded-2xl p-6 space-y-6 shadow-xl">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Project Title</label>
                <input
                  type="text"
                  name="title"
                  value={editForm.title}
                  onChange={handleEditInputChange}
                  required
                  className="w-full rounded-xl bg-zinc-950/60 border border-zinc-800/80 py-2.5 px-4 text-sm text-zinc-205 focus:border-indigo-500/85 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Difficulty Tier</label>
                <select
                  name="difficultyTier"
                  value={editForm.difficultyTier}
                  onChange={handleEditInputChange}
                  className="w-full rounded-xl bg-zinc-950/60 border border-zinc-800/80 py-2.5 px-3 text-sm text-zinc-205 focus:border-indigo-500/85 focus:outline-none"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Deadline Date</label>
                <input
                  type="date"
                  name="deadline"
                  value={editForm.deadline}
                  onChange={handleEditInputChange}
                  required
                  className="w-full rounded-xl bg-zinc-950/60 border border-zinc-800/80 py-2.5 px-4 text-sm text-zinc-205 focus:border-indigo-500/85 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Project Status</label>
                <select
                  name="status"
                  value={editForm.status}
                  onChange={handleEditInputChange}
                  className="w-full rounded-xl bg-zinc-950/60 border border-zinc-800/80 py-2.5 px-3 text-sm text-zinc-205 focus:border-indigo-500/85 focus:outline-none font-semibold"
                >
                  <option value="open">Open (Accepting Submissions)</option>
                  <option value="reviewing">Reviewing (Reviewing Submissions)</option>
                  <option value="closed">Closed (Locked)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Markdown Content (Objectives, description, links, etc.)</label>
              <textarea
                name="description"
                value={editForm.description}
                onChange={handleEditInputChange}
                required
                rows={15}
                className="w-full rounded-xl bg-zinc-950/60 border border-zinc-800/80 p-4 text-xs font-mono text-zinc-205 focus:border-indigo-500/85 focus:outline-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-xl border border-zinc-800 bg-transparent px-4.5 py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-850"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-indigo-650 hover:bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left panel - Project Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-zinc-800">
                <div 
                  className={`h-full bg-gradient-to-r ${project.status === 'open' ? 'from-blue-500 to-blue-450' : project.status === 'reviewing' ? 'from-amber-500 to-amber-450' : 'from-zinc-600 to-zinc-650'}`}
                  style={{ width: '105%' }}
                />
              </div>

              {/* Title Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pt-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-100">{project.title}</h1>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize border
                      ${project.difficultyTier === 'advanced' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                        project.difficultyTier === 'intermediate' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                        'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                      {project.difficultyTier}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Published {formatDate(project.createdAt)}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Due {formatDate(project.deadline)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(project.status)}

                  {user.role === 'mentor' && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-850 bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-850 transition-all"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </button>
                  )}
                </div>
              </div>

              {/* Parsed Markdown Description Area */}
              <div className="border-t border-zinc-800/80 pt-6">
                <div 
                  className="text-xs text-zinc-300 space-y-4 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(project.description) }}
                />
              </div>
            </div>

            {/* Mentor View: Members Submissions Tracker lists */}
            {user.role === 'mentor' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-zinc-250 flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-400" /> Member Submission Logs
                </h2>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Submitted List */}
                  <div className="glass-panel rounded-2xl p-5 space-y-4 shadow-sm border border-green-500/5">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                      <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Submitted ({submissions.length})</span>
                    </div>

                    {submissions.length === 0 ? (
                      <p className="text-xs text-zinc-550 py-4 text-center">No submissions yet.</p>
                    ) : (
                      <div className="space-y-3 divide-y divide-zinc-850/60 max-h-[300px] overflow-y-auto pr-1">
                        {submissions.map((sub, idx) => (
                          <div key={sub.id} className={`flex flex-col gap-1.5 ${idx > 0 ? 'pt-3' : ''}`}>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-zinc-200">{sub.userName}</span>
                              {getSubBadge(sub.status)}
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                              <a 
                                href={sub.submissionLink} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-indigo-400 hover:underline inline-flex items-center gap-0.5"
                              >
                                Code Repository <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                              <span className="text-zinc-500">Sent {formatDate(sub.submittedAt)}</span>
                            </div>
                            {sub.feedback && (
                              <p className="text-[10px] text-zinc-400 italic bg-zinc-950/40 rounded p-1.5 border border-zinc-850">"{sub.feedback}"</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Not Submitted List */}
                  <div className="glass-panel rounded-2xl p-5 space-y-4 shadow-sm border border-red-500/5">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                      <span className="text-xs font-bold text-red-400 uppercase tracking-wider">No Submission Yet ({notSubmittedLearners.length})</span>
                    </div>

                    {notSubmittedLearners.length === 0 ? (
                      <p className="text-xs text-zinc-550 py-4 text-center">All members have submitted!</p>
                    ) : (
                      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                        {notSubmittedLearners.map(learner => (
                          <div key={learner.id} className="flex items-center justify-between rounded-xl bg-zinc-950/20 border border-zinc-850 p-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400">
                                {learner.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <span className="block text-xs font-semibold text-zinc-350 truncate">{learner.name}</span>
                                <span className="block text-[9px] text-zinc-500 truncate">@{learner.username}</span>
                              </div>
                            </div>
                            <span className="text-[9px] font-semibold text-zinc-550">Pending</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right panel - Member submission dashboard control panel */}
          {user.role === 'member' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-zinc-200">Your Submission</h2>

              <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-6">
                {mySubmission ? (
                  // Submitted layout
                  <div className="space-y-5">
                    <div className="rounded-xl bg-zinc-950/40 border border-zinc-800/80 p-4 text-center">
                      <span className="block text-[10px] text-zinc-550 uppercase tracking-wider mb-2">Review Status</span>
                      <div className="flex justify-center">{getSubBadge(mySubmission.status)}</div>
                      <span className="block text-[10px] text-zinc-500 mt-2">Submitted: {formatDate(mySubmission.submittedAt)}</span>
                    </div>

                    <div className="space-y-2">
                      <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">Submitted Link</span>
                      <a
                        href={mySubmission.submissionLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-2 rounded-xl bg-zinc-950 border border-zinc-850 px-4 py-2.5 text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
                      >
                        <span className="truncate">{mySubmission.submissionLink}</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      </a>
                    </div>

                    {mySubmission.feedback ? (
                      <div className="space-y-2">
                        <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">Reviewer Feedback</span>
                        <div className="rounded-xl bg-zinc-950/70 border border-zinc-800/90 p-4">
                          <p className="text-xs text-zinc-300 leading-relaxed italic">"{mySubmission.feedback}"</p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-indigo-500/5 border border-indigo-550/10 p-4 text-center flex flex-col items-center">
                        <Clock className="h-5 w-5 text-indigo-400 mb-1" />
                        <span className="text-[11px] text-zinc-350">Submission logged. A reviewer will evaluate your link shortly.</span>
                      </div>
                    )}

                    {project.status === 'open' && (
                      <div className="border-t border-zinc-850 pt-4 text-center">
                        <p className="text-[10px] text-zinc-500 mb-3">Made a mistake? Re-submit your updated link below.</p>
                        <button
                          onClick={() => setMySubmission(null)}
                          className="text-[10px] font-bold text-indigo-400 hover:underline"
                        >
                          Update Submission Link
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  // Submit Form layout
                  <div className="space-y-4">
                    {project.status === 'open' ? (
                      <>
                        <div className="space-y-1.5">
                          <p className="text-xs text-zinc-400">
                            Deliver your completed project by submitting a link to your repository or live deployment:
                          </p>
                        </div>

                        {submitError && (
                          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-center text-xs text-red-400 font-semibold">
                            {submitError}
                          </div>
                        )}

                        <form onSubmit={handleSubmissionSubmit} className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-550 uppercase tracking-wider mb-2">Repository / Project URL</label>
                            <input
                              type="url"
                              value={submissionLink}
                              onChange={(e) => setSubmissionLink(e.target.value)}
                              required
                              placeholder="https://github.com/username/project"
                              className="w-full rounded-xl bg-zinc-950/60 border border-zinc-800/80 py-2.5 px-3.5 text-xs text-zinc-205 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={submitting}
                            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-650 hover:bg-indigo-600 py-3 text-xs font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
                          >
                            <Send className="h-3.5 w-3.5" />
                            {submitting ? 'Submitting...' : 'Send Submission'}
                          </button>
                        </form>
                      </>
                    ) : (
                      // Project not open
                      <div className="text-center py-6 space-y-3">
                        <AlertTriangle className="h-8 w-8 text-zinc-500 mx-auto" />
                        <h3 className="text-sm font-bold text-zinc-300">Submissions Locked</h3>
                        <p className="text-xs text-zinc-500">
                          This project is currently <span className="font-semibold">{project.status}</span> and is not accepting submissions.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
