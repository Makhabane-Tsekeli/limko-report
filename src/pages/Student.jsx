import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Student.css";

function Student() {
  const navigate = useNavigate();

  const [showTimetable, setShowTimetable] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [ratings, setRatings] = useState({});
  const [averageRating, setAverageRating] = useState(0);
  const [ratedCourses, setRatedCourses] = useState(0);

  const timetable = [
    { day: "Monday", course: "Web Application", time: "08:30 - 10:30" },
    { day: "Tuesday", course: "Java OOP", time: "08:30 - 10:30" },
    { day: "Wednesday", course: "Financial Accounting", time: "08:30 - 10:30" },
    { day: "Thursday", course: "Data Communication", time: "08:30 - 10:30" },
    { day: "Friday", course: "Concept of Organisation", time: "08:30 - 10:30" },
    { day: "Friday", course: "Digital Market", time: "10:30 - 12:30" },
  ];

  // Load saved ratings - ADDED DATABASE CONNECTION
  useEffect(() => {
    loadRatingsFromDB();
  }, []);

  // NEW: Load ratings from database
  const loadRatingsFromDB = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        const response = await fetch(`http://localhost:5000/api/ratings/user/${userId}`);
        if (response.ok) {
          const data = await response.json();
          const userRatings = {};
          data.forEach(rating => {
            userRatings[rating.day_of_week] = rating.rating;
          });
          setRatings(userRatings);
          updateStats(userRatings);
          return;
        }
      }
    } catch (error) {
      console.error('Error loading ratings from DB:', error);
    }
    // Fallback to localStorage
    const savedRatings = JSON.parse(localStorage.getItem("ratings")) || {};
    setRatings(savedRatings);
    updateStats(savedRatings);
  };

  // Update Average Rating and Rated Courses - UNCHANGED
  const updateStats = (ratingsObj) => {
    const values = Object.values(ratingsObj).filter(v => !isNaN(v) && v > 0);
    if (values.length === 0) {
      setAverageRating(0);
      setRatedCourses(0);
      return;
    }
    const avg = (values.reduce((sum, r) => sum + r, 0) / values.length).toFixed(1);
    setAverageRating(avg);
    setRatedCourses(values.length);
  };

  // Handle rating input change - ADDED DATABASE CONNECTION
  const handleRatingChange = async (day, value) => {
    const newRatings = {
      ...ratings,
      [day]: parseInt(value) || 0,
    };
    setRatings(newRatings);
    updateStats(newRatings);

    // NEW: Save to database immediately
    try {
      const userId = localStorage.getItem('userId');
      const courseName = timetable.find(slot => slot.day === day)?.course || day;
      
      if (userId) {
        await fetch('http://localhost:5000/api/ratings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dayOfWeek: day,
            courseName: courseName,
            rating: parseInt(value) || 0,
            ratedBy: userId
          }),
        });
      }
    } catch (error) {
      console.error('Error saving rating to DB:', error);
    }
  };

  // Save ratings to localStorage - ADDED DATABASE CONNECTION
  const handleSubmitRatings = async () => {
    // NEW: Save all ratings to database
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        for (const [day, rating] of Object.entries(ratings)) {
          const courseName = timetable.find(slot => slot.day === day)?.course || day;
          await fetch('http://localhost:5000/api/ratings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              dayOfWeek: day,
              courseName: courseName,
              rating: parseInt(rating) || 0,
              ratedBy: userId
            }),
          });
        }
      }
    } catch (error) {
      console.error('Error saving ratings to DB:', error);
    }

    // Keep original localStorage functionality
    localStorage.setItem("ratings", JSON.stringify(ratings));
    alert("Ratings saved!");
    setShowRating(false);
  };

  // --- Updated Logout - ADDED DATABASE CONNECTION ---
  const handleLogout = async () => {
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    // NEW: Notify backend about logout
    try {
      await fetch('http://localhost:5000/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, role }),
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }

    // Remove this user from loggedInUsers - UNCHANGED
    const loggedInUsers = JSON.parse(localStorage.getItem("loggedInUsers")) || [];
    const updatedUsers = loggedInUsers.filter(
      (u) => !(u.username === username && u.role === role)
    );
    localStorage.setItem("loggedInUsers", JSON.stringify(updatedUsers));

    // Clear session - UNCHANGED
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");

    navigate("/login");
  };

  return (
    <div className="student-container">
      <h2>Student</h2>
      {/* Overview Cards */}
      <div className="student-overview">
        <div className="overview-card">
          <h3>Average Rating</h3>
          <p>{averageRating}</p>
        </div>
        <div className="overview-card">
          <h3>Total Courses</h3>
          <p>{timetable.length}</p>
        </div>
        <div className="overview-card">
          <h3>Rating per Lesson (Day)</h3>
          <p>{ratedCourses}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="student-actions">
        <button
          className="action-btn"
          onClick={() => {
            setShowTimetable(!showTimetable);
            setShowRating(false);
          }}
        >
          My Time table
        </button>
        <button
          className="action-btn"
          onClick={() => {
            setShowRating(!showRating);
            setShowTimetable(false);
          }}
        >
          Rating
        </button>
      </div>

      {/* Timetable */}
      {showTimetable && (
        <div className="timetable">
          <h3>Weekly Timetable</h3>
          <table className="timetable-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Course</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {timetable.map((slot, index) => (
                <tr key={index}>
                  <td>{slot.day}</td>
                  <td>{slot.course}</td>
                  <td>{slot.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rating Table */}
      {showRating && (
        <div className="timetable">
          <h3>Rate Your Courses</h3>
          <table className="timetable-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Course</th>
                <th>Rating (1-5)</th>
              </tr>
            </thead>
            <tbody>
              {timetable.map((slot, index) => (
                <tr key={index}>
                  <td>{slot.day}</td>
                  <td>{slot.course}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={ratings[slot.day] || ""}
                      onChange={(e) =>
                        handleRatingChange(slot.day, e.target.value)
                      }
                      className="rating-input"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="action-btn" onClick={handleSubmitRatings}>
            Save Ratings
          </button>
        </div>
      )}

      {/* Logout */}
      <div className="student-back-container">
        <button className="student-back-btn" onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </div>
  );
}

export default Student;