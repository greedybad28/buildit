import express from 'express';
import { projects, submissions, users } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// PROJECT ROUTES
// ==========================================

// Get all projects (accessible by all approved users)
router.get('/', authenticateToken, requireRole(['member', 'mentor']), async (req, res) => {
  try {
    const list = await projects.getAll();
    res.json(list);
  } catch (error) {
    console.error('Fetch projects error:', error);
    res.status(500).json({ message: 'Error fetching projects' });
  }
});

// Get project details
router.get('/:id', authenticateToken, requireRole(['member', 'mentor']), async (req, res) => {
  try {
    const project = await projects.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    console.error('Fetch project detail error:', error);
    res.status(500).json({ message: 'Error fetching project details' });
  }
});

// Create new project (Maintainer only)
router.post('/', authenticateToken, requireRole(['mentor']), async (req, res) => {
  try {
    const { title, description, objectives, resources, difficultyTier, deadline } = req.body;

    if (!title || !description || !deadline || !difficultyTier) {
      return res.status(400).json({ message: 'Title, description, difficulty tier, and deadline are required' });
    }

    const newProject = await projects.create({
      title,
      description,
      objectives: objectives || [],
      resources: resources || [],
      difficultyTier,
      deadline,
      status: 'open',
      createdBy: req.user.id
    });

    res.status(201).json(newProject);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Error creating project' });
  }
});

// Update project (Maintainer only)
router.put('/:id', authenticateToken, requireRole(['mentor']), async (req, res) => {
  try {
    const { title, description, objectives, resources, difficultyTier, deadline, status } = req.body;
    
    const updated = await projects.update(req.params.id, {
      title,
      description,
      objectives: objectives || [],
      resources: resources || [],
      difficultyTier,
      deadline,
      status
    });

    if (!updated) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Error updating project' });
  }
});

// Delete project (Maintainer only)
router.delete('/:id', authenticateToken, requireRole(['mentor']), async (req, res) => {
  try {
    const deleted = await projects.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Error deleting project' });
  }
});

// ==========================================
// SUBMISSION ROUTES
// ==========================================

// Get logged-in user's submissions (all roles)
router.get('/submissions/mine', authenticateToken, requireRole(['member', 'mentor']), async (req, res) => {
  try {
    const list = await submissions.getByUser(req.user.id);
    res.json(list);
  } catch (error) {
    console.error('Fetch my submissions error:', error);
    res.status(500).json({ message: 'Error fetching submissions' });
  }
});

// Get all submissions (Maintainer/Reviewer only - Review Queue)
router.get('/submissions/all', authenticateToken, requireRole(['mentor']), async (req, res) => {
  try {
    const list = await submissions.getAll();
    // Attach user information and project information to the submissions
    const allUsers = await users.getAll();
    const allProjects = await projects.getAll();

    const formattedList = list.map(sub => {
      const user = allUsers.find(u => u.id === sub.userId);
      const project = allProjects.find(p => p.id === sub.projectId);
      const reviewer = allUsers.find(u => u.id === sub.reviewedBy);
      return {
        ...sub,
        userName: user ? user.name : 'Unknown Learner',
        username: user ? user.username : '',
        projectTitle: project ? project.title : 'Deleted Project',
        reviewerName: reviewer ? reviewer.name : ''
      };
    });

    res.json(formattedList);
  } catch (error) {
    console.error('Fetch all submissions error:', error);
    res.status(500).json({ message: 'Error fetching submissions queue' });
  }
});

// Get submissions for a specific project (Maintainer/Reviewer only)
router.get('/:id/submissions', authenticateToken, requireRole(['mentor']), async (req, res) => {
  try {
    const list = await submissions.getByProject(req.params.id);
    const allUsers = await users.getAll();
    const formattedList = list.map(sub => {
      const user = allUsers.find(u => u.id === sub.userId);
      const reviewer = allUsers.find(u => u.id === sub.reviewedBy);
      return {
        ...sub,
        userName: user ? user.name : 'Unknown Learner',
        username: user ? user.username : '',
        reviewerName: reviewer ? reviewer.name : ''
      };
    });
    res.json(formattedList);
  } catch (error) {
    console.error('Fetch project submissions error:', error);
    res.status(500).json({ message: 'Error fetching project submissions' });
  }
});

// Submit project work (Learner/Reviewer/Maintainer)
router.post('/:id/submit', authenticateToken, requireRole(['member', 'mentor']), async (req, res) => {
  try {
    const { submissionLink } = req.body;
    if (!submissionLink) {
      return res.status(400).json({ message: 'Submission link (GitHub repo URL, etc.) is required' });
    }

    const project = await projects.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.status === 'closed') {
      return res.status(400).json({ message: 'This project is closed and no longer accepting submissions' });
    }

    const newSub = await submissions.create({
      projectId: req.params.id,
      userId: req.user.id,
      submissionLink,
      status: 'pending',
      feedback: '',
      reviewedBy: null,
      reviewedAt: null
    });

    res.status(201).json(newSub);
  } catch (error) {
    console.error('Submit project error:', error);
    res.status(500).json({ message: 'Error submitting project' });
  }
});

// Review submission (Maintainer/Reviewer only)
router.post('/submissions/:id/review', authenticateToken, requireRole(['mentor']), async (req, res) => {
  try {
    const { status, feedback } = req.body;
    if (!status || !['reviewed', 'needs changes'].includes(status)) {
      return res.status(400).json({ message: 'Valid review status (reviewed or needs changes) is required' });
    }

    const sub = await submissions.findById(req.params.id);
    if (!sub) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const updated = await submissions.update(req.params.id, {
      status,
      feedback: feedback || '',
      reviewedBy: req.user.id,
      reviewedAt: new Date().toISOString()
    });

    res.json(updated);
  } catch (error) {
    console.error('Review submission error:', error);
    res.status(500).json({ message: 'Error updating submission review' });
  }
});

export default router;
