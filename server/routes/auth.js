import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { users } from '../db.js';
import { authenticateToken, JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

// Helper to generate JWT
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, status: user.status },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const existingUser = await users.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const allUsers = await users.getAll();
    
    let assignedRole = role || 'member';
    let status = 'pending';

    // First user is automatically approved as Mentor
    if (allUsers.length === 0) {
      assignedRole = 'mentor';
      status = 'approved';
    }

    const newUser = await users.create({
      username: username.trim(),
      name: username.trim(), // fallback to satisfy name references in frontend
      password: hashedPassword,
      role: assignedRole,
      status
    });

    const token = generateToken(newUser);
    
    // Don't send back password hash
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      message: 'Signup successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error during signup' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await users.findByUsername(username);
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const token = generateToken(user);
    
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login' });
  }
});

// GET CURRENT USER
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await users.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
