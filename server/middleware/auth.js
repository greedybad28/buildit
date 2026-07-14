import jwt from 'jsonwebtoken';
import { users } from '../db.js';

export const JWT_SECRET = 'project-learning-club-secret-token';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch fresh user data to verify status/roles aren't outdated
    const user = await users.findById(decoded.id);
    if (!user) {
      return res.status(403).json({ message: 'User no longer exists' });
    }

    req.user = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      status: user.status
    };
    
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Block access if the user's account is not approved (except for viewing their profile details, which we handle individually)
    if (req.user.status !== 'approved') {
      return res.status(403).json({ message: 'Your account is pending approval by a Mentor' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    next();
  };
}
