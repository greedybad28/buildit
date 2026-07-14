import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ClipboardCheck, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  User,
  Sparkles
} from 'lucide-react';

export default function ReviewQueue() {
  const { token, user } = useAuth();

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending'); // default to pending to focus on work

  // Review form state (tied to active expanded submission)
  const [reviewForm, setReviewForm] = useState({
    status: 'reviewed', // default to reviewed
    feedback: ''
  });
  const [submittingId, setSubmittingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/projects/submissions/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching submissions for review:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [token]);

  const toggleExpand = (sub) => {
    if (expandedId === sub.id) {
      setExpandedId(null);
    } else {
      setExpandedId(sub.id);
      // Initialize form with existing values if already reviewed
      setReviewForm({
        status: sub.status === 'pending' ? 'reviewed' : sub.status,
        feedback: sub.feedback || ''
      });
    }
  };

  const handleReviewSubmit = async (subId, e) => {
    e.preventDefault();
    setSubmittingId(subId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch(`/api/projects/submissions/${subId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: reviewForm.status,
          feedback: reviewForm.feedback
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to submit review');
      }

      setSuccessMsg('Review recorded successfully');
      setExpandedId(null);
      // Refresh list
      fetchSubmissions();
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred');
    } finally {
      setSubmittingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'reviewed':
        return <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 text-xs font-bold text-green-400"><CheckCircle className="h-3 w-3" /> Reviewed</span>;
      case 'needs changes':
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-xs font-bold text-red-400"><AlertCircle className="h-3 w-3" /> Needs Changes</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-zinc-700/15 border border-zinc-800 px-2.5 py-0.5 text-xs font-bold text-zinc-400"><Clock className="h-3 w-3" /> Pending</span>;
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Filter queue
  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = sub.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          sub.projectTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-150 flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6 text-indigo-400" /> Review Queue
        </h1>
        <p className="text-xs text-zinc-500 mt-1">Audit student submissions, evaluate code links, and submit feedback.</p>
      </div>

      {successMsg && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-center text-xs font-semibold text-green-400">
          {successMsg}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-550" />
          <input
            type="text"
            placeholder="Search by learner name or project title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-zinc-950/40 border border-zinc-800/80 py-2 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-550 focus:border-indigo-500/80 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 flex-1 md:flex-initial">
            <span className="text-[10px] text-zinc-500 font-bold uppercase hidden sm:inline">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl bg-zinc-950/40 border border-zinc-800/80 py-1.5 px-3 text-xs text-zinc-355 focus:outline-none focus:border-indigo-500/80 w-full"
            >
              <option value="all">All Submissions</option>
              <option value="pending">Pending Review</option>
              <option value="reviewed">Reviewed</option>
              <option value="needs changes">Needs Changes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submission List */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="glass-panel rounded-2xl p-16 text-center text-zinc-500">
          No submissions found in this status queue.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map(sub => {
            const isExpanded = expandedId === sub.id;
            return (
              <div 
                key={sub.id} 
                className={`glass-panel rounded-2xl overflow-hidden border transition-all duration-300
                  ${isExpanded ? 'border-indigo-500/30 shadow-lg shadow-indigo-950/5' : 'hover:border-zinc-800'}`}
              >
                {/* Header card trigger */}
                <div 
                  onClick={() => toggleExpand(sub)}
                  className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-sm font-bold text-zinc-200">{sub.userName}</span>
                      <span className="text-[10px] text-zinc-550 font-medium">(@{sub.username})</span>
                      {getStatusBadge(sub.status)}
                    </div>
                    <p className="text-xs text-zinc-400 truncate">
                      Challenge: <span className="font-semibold text-zinc-300">{sub.projectTitle}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-[10px] text-zinc-500 hidden sm:inline">
                      Submitted {formatDate(sub.submittedAt)}
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-zinc-555" /> : <ChevronDown className="h-4 w-4 text-zinc-555" />}
                  </div>
                </div>

                {/* Expanded Details / Form */}
                {isExpanded && (
                  <div className="border-t border-zinc-850 bg-zinc-950/40 p-5 space-y-5">
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Left: Metadata */}
                      <div className="space-y-3.5">
                        <div className="space-y-1">
                          <span className="block text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Submission URL Link</span>
                          <a 
                            href={sub.submissionLink} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 hover:underline bg-zinc-900 border border-zinc-850 px-3.5 py-2 rounded-xl w-full"
                          >
                            <span className="truncate">{sub.submissionLink}</span>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          </a>
                        </div>
                        
                        <div className="flex gap-4 text-xs text-zinc-500">
                          <div>
                            <span className="block text-[10px] text-zinc-600 uppercase tracking-wider">Date Submitted</span>
                            <span className="font-medium text-zinc-400">{formatDate(sub.submittedAt)}</span>
                          </div>
                          {sub.reviewedBy && (
                            <div>
                              <span className="block text-[10px] text-zinc-600 uppercase tracking-wider">Audited By</span>
                              <span className="font-medium text-zinc-400 capitalize">{sub.reviewerName || 'Another Mentor'}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Review Form */}
                      <div>
                        <span className="block text-[10px] text-zinc-555 uppercase tracking-wider font-bold mb-2.5">
                          {sub.status === 'pending' ? 'Review & Submit Feedback' : 'Adjust / Edit Review Details'}
                        </span>
                        
                        {errorMsg && (
                          <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-center text-xs font-semibold text-red-400">
                            {errorMsg}
                          </div>
                        )}

                        <form onSubmit={(e) => handleReviewSubmit(sub.id, e)} className="space-y-3">
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => setReviewForm(prev => ({ ...prev, status: 'reviewed' }))}
                              className={`flex-1 rounded-xl py-2 px-3 text-xs font-bold border transition-all flex items-center justify-center gap-1.5
                                ${reviewForm.status === 'reviewed' 
                                  ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                            >
                              <CheckCircle className="h-3.5 w-3.5" /> Approved
                            </button>
                            <button
                              type="button"
                              onClick={() => setReviewForm(prev => ({ ...prev, status: 'needs changes' }))}
                              className={`flex-1 rounded-xl py-2 px-3 text-xs font-bold border transition-all flex items-center justify-center gap-1.5
                                ${reviewForm.status === 'needs changes' 
                                  ? 'bg-red-500/10 text-red-400 border-red-500/30' 
                                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                            >
                              <AlertCircle className="h-3.5 w-3.5" /> Needs Changes
                            </button>
                          </div>

                          <div className="space-y-1">
                            <textarea
                              rows={3}
                              value={reviewForm.feedback}
                              onChange={(e) => setReviewForm(prev => ({ ...prev, feedback: e.target.value }))}
                              placeholder="Write helpful technical feedback. Highlight good patterns or explain what needs adjustment."
                              className="w-full rounded-xl bg-zinc-950/60 border border-zinc-800/80 py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div className="flex justify-end">
                            <button
                              type="submit"
                              disabled={submittingId === sub.id}
                              className="rounded-xl bg-indigo-650 hover:bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                              {submittingId === sub.id ? 'Saving...' : 'Submit Evaluation'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
