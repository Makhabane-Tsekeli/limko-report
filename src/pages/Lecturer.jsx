import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Lecturer.css";

function Lecturer() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCourses: 0,
    rating: 0,
    totalStudents: 0,
  });

  const [reports, setReports] = useState([]);
  const [showReports, setShowReports] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showTimetable, setShowTimetable] = useState(false);

  // ✅ Helper to sync reports to all roles
  const syncReportToAllRoles = (updatedReports) => {
    localStorage.setItem("lecturerReports", JSON.stringify(updatedReports));
    localStorage.setItem("principalReports", JSON.stringify(updatedReports));
    localStorage.setItem("programLeaderReports", JSON.stringify(updatedReports));
  };

  // Timetable
  const timetable = [
    { day: "Monday", course: "Web Application", time: "08:30 - 10:30" },
    { day: "Tuesday", course: "Java OOP", time: "08:30 - 10:30" },
    { day: "Wednesday", course: "Financial Accounting", time: "08:30 - 10:30" },
    { day: "Thursday", course: "Data Communication", time: "08:30 - 10:30" },
    { day: "Friday", course: "Concept of Organisation", time: "08:30 - 10:30" },
    { day: "Friday", course: "Digital Market", time: "10:30 - 12:30" },
  ];

  useEffect(() => {
    setStats((prev) => ({ ...prev, totalCourses: timetable.length }));
    loadRatingsFromDB();
    loadReportsFromDB();

    const handleStorageChange = () => {
      const updatedReports = JSON.parse(localStorage.getItem("lecturerReports")) || [];
      setReports(updatedReports);
      updateTotalStudents(updatedReports);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const loadRatingsFromDB = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/ratings');
      if (response.ok) {
        const data = await response.json();
        const values = data.filter(r => r.rating).map(r => r.rating);
        const avgRating = values.length
          ? (values.reduce((sum, r) => sum + r, 0) / values.length).toFixed(1)
          : 0;
        setStats((prev) => ({ ...prev, rating: avgRating }));
        return;
      }
    } catch (error) {
      console.error('Error loading ratings from DB:', error);
    }
    const allRatings = JSON.parse(localStorage.getItem("ratings")) || {};
    const values = Object.values(allRatings).filter((r) => !isNaN(r) && r > 0);
    const avgRating = values.length
      ? (values.reduce((sum, r) => sum + r, 0) / values.length).toFixed(1)
      : 0;
    setStats((prev) => ({ ...prev, rating: avgRating }));
  };

  const loadReportsFromDB = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/lecturer-reports');
      if (response.ok) {
        const data = await response.json();
        setReports(data);
        updateTotalStudents(data);
        return;
      }
    } catch (error) {
      console.error('Error loading reports from DB:', error);
    }
    const savedReports = JSON.parse(localStorage.getItem("lecturerReports")) || [];
    setReports(savedReports);
    updateTotalStudents(savedReports);
  };

  const updateTotalStudents = (reportsList) => {
    const total = reportsList.reduce(
      (sum, r) => sum + (parseInt(r.total_registered_students, 10) || 0),
      0
    );
    setStats((prev) => ({ ...prev, totalStudents: total }));
  };

  const handleLogout = async () => {
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');

    try {
      await fetch('http://localhost:5000/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, role }),
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }

    localStorage.removeItem("role");
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    navigate("/");
  };

  const handleEdit = (report) => {
    setEditingId(report.id);
    setEditData({ ...report });
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/lecturer-reports/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        const updatedReport = await response.json();
        const updatedReports = reports.map((r) =>
          r.id === editingId ? updatedReport : r
        );
        setReports(updatedReports);
        syncReportToAllRoles(updatedReports);
        updateTotalStudents(updatedReports);
        setEditingId(null);
        setEditData({});
        return;
      }
    } catch (error) {
      console.error('Error updating report in DB:', error);
    }

    const updatedReports = reports.map((r) =>
      r.id === editingId ? editData : r
    );
    setReports(updatedReports);
    syncReportToAllRoles(updatedReports);
    updateTotalStudents(updatedReports);
    setEditingId(null);
    setEditData({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  return (
    <div className="lecturer-container">
      <h2>Lecturer Dashboard</h2>

      <div className="lecturer-overview">
        <div className="overview-card">
          <h3>Total Courses</h3>
          <p>{stats.totalCourses}</p>
        </div>
        <div className="overview-card">
          <h3>Rating</h3>
          <p>{stats.rating}</p>
        </div>
        <div className="overview-card">
          <h3>Total Students</h3>
          <p>{stats.totalStudents}</p>
        </div>
      </div>

      <div className="lecturer-actions">
        <button className="btn" onClick={() => navigate("/lecturer/report")}>
          Submit Report
        </button>
        <button
          className="btn"
          onClick={() => {
            loadReportsFromDB();
            setShowReports(!showReports);
          }}
        >
          {showReports ? "Hide Reports" : "View Reports"}
        </button>
        <button className="btn" onClick={() => setShowTimetable(!showTimetable)}>
          {showTimetable ? "Hide Timetable" : "View Timetable"}
        </button>
      </div>

      {showTimetable && (
        <div className="timetable">
          <h3>Lecturer Timetable</h3>
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

      {showReports && (
        <div className="reports-list">
          {reports.length === 0 ? (
            <p>No reports submitted yet.</p>
          ) : (
            reports.map((report) => (
              <div key={report.id} className={`report-card ${editingId === report.id ? "editable" : ""}`}>
                {editingId === report.id ? (
                  <div className="report-edit">
                    {Object.keys(report).map((key) =>
                      key !== "id" &&
                      key !== "created_at" &&
                      key !== "submitted_by" ? (
                        <input
                          key={key}
                          type={
                            key.includes("students") ||
                            key.includes("number")
                              ? "number"
                              : "text"
                          }
                          value={editData[key]}
                          onChange={(e) =>
                            setEditData({ ...editData, [key]: e.target.value })
                          }
                          placeholder={key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        />
                      ) : null
                    )}
                    <div className="edit-buttons">
                      <button className="btn" onClick={handleSave}>Save</button>
                      <button className="btn" onClick={handleCancel}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="report-view">
                    <h4>Report for {report.course_name}</h4>
                    <p><strong>Faculty:</strong> {report.faculty_name}</p>
                    <p><strong>Class:</strong> {report.class_name}</p>
                    <p><strong>Week of Reporting:</strong> {report.week_of_reporting}</p>
                    <p><strong>Date of Lecture:</strong> {new Date(report.date_of_lecture).toLocaleDateString()}</p>
                    <p><strong>Lecturer:</strong> {report.lecturer_name}</p>
                    <p><strong>Course Code:</strong> {report.course_code}</p>
                    <p><strong>Venue:</strong> {report.venue}</p>
                    <p><strong>Scheduled Time:</strong> {report.scheduled_time}</p>
                    <p><strong>Actual Students Present:</strong> {report.actual_students_present}</p>
                    <p><strong>Total Registered Students:</strong> {report.total_registered_students}</p>
                    <p><strong>Topic Taught:</strong> {report.topic_taught}</p>
                    <p><strong>Learning Outcomes:</strong> {report.learning_outcomes}</p>
                    <p><strong>Recommendations:</strong> {report.recommendations}</p>

                    <div className="report-actions">
                      <button className="btn" onClick={() => handleEdit(report)}>Edit</button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <div className="lecturer-back-container">
        <button className="btn" onClick={handleLogout}>Log Out</button>
      </div>
    </div>
  );
}

export default Lecturer;
