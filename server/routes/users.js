import express from 'express';
import { users } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all users (accessible by all approved users for the Members Page directory)
router.get('/', authenticateToken, requireRole(['member', 'mentor']), async (req, res) => {
  try {
    const list = await users.getAll();
    // Exclude password hash from the list
    const safeList = list.map(u => {
      const { password, ...safeUser } = u;
      return safeUser;
    });
    res.json(safeList);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ message: 'Error fetching users list' });
  }
});

// Update user role (Mentor only)
router.put('/:id/role', authenticateToken, requireRole(['mentor']), async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !['member', 'mentor'].includes(role)) {
      return res.status(400).json({ message: 'Valid role (member or mentor) is required' });
    }

    // A mentor cannot demote themselves to ensure there's always at least one mentor
    if (req.params.id === req.user.id && role !== 'mentor') {
      return res.status(400).json({ message: 'You cannot change your own role to prevent lockout' });
    }

    const updated = await users.update(req.params.id, { role });
    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password, ...safeUser } = updated;
    res.json({ message: 'User role updated successfully', user: safeUser });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Error updating user role' });
  }
});

// Approve or Reject signup (Mentor only)
router.put('/:id/status', authenticateToken, requireRole(['mentor']), async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Valid status (approved, rejected, or pending) is required' });
    }

    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot modify your own status' });
    }

    const updated = await users.update(req.params.id, { status });
    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password, ...safeUser } = updated;
    res.json({ message: `User registration ${status} successfully`, user: safeUser });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Error updating user approval status' });
  }
});

export default router;
