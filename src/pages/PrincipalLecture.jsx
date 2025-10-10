import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/PrincipalLecture.css";

function PrincipalLecture() {
  const navigate = useNavigate();

  const [showReports, setShowReports] = useState(false);
  const [submittedReports, setSubmittedReports] = useState([]);
  const [showProgramReportForm, setShowProgramReportForm] = useState(false);
  const [programReports, setProgramReports] = useState([]);
  const [programReport, setProgramReport] = useState({
    title: "",
    content: "",
    date: "",
  });

  const [editingIndex, setEditingIndex] = useState(null);
  const [editData, setEditData] = useState({});
  const [courses, setCourses] = useState([]);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    loadReportsFromDB();
    loadCoursesFromDB();
    loadRatingsFromDB();

    const programs = JSON.parse(localStorage.getItem("programReports")) || [];
    setProgramReports(programs);
  }, []);

  const loadReportsFromDB = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/lecturer-reports');
      if (response.ok) {
        const data = await response.json();
        setSubmittedReports(data);
        return;
      }
    } catch (error) {
      console.error('Error loading reports from DB:', error);
    }
    const reports = JSON.parse(localStorage.getItem("submittedReports")) || [];
    setSubmittedReports(reports);
  };

  const loadCoursesFromDB = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
        return;
      }
    } catch (error) {
      console.error('Error loading courses from DB:', error);
    }
    const coursesList = JSON.parse(localStorage.getItem("courses")) || [];
    setCourses(coursesList);
  };

  const loadRatingsFromDB = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/ratings');
      if (response.ok) {
        const data = await response.json();
        const values = data.filter(r => r.rating).map(r => r.rating);
        const avg = values.length
          ? (values.reduce((sum, r) => sum + r, 0) / values.length).toFixed(1)
          : 0;
        setAverageRating(avg);
        return;
      }
    } catch (error) {
      console.error('Error loading ratings from DB:', error);
    }
    const ratings = JSON.parse(localStorage.getItem("ratings")) || {};
    if (Object.keys(ratings).length > 0) {
      const allRatings = Object.values(ratings).flat();
      const avg =
        allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length || 0;
      setAverageRating(avg.toFixed(1));
    }
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const reports = JSON.parse(localStorage.getItem("submittedReports")) || [];
      const programs = JSON.parse(localStorage.getItem("programReports")) || [];
      const coursesList = JSON.parse(localStorage.getItem("courses")) || [];
      const ratings = JSON.parse(localStorage.getItem("ratings")) || {};

      setSubmittedReports(reports);
      setProgramReports(programs);
      setCourses(coursesList);

      if (Object.keys(ratings).length > 0) {
        const allRatings = Object.values(ratings).flat();
        const avg =
          allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length || 0;
        setAverageRating(avg.toFixed(1));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const lecturersSupervised = [...new Set(courses.map((c) => c.lecturerName))].length;

  const handleLogout = async () => {
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');

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

    localStorage.removeItem("role");
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    navigate("/");
  };

  const handleProgramReportChange = (e) => {
    const { name, value } = e.target;
    setProgramReport({ ...programReport, [name]: value });
  };

  const handleSubmitProgramReport = () => {
    if (!programReport.title || !programReport.content || !programReport.date) {
      alert("Please fill in all fields.");
      return;
    }

    const newReports = [
      ...programReports,
      { ...programReport, submittedBy: "Principal Lecturer" },
    ];
    localStorage.setItem("programReports", JSON.stringify(newReports));
    setProgramReports(newReports);

    alert("Program report submitted successfully!");
    setProgramReport({ title: "", content: "", date: "" });
    setShowProgramReportForm(false);
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditData({ ...programReports[index] });
  };

  const handleSave = () => {
    const updatedReports = [...programReports];
    updatedReports[editingIndex] = editData;
    localStorage.setItem("programReports", JSON.stringify(updatedReports));
    setProgramReports(updatedReports);
    setEditingIndex(null);
    setEditData({});
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setEditData({});
  };

  const handleDeleteLecturerReport = async (index) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      try {
        const report = submittedReports[index];
        if (report.id) {
          const response = await fetch(`http://localhost:5000/api/lecturer-reports/${report.id}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            const updatedReports = submittedReports.filter((_, i) => i !== index);
            setSubmittedReports(updatedReports);
            localStorage.setItem("submittedReports", JSON.stringify(updatedReports));
            return;
          }
        }
        throw new Error('No report ID');
      } catch (error) {
        const updatedReports = submittedReports.filter((_, i) => i !== index);
        setSubmittedReports(updatedReports);
        localStorage.setItem("submittedReports", JSON.stringify(updatedReports));
      }
    }
  };

  return (
    <div className="principal-container">
      <h2>Principal Lecturer</h2>

      <div className="principal-overview">
        <div className="overview-card">
          <h3>Total Reports</h3>
          <p>{submittedReports.length + programReports.length}</p>
        </div>
        <div className="overview-card">
          <h3>Average Rating</h3>
          <p>{averageRating > 0 ? averageRating : "No ratings yet"}</p>
        </div>
        <div className="overview-card">
          <h3>Lecturers Supervised</h3>
          <p>{lecturersSupervised}</p>
        </div>
      </div>

      <div className="principal-actions">
        <button
          className="action-btn"
          onClick={() => {
            loadReportsFromDB();
            setShowReports(!showReports);
          }}
        >
          {showReports ? "Hide Reports" : "View Lecturer Reports"}
        </button>

        <button
          className="action-btn"
          onClick={() => setShowProgramReportForm(!showProgramReportForm)}
        >
          {showProgramReportForm
            ? "Cancel Program Report"
            : "Submit Program Report"}
        </button>
      </div>

      {showReports && (
        <div className="reports-section">
          <h3 className="reports-heading">Lecturer Reports</h3>
          <div className="report-cards-grid">
            {submittedReports.length === 0 ? (
              <p>No reports submitted yet.</p>
            ) : (
              submittedReports.map((report, index) => (
                <div className="report-card" key={index}>
                  <p><strong>Faculty Name:</strong> {report.facultyName}</p>
                  <p><strong>Class Name:</strong> {report.className}</p>
                  <p><strong>Week of Reporting:</strong> {report.weekOfReporting}</p>
                  <p><strong>Date of Lecture:</strong> {report.dateOfLecture}</p>
                  <p><strong>Course Name:</strong> {report.courseName}</p>
                  <p><strong>Course Code:</strong> {report.courseCode}</p>
                  <p><strong>Lecturer Name:</strong> {report.lecturerName}</p>
                  <p><strong>Actual Students Present:</strong> {report.actualStudents}</p>
                  <p><strong>Total Students Registered:</strong> {report.totalRegistered}</p>
                  <p><strong>Venue:</strong> {report.venue}</p>
                  <p><strong>Scheduled Time:</strong> {report.scheduledTime}</p>
                  <p><strong>Topic Taught:</strong> {report.topicTaught}</p>
                  <p><strong>Learning Outcomes:</strong> {report.learningOutcomes}</p>
                  <p><strong>Recommendations:</strong> {report.recommendations}</p>
                  <button
                    className="btn delete-btn"
                    onClick={() => handleDeleteLecturerReport(index)}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showProgramReportForm && (
        <div className="program-report-form">
          <h3>Submit Program Report</h3>
          <input
            type="text"
            name="title"
            placeholder="Report Title"
            value={programReport.title}
            onChange={handleProgramReportChange}
            className="form-control mb-2"
          />
          <textarea
            name="content"
            placeholder="Report Content"
            value={programReport.content}
            onChange={handleProgramReportChange}
            className="form-control mb-2"
          ></textarea>
          <input
            type="date"
            name="date"
            value={programReport.date}
            onChange={handleProgramReportChange}
            className="form-control mb-2"
          />
          <button className="action-btn" onClick={handleSubmitProgramReport}>
            Submit Program Report
          </button>
        </div>
      )}

      {programReports.length > 0 && (
        <div className="reports-section">
          <h3 className="reports-heading">My Program Reports</h3>
          <div className="report-cards-grid">
            {programReports.map((report, index) => (
              <div className="report-card" key={index}>
                {editingIndex === index ? (
                  <>
                    <input
                      type="text"
                      value={editData.title}
                      onChange={(e) =>
                        setEditData({ ...editData, title: e.target.value })
                      }
                      className="form-control mb-2"
                    />
                    <textarea
                      value={editData.content}
                      onChange={(e) =>
                        setEditData({ ...editData, content: e.target.value })
                      }
                      className="form-control mb-2"
                    ></textarea>
                    <input
                      type="date"
                      value={editData.date}
                      onChange={(e) =>
                        setEditData({ ...editData, date: e.target.value })
                      }
                      className="form-control mb-2"
                    />
                    <div className="buttons-row">
                      <button className="btn" onClick={handleSave}>Save</button>
                      <button className="btn" onClick={handleCancel}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p><strong>Title:</strong> {report.title}</p>
                    <p><strong>Content:</strong> {report.content}</p>
                    <p><strong>Date:</strong> {report.date}</p>
                    <button className="btn" onClick={() => handleEdit(index)}>Edit</button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Courses Table */}
      {courses.length > 0 && (
        <div className="reports-section">
          <h3 className="reports-heading">Courses</h3>
          <div className="report-cards-grid">
            <table className="courses-table timetable-table">
              <thead>
                <tr>
                  <th>Course Name</th>
                  <th>Lecturer</th>
                  <th>Class</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Venue</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c, i) => (
                  <tr key={i}>
                    <td>{c.courseName || c.course_name}</td>
                    <td>{c.lecturerName || c.lecturer_name}</td>
                    <td>{c.className || c.class_name}</td>
                    <td>{c.dateOfLecture || c.date_of_lecture}</td>
                    <td>{c.scheduledTime || c.scheduled_time}</td>
                    <td>{c.venue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="principal-back-container">
        <button className="principal-back-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default PrincipalLecture;
