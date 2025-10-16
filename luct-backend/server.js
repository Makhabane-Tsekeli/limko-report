import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware - UPDATED CORS
app.use(cors({
  origin: [
    "https://limko-report.vercel.app", // Your actual frontend URL
    "https://limko-report-1.onrender.com", 
    "http://localhost:5173",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

// ✅ UPDATED: PostgreSQL connection for Production (Supabase)
const poolConfig = process.env.DATABASE_URL 
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } // Required for Supabase
    }
  : {
      // Fallback for local development
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

const pool = new Pool(poolConfig);

// Test database connection
pool.on('connect', () => console.log('Connected to PostgreSQL database'));
pool.on('error', (err) => console.error('Database connection error:', err));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'LUCT Reporting System Backend is running!' });
});

// ✅ ADD THIS: Database setup endpoint for Supabase
app.post('/api/setup-database', async (req, res) => {
  try {
    console.log('Setting up database tables...');
    
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('Student', 'Lecturer', 'PrincipalLecture', 'ProgramLeader')),
        full_name VARCHAR(100),
        phone_number VARCHAR(20),
        department VARCHAR(100),
        is_logged_in BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create lecturer_reports table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lecturer_reports (
        id SERIAL PRIMARY KEY,
        faculty_name VARCHAR(100) NOT NULL,
        class_name VARCHAR(50) NOT NULL,
        week_of_reporting VARCHAR(20) NOT NULL,
        date_of_lecture DATE NOT NULL,
        course_name VARCHAR(100) NOT NULL,
        course_code VARCHAR(20) NOT NULL,
        lecturer_name VARCHAR(100) NOT NULL,
        actual_students_present INTEGER NOT NULL,
        total_registered_students INTEGER NOT NULL,
        venue VARCHAR(100) NOT NULL,
        scheduled_time TIME NOT NULL,
        topic_taught TEXT NOT NULL,
        learning_outcomes TEXT NOT NULL,
        recommendations TEXT,
        submitted_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create courses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        course_name VARCHAR(100) NOT NULL,
        course_code VARCHAR(20) UNIQUE NOT NULL,
        lecturer_name VARCHAR(100) NOT NULL,
        class_name VARCHAR(50) NOT NULL,
        date_of_lecture DATE,
        scheduled_time TIME,
        venue VARCHAR(100),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create program_reports table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS program_reports (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        report_date DATE NOT NULL,
        submitted_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create timetable table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS timetable (
        id SERIAL PRIMARY KEY,
        day VARCHAR(20) NOT NULL,
        course VARCHAR(100) NOT NULL,
        time_slot VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create ratings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        day_of_week VARCHAR(20) NOT NULL,
        course_name VARCHAR(100) NOT NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        rated_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('All tables created successfully');
    res.json({ message: 'Database tables created successfully' });
  } catch (error) {
    console.error('Database setup error:', error);
    res.status(500).json({ error: 'Database setup failed', details: error.message });
  }
});

// ===== USER AUTHENTICATION ENDPOINTS =====
import bcrypt from 'bcryptjs';

// Registration
app.post('/api/register', async (req, res) => {
  const { username, email, password, role, fullName, phoneNumber, department } = req.body;
  try {
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    if (existingUser.rows.length > 0)
      return res.status(400).json({ error: 'Username or email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, email, password, role, full_name, phone_number, department)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username, email, role, full_name`,
      [username, email, hashedPassword, role, fullName, phoneNumber, department]
    );

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email,
        role: result.rows[0].role,
        fullName: result.rows[0].full_name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND role = $2',
      [username, role]
    );
    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    await pool.query('UPDATE users SET is_logged_in = true WHERE id = $1', [user.id]);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
app.post('/api/logout', async (req, res) => {
  const { username, role } = req.body;
  try {
    await pool.query(
      'UPDATE users SET is_logged_in = false WHERE username = $1 AND role = $2',
      [username, role]
    );
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== ADD YOUR OTHER ENDPOINTS HERE =====
// Copy all your existing endpoints from your original server.js:
// - lecturer reports
// - courses  
// - ratings
// - timetable
// - program reports
// - dashboard stats
// - search endpoints

// ===== Error handling =====
app.use('*', (req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => console.log(`Server running on port ${port}`));