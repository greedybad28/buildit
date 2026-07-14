import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'db.json');

const INITIAL_DB = {
  users: [],
  projects: [],
  submissions: []
};

// Helper to initialize and read DB
export async function readDb() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, create it with initial structure
      await writeDb(INITIAL_DB);
      return INITIAL_DB;
    }
    throw error;
  }
}

// Helper to write DB
export async function writeDb(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// User Helpers
export const users = {
  async getAll() {
    const db = await readDb();
    return db.users;
  },
  
  async findByUsername(username) {
    const db = await readDb();
    return db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  },
  
  async findById(id) {
    const db = await readDb();
    return db.users.find(u => u.id === id);
  },
  
  async create(user) {
    const db = await readDb();
    const newUser = {
      ...user,
      id: crypto.randomUUID(),
      joinedAt: new Date().toISOString()
    };
    db.users.push(newUser);
    await writeDb(db);
    return newUser;
  },
  
  async update(id, updates) {
    const db = await readDb();
    const index = db.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    db.users[index] = { ...db.users[index], ...updates };
    await writeDb(db);
    return db.users[index];
  }
};

// Project Helpers
export const projects = {
  async getAll() {
    const db = await readDb();
    return db.projects;
  },
  
  async findById(id) {
    const db = await readDb();
    return db.projects.find(p => p.id === id);
  },
  
  async create(project) {
    const db = await readDb();
    const newProject = {
      ...project,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    db.projects.push(newProject);
    await writeDb(db);
    return newProject;
  },
  
  async update(id, updates) {
    const db = await readDb();
    const index = db.projects.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    db.projects[index] = { ...db.projects[index], ...updates };
    await writeDb(db);
    return db.projects[index];
  },
  
  async delete(id) {
    const db = await readDb();
    const index = db.projects.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    db.projects.splice(index, 1);
    // Also cleanup submissions for this project
    db.submissions = db.submissions.filter(s => s.projectId !== id);
    await writeDb(db);
    return true;
  }
};

// Submission Helpers
export const submissions = {
  async getAll() {
    const db = await readDb();
    return db.submissions;
  },
  
  async findById(id) {
    const db = await readDb();
    return db.submissions.find(s => s.id === id);
  },
  
  async findByProjectAndUser(projectId, userId) {
    const db = await readDb();
    return db.submissions.find(s => s.projectId === projectId && s.userId === userId);
  },
  
  async create(submission) {
    const db = await readDb();
    const newSubmission = {
      ...submission,
      id: crypto.randomUUID(),
      submittedAt: new Date().toISOString()
    };
    
    // Check if user already submitted for this project, if so overwrite/update instead of dupe
    const index = db.submissions.findIndex(s => s.projectId === submission.projectId && s.userId === submission.userId);
    if (index !== -1) {
      db.submissions[index] = { ...db.submissions[index], ...newSubmission, id: db.submissions[index].id };
      await writeDb(db);
      return db.submissions[index];
    }
    
    db.submissions.push(newSubmission);
    await writeDb(db);
    return newSubmission;
  },
  
  async update(id, updates) {
    const db = await readDb();
    const index = db.submissions.findIndex(s => s.id === id);
    if (index === -1) return null;
    
    db.submissions[index] = { ...db.submissions[index], ...updates };
    await writeDb(db);
    return db.submissions[index];
  },

  async getByProject(projectId) {
    const db = await readDb();
    return db.submissions.filter(s => s.projectId === projectId);
  },

  async getByUser(userId) {
    const db = await readDb();
    return db.submissions.filter(s => s.userId === userId);
  }
};
