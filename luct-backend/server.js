const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
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
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'LUCT Reporting System Backend is running!' });
});

// ========== USER AUTHENTICATION ENDPOINTS ==========

// User Registration
app.post('/api/register', async (req, res) => {
  const { username, email, password, role, fullName, phoneNumber, department } = req.body;

  try {
    console.log('Registration attempt:', { username, email, role });
    
    // Check if username or email already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Insert new user
    const result = await pool.query(
      `INSERT INTO users (username, email, password, role, full_name, phone_number, department)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [username, email, password, role, fullName, phoneNumber, department]
    );

    const user = result.rows[0];

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.full_name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  const { username, password, role } = req.body;

  try {
    console.log('Login attempt:', { username, role });
    
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND password = $2 AND role = $3',
      [username, password, role]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    
    // Update login status
    await pool.query(
      'UPDATE users SET is_logged_in = true WHERE id = $1',
      [user.id]
    );

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

// User Logout
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

// ========== LECTURER REPORTS ENDPOINTS ==========

// Get all lecturer reports
app.get('/api/lecturer-reports', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lecturer_reports ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get lecturer report by ID
app.get('/api/lecturer-reports/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM lecturer_reports WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new lecturer report
app.post('/api/lecturer-reports', async (req, res) => {
  const {
    facultyName, className, weekOfReporting, dateOfLecture,
    courseName, courseCode, lecturerName, actualStudents,
    totalRegistered, venue, scheduledTime, topicTaught,
    learningOutcomes, recommendations, submittedBy
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO lecturer_reports 
       (faculty_name, class_name, week_of_reporting, date_of_lecture,
        course_name, course_code, lecturer_name, actual_students_present,
        total_registered_students, venue, scheduled_time, topic_taught,
        learning_outcomes, recommendations, submitted_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        facultyName, className, weekOfReporting, dateOfLecture,
        courseName, courseCode, lecturerName, actualStudents,
        totalRegistered, venue, scheduledTime, topicTaught,
        learningOutcomes, recommendations, submittedBy
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update lecturer report
app.put('/api/lecturer-reports/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    // Build dynamic update query
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    
    const setClause = fields.map((field, index) => {
      // Convert camelCase to snake_case for database
      const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
      return `${dbField} = $${index + 1}`;
    }).join(', ');

    const query = `UPDATE lecturer_reports SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`;
    
    const result = await pool.query(query, [...values, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete lecturer report
app.delete('/api/lecturer-reports/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM lecturer_reports WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== COURSES ENDPOINTS ==========

// Get all courses
app.get('/api/courses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM courses ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get course by ID
app.get('/api/courses/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new course
app.post('/api/courses', async (req, res) => {
  const { courseName, courseCode, lecturerName, className, dateOfLecture, scheduledTime, venue, createdBy } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO courses (course_name, course_code, lecturer_name, class_name, date_of_lecture, scheduled_time, venue, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [courseName, courseCode, lecturerName, className, dateOfLecture, scheduledTime, venue, createdBy]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update course
app.put('/api/courses/:id', async (req, res) => {
  const { id } = req.params;
  const { courseName, courseCode, lecturerName, className, dateOfLecture, scheduledTime, venue } = req.body;

  try {
    const result = await pool.query(
      `UPDATE courses SET course_name = $1, course_code = $2, lecturer_name = $3, class_name = $4, 
       date_of_lecture = $5, scheduled_time = $6, venue = $7 WHERE id = $8 RETURNING *`,
      [courseName, courseCode, lecturerName, className, dateOfLecture, scheduledTime, venue, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete course
app.delete('/api/courses/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM courses WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== RATINGS ENDPOINTS ==========

// Get all ratings
app.get('/api/ratings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ratings');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get ratings by user
app.get('/api/ratings/user/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query('SELECT * FROM ratings WHERE rated_by = $1', [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user ratings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save or update rating
app.post('/api/ratings', async (req, res) => {
  const { dayOfWeek, courseName, rating, ratedBy } = req.body;

  try {
    // Check if rating already exists for this user and day/course
    const existing = await pool.query(
      'SELECT * FROM ratings WHERE day_of_week = $1 AND course_name = $2 AND rated_by = $3',
      [dayOfWeek, courseName, ratedBy]
    );

    if (existing.rows.length > 0) {
      // Update existing rating
      const result = await pool.query(
        'UPDATE ratings SET rating = $1, created_at = CURRENT_TIMESTAMP WHERE day_of_week = $2 AND course_name = $3 AND rated_by = $4 RETURNING *',
        [rating, dayOfWeek, courseName, ratedBy]
      );
      res.json(result.rows[0]);
    } else {
      // Create new rating
      const result = await pool.query(
        'INSERT INTO ratings (day_of_week, course_name, rating, rated_by) VALUES ($1, $2, $3, $4) RETURNING *',
        [dayOfWeek, courseName, rating, ratedBy]
      );
      res.status(201).json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error saving rating:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== TIMETABLE ENDPOINTS ==========

// Get timetable
app.get('/api/timetable', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM timetable ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add timetable entry
app.post('/api/timetable', async (req, res) => {
  const { day, course, timeSlot } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO timetable (day, course, time_slot) VALUES ($1, $2, $3) RETURNING *',
      [day, course, timeSlot]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating timetable entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== DASHBOARD STATISTICS ENDPOINT ==========

// Get dashboard statistics
app.get('/api/dashboard-stats', async (req, res) => {
  try {
    const [
      totalReports,
      totalCourses,
      totalLecturers,
      totalStudents,
      averageRating,
      totalProgramReports
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM lecturer_reports'),
      pool.query('SELECT COUNT(*) FROM courses'),
      pool.query('SELECT COUNT(DISTINCT username) FROM users WHERE role = $1', ['Lecturer']),
      pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['Student']),
      pool.query('SELECT AVG(rating) FROM ratings WHERE rating IS NOT NULL'),
      pool.query('SELECT COUNT(*) FROM program_reports')
    ]);

    res.json({
      totalReports: parseInt(totalReports.rows[0].count),
      totalCourses: parseInt(totalCourses.rows[0].count),
      totalLecturers: parseInt(totalLecturers.rows[0].count),
      totalStudents: parseInt(totalStudents.rows[0].count),
      averageRating: parseFloat(averageRating.rows[0].avg) || 0,
      totalProgramReports: parseInt(totalProgramReports.rows[0].count) || 0
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== PROGRAM REPORTS ENDPOINTS ==========

// Get all program reports
app.get('/api/program-reports', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM program_reports ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching program reports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create program report
app.post('/api/program-reports', async (req, res) => {
  const { title, content, reportDate, submittedBy } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO program_reports (title, content, report_date, submitted_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, content, reportDate, submittedBy]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating program report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update program report
app.put('/api/program-reports/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content, reportDate } = req.body;

  try {
    const result = await pool.query(
      'UPDATE program_reports SET title = $1, content = $2, report_date = $3 WHERE id = $4 RETURNING *',
      [title, content, reportDate, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Program report not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating program report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete program report
app.delete('/api/program-reports/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM program_reports WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Program report not found' });
    }

    res.json({ message: 'Program report deleted successfully' });
  } catch (error) {
    console.error('Error deleting program report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== SEARCH ENDPOINTS (Extra Credit) ==========

// Search lecturer reports
app.get('/api/search/lecturer-reports', async (req, res) => {
  const { query } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM lecturer_reports 
       WHERE course_name ILIKE $1 OR lecturer_name ILIKE $1 OR faculty_name ILIKE $1 OR class_name ILIKE $1
       ORDER BY created_at DESC`,
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching reports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search courses
app.get('/api/search/courses', async (req, res) => {
  const { query } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM courses 
       WHERE course_name ILIKE $1 OR lecturer_name ILIKE $1 OR course_code ILIKE $1 OR class_name ILIKE $1
       ORDER BY created_at DESC`,
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching courses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== ERROR HANDLING ==========

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});