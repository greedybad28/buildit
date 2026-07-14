import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  Check, 
  X, 
  UserPlus, 
  UserMinus, 
  Crown,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function Members() {
  const { token, user } = useAuth();
  
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching members list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [token]);

  const handleRoleChange = async (targetId, newRole) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const response = await fetch(`/api/users/${targetId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update role');

      setSuccessMsg('User role updated successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchMembers();
    } catch (err) {
      setErrorMsg(err.message || 'Error updating role');
      setTimeout(() => setErrorMsg(''), 4505);
    }
  };

  const handleStatusChange = async (targetId, newStatus) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const response = await fetch(`/api/users/${targetId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update status');

      setSuccessMsg(`User registration ${newStatus} successfully`);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchMembers();
    } catch (err) {
      setErrorMsg(err.message || 'Error updating status');
      setTimeout(() => setErrorMsg(''), 4505);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'mentor':
        return <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-400"><Crown className="h-2.5 w-2.5" /> Mentor</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-zinc-700/10 border border-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-400">Member</span>;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'rejected':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      default:
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Filter members
  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = members.filter(m => m.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-150 flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-400" /> Club Roster
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Directory of all mentors and club members.</p>
        </div>

        {user.role === 'mentor' && pendingCount > 0 && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2 flex items-center gap-2 text-xs font-semibold text-amber-400">
            <AlertCircle className="h-4 w-4" />
            <span>{pendingCount} registration request(s) pending approval</span>
          </div>
        )}
      </div>

      {successMsg && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-center text-xs font-semibold text-green-400">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-center text-xs font-semibold text-red-400">
          {errorMsg}
        </div>
      )}

      {/* Search Filter */}
      <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-550" />
          <input
            type="text"
            placeholder="Search roster by name or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-zinc-950/40 border border-zinc-800/80 py-2.5 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-550 focus:border-indigo-500/85 focus:outline-none"
          />
        </div>
      </div>

      {/* Roster Listing */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="glass-panel rounded-2xl p-16 text-center text-zinc-500">
          No members found.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map(member => (
            <div 
              key={member.id} 
              className={`glass-panel rounded-2xl p-5 border flex flex-col justify-between gap-5 transition-all
                ${member.status === 'pending' ? 'border-amber-500/20 shadow-sm shadow-amber-950/5' : 'border-zinc-800/80 hover:border-zinc-700/80'}`}
            >
              {/* Member details card info */}
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 font-bold text-zinc-250">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="block text-sm font-bold text-zinc-200 truncate">{member.name}</span>
                      <span className="block text-[10px] text-zinc-550 truncate mt-0.5">@{member.username}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {getRoleBadge(member.role)}
                    <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold capitalize ${getStatusColor(member.status)}`}>
                      {member.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Joined {formatDate(member.joinedAt)}</span>
                </div>
              </div>

              {/* Mentor Actions panel */}
              {user.role === 'mentor' && member.id !== user.id && (
                <div className="border-t border-zinc-850 pt-4 space-y-3.5">
                  {member.status === 'pending' ? (
                    /* Approval actions */
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusChange(member.id, 'approved')}
                        className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 py-2 text-[10px] font-bold text-green-400 transition-all active:scale-[0.98]"
                      >
                        <Check className="h-3 w-3" /> Approve Registration
                      </button>
                      <button
                        onClick={() => handleStatusChange(member.id, 'rejected')}
                        className="flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 p-2 text-red-405 transition-all active:scale-[0.98]"
                        title="Decline Registration"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : member.status === 'rejected' ? (
                    /* Re-approve actions */
                    <button
                      onClick={() => handleStatusChange(member.id, 'approved')}
                      className="w-full flex items-center justify-center gap-1 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 py-2 text-[10px] font-bold text-zinc-300 transition-all"
                    >
                      <UserPlus className="h-3 w-3" /> Restore & Approve User
                    </button>
                  ) : (
                    /* Role promotion/demotion menu */
                    <div className="flex flex-col gap-1.5">
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Manage Roster Role</label>
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className="w-full rounded-xl bg-zinc-950/60 border border-zinc-850 py-1.5 px-3 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="member">Member</option>
                        <option value="mentor">Mentor</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
