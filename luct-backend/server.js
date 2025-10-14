import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ["https://limko-report-vp3g.vercel.app"], // Your deployed frontend URL
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Test database connection
pool.on('connect', () => console.log('Connected to PostgreSQL database'));
pool.on('error', (err) => console.error('Database connection error:', err));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'LUCT Reporting System Backend is running!' });
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

// ===== Other endpoints (lecturer reports, courses, ratings, timetable, program reports, dashboard stats, search) =====
// You can copy them from your original server.js as they are

// ===== Error handling =====
app.use('*', (req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => console.log(`Server running on port ${port}`));
