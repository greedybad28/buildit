import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'db.json');

const INITIAL_DB = {
  users: [],
  projects: [],
  submissions: []
};

// Local JSON file database helpers
export async function readDb() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await writeDb(INITIAL_DB);
      return INITIAL_DB;
    }
    throw error;
  }
}

export async function writeDb(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// PostgreSQL Integration
const usePostgres = !!process.env.DATABASE_URL;
let pool = null;

if (usePostgres) {
  console.log('[Database] DATABASE_URL detected. Initializing PostgreSQL client pool...');
  pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1') ? false : {
      rejectUnauthorized: false
    }
  });

  // Verify and bootstrap tables automatically on startup
  async function initPostgresSchema() {
    try {
      const client = await pool.connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL,
            status VARCHAR(50) NOT NULL,
            joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS projects (
            id VARCHAR(255) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            difficulty_tier VARCHAR(50) NOT NULL,
            deadline DATE NOT NULL,
            status VARCHAR(50) NOT NULL,
            created_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS submissions (
            id VARCHAR(255) PRIMARY KEY,
            project_id VARCHAR(255) REFERENCES projects(id) ON DELETE CASCADE,
            user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
            submission_link VARCHAR(500) NOT NULL,
            status VARCHAR(50) NOT NULL,
            feedback TEXT,
            reviewed_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
            reviewed_at TIMESTAMP WITH TIME ZONE,
            submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(project_id, user_id)
          );
        `);
        console.log('[Postgres] Schema initialization and verify completed successfully.');
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('[Postgres] Error initializing schema tables:', err);
    }
  }

  initPostgresSchema();
}

// User Helpers
export const users = {
  async getAll() {
    if (usePostgres) {
      const res = await pool.query('SELECT * FROM users ORDER BY joined_at DESC');
      return res.rows.map(row => ({
        id: row.id,
        name: row.name,
        username: row.username,
        password: row.password,
        role: row.role,
        status: row.status,
        joinedAt: row.joined_at
      }));
    }
    const db = await readDb();
    return db.users;
  },
  
  async findByUsername(username) {
    if (usePostgres) {
      const res = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        id: row.id,
        name: row.name,
        username: row.username,
        password: row.password,
        role: row.role,
        status: row.status,
        joinedAt: row.joined_at
      };
    }
    const db = await readDb();
    return db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  },
  
  async findById(id) {
    if (usePostgres) {
      const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        id: row.id,
        name: row.name,
        username: row.username,
        password: row.password,
        role: row.role,
        status: row.status,
        joinedAt: row.joined_at
      };
    }
    const db = await readDb();
    return db.users.find(u => u.id === id);
  },
  
  async create(user) {
    if (usePostgres) {
      const id = crypto.randomUUID();
      const joinedAt = new Date().toISOString();
      const res = await pool.query(
        'INSERT INTO users (id, name, username, password, role, status, joined_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [id, user.name, user.username, user.password, user.role, user.status, joinedAt]
      );
      const row = res.rows[0];
      return {
        id: row.id,
        name: row.name,
        username: row.username,
        password: row.password,
        role: row.role,
        status: row.status,
        joinedAt: row.joined_at
      };
    }
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
    if (usePostgres) {
      const keys = Object.keys(updates);
      if (keys.length === 0) return null;
      
      const setClause = [];
      const values = [];
      let paramIndex = 1;
      
      for (const key of keys) {
        const dbKey = key === 'joinedAt' ? 'joined_at' : key;
        setClause.push(`${dbKey} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
      
      values.push(id);
      const query = `UPDATE users SET ${setClause.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
      const res = await pool.query(query, values);
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        id: row.id,
        name: row.name,
        username: row.username,
        password: row.password,
        role: row.role,
        status: row.status,
        joinedAt: row.joined_at
      };
    }
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
    if (usePostgres) {
      const res = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
      return res.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        difficultyTier: row.difficulty_tier,
        deadline: row.deadline,
        status: row.status,
        createdBy: row.created_by,
        createdAt: row.created_at,
        objectives: [],
        resources: []
      }));
    }
    const db = await readDb();
    return db.projects;
  },
  
  async findById(id) {
    if (usePostgres) {
      const res = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        difficultyTier: row.difficulty_tier,
        deadline: row.deadline,
        status: row.status,
        createdBy: row.created_by,
        createdAt: row.created_at,
        objectives: [],
        resources: []
      };
    }
    const db = await readDb();
    return db.projects.find(p => p.id === id);
  },
  
  async create(project) {
    if (usePostgres) {
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const res = await pool.query(
        'INSERT INTO projects (id, title, description, difficulty_tier, deadline, status, created_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [id, project.title, project.description, project.difficultyTier, project.deadline, project.status, project.createdBy, createdAt]
      );
      const row = res.rows[0];
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        difficultyTier: row.difficulty_tier,
        deadline: row.deadline,
        status: row.status,
        createdBy: row.created_by,
        createdAt: row.created_at,
        objectives: [],
        resources: []
      };
    }
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
    if (usePostgres) {
      const keys = Object.keys(updates);
      if (keys.length === 0) return null;
      
      const setClause = [];
      const values = [];
      let paramIndex = 1;
      
      for (const key of keys) {
        if (key === 'objectives' || key === 'resources') continue;
        const dbKey = key === 'difficultyTier' ? 'difficulty_tier' : key;
        setClause.push(`${dbKey} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
      
      values.push(id);
      const query = `UPDATE projects SET ${setClause.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
      const res = await pool.query(query, values);
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        difficultyTier: row.difficulty_tier,
        deadline: row.deadline,
        status: row.status,
        createdBy: row.created_by,
        createdAt: row.created_at,
        objectives: [],
        resources: []
      };
    }
    const db = await readDb();
    const index = db.projects.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    db.projects[index] = { ...db.projects[index], ...updates };
    await writeDb(db);
    return db.projects[index];
  },
  
  async delete(id) {
    if (usePostgres) {
      const res = await pool.query('DELETE FROM projects WHERE id = $1', [id]);
      return res.rowCount > 0;
    }
    const db = await readDb();
    const index = db.projects.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    db.projects.splice(index, 1);
    db.submissions = db.submissions.filter(s => s.projectId !== id);
    await writeDb(db);
    return true;
  }
};

// Submission Helpers
export const submissions = {
  async getAll() {
    if (usePostgres) {
      const res = await pool.query('SELECT * FROM submissions ORDER BY submitted_at DESC');
      return res.rows.map(row => ({
        id: row.id,
        projectId: row.project_id,
        userId: row.user_id,
        submissionLink: row.submission_link,
        status: row.status,
        feedback: row.feedback,
        reviewedBy: row.reviewed_by,
        reviewedAt: row.reviewed_at,
        submittedAt: row.submitted_at
      }));
    }
    const db = await readDb();
    return db.submissions;
  },
  
  async findById(id) {
    if (usePostgres) {
      const res = await pool.query('SELECT * FROM submissions WHERE id = $1', [id]);
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        id: row.id,
        projectId: row.project_id,
        userId: row.user_id,
        submissionLink: row.submission_link,
        status: row.status,
        feedback: row.feedback,
        reviewedBy: row.reviewed_by,
        reviewedAt: row.reviewed_at,
        submittedAt: row.submitted_at
      };
    }
    const db = await readDb();
    return db.submissions.find(s => s.id === id);
  },
  
  async findByProjectAndUser(projectId, userId) {
    if (usePostgres) {
      const res = await pool.query('SELECT * FROM submissions WHERE project_id = $1 AND user_id = $2', [projectId, userId]);
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        id: row.id,
        projectId: row.project_id,
        userId: row.user_id,
        submissionLink: row.submission_link,
        status: row.status,
        feedback: row.feedback,
        reviewedBy: row.reviewed_by,
        reviewedAt: row.reviewed_at,
        submittedAt: row.submitted_at
      };
    }
    const db = await readDb();
    return db.submissions.find(s => s.projectId === projectId && s.userId === userId);
  },
  
  async create(submission) {
    if (usePostgres) {
      const id = crypto.randomUUID();
      const submittedAt = new Date().toISOString();
      const query = `
        INSERT INTO submissions (id, project_id, user_id, submission_link, status, feedback, reviewed_by, reviewed_at, submitted_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (project_id, user_id) 
        DO UPDATE SET submission_link = EXCLUDED.submission_link, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at
        RETURNING *
      `;
      const res = await pool.query(query, [
        id,
        submission.projectId,
        submission.userId,
        submission.submissionLink,
        submission.status,
        submission.feedback,
        submission.reviewedBy,
        submission.reviewedAt,
        submittedAt
      ]);
      const row = res.rows[0];
      return {
        id: row.id,
        projectId: row.project_id,
        userId: row.user_id,
        submissionLink: row.submission_link,
        status: row.status,
        feedback: row.feedback,
        reviewedBy: row.reviewed_by,
        reviewedAt: row.reviewed_at,
        submittedAt: row.submitted_at
      };
    }
    const db = await readDb();
    const newSubmission = {
      ...submission,
      id: crypto.randomUUID(),
      submittedAt: new Date().toISOString()
    };
    
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
    if (usePostgres) {
      const keys = Object.keys(updates);
      if (keys.length === 0) return null;
      
      const setClause = [];
      const values = [];
      let paramIndex = 1;
      
      for (const key of keys) {
        let dbKey = key;
        if (key === 'projectId') dbKey = 'project_id';
        else if (key === 'userId') dbKey = 'user_id';
        else if (key === 'submissionLink') dbKey = 'submission_link';
        else if (key === 'reviewedBy') dbKey = 'reviewed_by';
        else if (key === 'reviewedAt') dbKey = 'reviewed_at';
        else if (key === 'submittedAt') dbKey = 'submitted_at';
        
        setClause.push(`${dbKey} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
      
      values.push(id);
      const query = `UPDATE submissions SET ${setClause.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
      const res = await pool.query(query, values);
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        id: row.id,
        projectId: row.project_id,
        userId: row.user_id,
        submissionLink: row.submission_link,
        status: row.status,
        feedback: row.feedback,
        reviewedBy: row.reviewed_by,
        reviewedAt: row.reviewed_at,
        submittedAt: row.submitted_at
      };
    }
    const db = await readDb();
    const index = db.submissions.findIndex(s => s.id === id);
    if (index === -1) return null;
    
    db.submissions[index] = { ...db.submissions[index], ...updates };
    await writeDb(db);
    return db.submissions[index];
  },

  async getByProject(projectId) {
    if (usePostgres) {
      const res = await pool.query('SELECT * FROM submissions WHERE project_id = $1 ORDER BY submitted_at DESC', [projectId]);
      return res.rows.map(row => ({
        id: row.id,
        projectId: row.project_id,
        userId: row.user_id,
        submissionLink: row.submission_link,
        status: row.status,
        feedback: row.feedback,
        reviewedBy: row.reviewed_by,
        reviewedAt: row.reviewed_at,
        submittedAt: row.submitted_at
      }));
    }
    const db = await readDb();
    return db.submissions.filter(s => s.projectId === projectId);
  },

  async getByUser(userId) {
    if (usePostgres) {
      const res = await pool.query('SELECT * FROM submissions WHERE user_id = $1 ORDER BY submitted_at DESC', [userId]);
      return res.rows.map(row => ({
        id: row.id,
        projectId: row.project_id,
        userId: row.user_id,
        submissionLink: row.submission_link,
        status: row.status,
        feedback: row.feedback,
        reviewedBy: row.reviewed_by,
        reviewedAt: row.reviewed_at,
        submittedAt: row.submitted_at
      }));
    }
    const db = await readDb();
    return db.submissions.filter(s => s.userId === userId);
  }
};
