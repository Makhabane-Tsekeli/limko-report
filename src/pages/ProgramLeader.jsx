import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ProgramLeader.css";
import jsPDF from "jspdf";

function ProgramLeader() {
  const navigate = useNavigate();
  const [lecturerReports, setLecturerReports] = useState([]);
  const [programReports, setProgramReports] = useState([]);
  const [showReports, setShowReports] = useState(false);

  const [courses, setCourses] = useState([]);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseData, setCourseData] = useState({
    courseName: "",
    lecturerName: "",
    className: "",
    dateOfLecture: "",
    scheduledTime: "",
    venue: "",
  });
  const [editingCourseIndex, setEditingCourseIndex] = useState(null);

  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    loadLecturerReportsFromDB();
    loadCoursesFromDB();
    loadRatingsFromDB();
    const pReports = JSON.parse(localStorage.getItem("programReports")) || [];
    setProgramReports(pReports);
  }, [showReports]);

  const loadLecturerReportsFromDB = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/lecturer-reports');
      if (response.ok) {
        const data = await response.json();
        setLecturerReports(data);
        return;
      }
    } catch (error) {
      console.error('Error loading lecturer reports from DB:', error);
    }
    const reports = JSON.parse(localStorage.getItem("submittedReports")) || [];
    setLecturerReports(reports);
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
    const values = Object.values(ratings).filter((r) => !isNaN(r) && r > 0);
    const avg = values.length
      ? (values.reduce((sum, r) => sum + r, 0) / values.length).toFixed(1)
      : 0;
    setAverageRating(avg);
  };

  useEffect(() => {
    const handleStorageChange = () => {
      setLecturerReports(JSON.parse(localStorage.getItem("submittedReports")) || []);
      setProgramReports(JSON.parse(localStorage.getItem("programReports")) || []);
      setCourses(JSON.parse(localStorage.getItem("courses")) || []);
      const ratings = JSON.parse(localStorage.getItem("ratings")) || {};
      const values = Object.values(ratings).filter((r) => !isNaN(r) && r > 0);
      const avg = values.length
        ? (values.reduce((sum, r) => sum + r, 0) / values.length).toFixed(1)
        : 0;
      setAverageRating(avg);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

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

  // -------------------- DELETE HANDLERS --------------------
  const handleDeleteLecturerReport = async (index) => {
    if (!window.confirm("Are you sure you want to delete this lecturer report?")) return;
    const report = lecturerReports[index];

    try {
      if (report.id) {
        const response = await fetch(`http://localhost:5000/api/lecturer-reports/${report.id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error("Failed to delete from server");
      }
      const updatedReports = lecturerReports.filter((_, i) => i !== index);
      setLecturerReports(updatedReports);
      localStorage.setItem("submittedReports", JSON.stringify(updatedReports));
    } catch (error) {
      console.error("Failed to delete lecturer report:", error);
      const updatedReports = lecturerReports.filter((_, i) => i !== index);
      setLecturerReports(updatedReports);
      localStorage.setItem("submittedReports", JSON.stringify(updatedReports));
    }
  };

  const handleDeleteProgramReport = async (index) => {
    if (!window.confirm("Are you sure you want to delete this program report?")) return;
    const report = programReports[index];

    try {
      if (report.id) {
        const response = await fetch(`http://localhost:5000/api/program-reports/${report.id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error("Failed to delete from server");
      }
      const updatedReports = programReports.filter((_, i) => i !== index);
      setProgramReports(updatedReports);
      localStorage.setItem("programReports", JSON.stringify(updatedReports));
    } catch (error) {
      console.error("Failed to delete program report:", error);
      const updatedReports = programReports.filter((_, i) => i !== index);
      setProgramReports(updatedReports);
      localStorage.setItem("programReports", JSON.stringify(updatedReports));
    }
  };

  // -------------------- COURSE HANDLERS --------------------
  const handleCourseChange = (e) => {
    const { name, value } = e.target;
    setCourseData({ ...courseData, [name]: value });
  };

  const handleAddCourse = async () => {
    // <-- Updated: Make time and venue required
    if (
      !courseData.courseName ||
      !courseData.lecturerName ||
      !courseData.className ||
      !courseData.dateOfLecture ||
      !courseData.scheduledTime ||
      !courseData.venue
    ) {
      alert("Please fill in all required fields including Date, Time, and Venue.");
      return;
    }

    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('http://localhost:5000/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...courseData, courseCode: `CODE${Date.now()}`, createdBy: userId }),
      });

      if (response.ok) {
        const newCourse = await response.json();
        let updatedCourses = [...courses];
        if (editingCourseIndex !== null) updatedCourses[editingCourseIndex] = newCourse;
        else updatedCourses.push(newCourse);
        localStorage.setItem("courses", JSON.stringify(updatedCourses));
        setCourses(updatedCourses);
        handleCancelCourse();
        setShowCourseForm(false);
        return;
      }
    } catch (error) {
      console.error('Error saving course to DB:', error);
    }

    let updatedCourses = [...courses];
    if (editingCourseIndex !== null) updatedCourses[editingCourseIndex] = courseData;
    else updatedCourses.push(courseData);
    localStorage.setItem("courses", JSON.stringify(updatedCourses));
    setCourses(updatedCourses);
    handleCancelCourse();
    setShowCourseForm(false);
  };

  const handleEditCourse = (index) => {
    setEditingCourseIndex(index);
    setCourseData(courses[index]);
    setShowCourseForm(true);
  };

  const handleDeleteCourse = async (index) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;

    const course = courses[index];
    try {
      if (course.id) {
        const response = await fetch(`http://localhost:5000/api/courses/${course.id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error("Failed to delete course from server");
      }
      const updatedCourses = courses.filter((_, i) => i !== index);
      setCourses(updatedCourses);
      localStorage.setItem("courses", JSON.stringify(updatedCourses));
    } catch (error) {
      console.error("Failed to delete course:", error);
      const updatedCourses = courses.filter((_, i) => i !== index);
      setCourses(updatedCourses);
      localStorage.setItem("courses", JSON.stringify(updatedCourses));
    }
  };

  const handleCancelCourse = () => {
    setEditingCourseIndex(null);
    setCourseData({
      courseName: "",
      lecturerName: "",
      className: "",
      dateOfLecture: "",
      scheduledTime: "",
      venue: "",
    });
  };

  const uniqueLecturers = new Set(courses.map(c => c.lecturerName || c.lecturer_name)).size;

  // -------------------- PDF DOWNLOAD --------------------
  const downloadLecturerReport = (report) => {
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(16);
    doc.text("Lecturer Report", 105, y, { align: "center" });
    y += 10;
    for (const [key, value] of Object.entries(report)) {
      doc.setFontSize(12);
      doc.text(`${key}: ${value}`, 10, y);
      y += 8;
      if (y > 280) { doc.addPage(); y = 10; }
    }
    doc.save(`Lecturer_Report_${report.lecturerName || "Unknown"}.pdf`);
  };

  const downloadProgramReport = (report) => {
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(16);
    doc.text("Program Report", 105, y, { align: "center" });
    y += 10;
    for (const [key, value] of Object.entries(report)) {
      doc.setFontSize(12);
      doc.text(`${key}: ${value}`, 10, y);
      y += 8;
      if (y > 280) { doc.addPage(); y = 10; }
    }
    doc.save(`Program_Report_${report.submittedBy || "Unknown"}.pdf`);
  };

  return (
    <div className="leader-container">
      <h2>Program Leader</h2>

      <div className="leader-overview">
        <div className="overview-card">
          <h3>Total Reports</h3>
          <p>{lecturerReports.length + programReports.length}</p>
        </div>
        <div className="overview-card">
          <h3>Total Courses</h3>
          <p>{courses.length}</p>
        </div>
        <div className="overview-card">
          <h3>Lecturers Managed</h3>
          <p>{uniqueLecturers}</p>
        </div>
        <div className="overview-card">
          <h3>Average Rating</h3>
          <p>{averageRating}</p>
        </div>
      </div>

      <div className="leader-actions">
        <button className="action-btn" onClick={() => { loadLecturerReportsFromDB(); setShowReports(!showReports); }}>
          {showReports ? "Hide Reports" : "View All Reports"}
        </button>
      </div>

      {showReports && (
        <div className="reports-list">
          {lecturerReports.length === 0 ? (
            <p>No lecturer reports submitted yet.</p>
          ) : (
            lecturerReports.map((report, index) => (
              <div className="report-card" key={index}>
                {Object.entries(report).map(([key, value]) => (
                  <p key={key}><strong>{key}:</strong> {value}</p>
                ))}
                <button className="btn delete-btn" onClick={() => handleDeleteLecturerReport(index)}>Delete</button>
                <button className="btn action-btn" onClick={() => downloadLecturerReport(report)}>Download PDF</button>
              </div>
            ))
          )}

          {programReports.length === 0 ? (
            <p>No program reports submitted yet.</p>
          ) : (
            programReports.map((report, index) => (
              <div className="report-card" key={index}>
                <p><strong>Title:</strong> {report.title}</p>
                <p><strong>Content:</strong> {report.content}</p>
                <p><strong>Date:</strong> {report.date}</p>
                <p><strong>Submitted By:</strong> {report.submittedBy}</p>
                <button className="btn delete-btn" onClick={() => handleDeleteProgramReport(index)}>Delete</button>
                <button className="btn action-btn" onClick={() => downloadProgramReport(report)}>Download PDF</button>
              </div>
            ))
          )}
        </div>
      )}

      <div className="courses-section">
        <button className="action-btn" onClick={() => setShowCourseForm(!showCourseForm)}>
          {showCourseForm ? "Cancel Course" : "Add Course"}
        </button>

        {showCourseForm && (
          <div className="course-form">
            <input type="text" name="courseName" placeholder="Course Name" value={courseData.courseName} onChange={handleCourseChange} />
            <input type="text" name="lecturerName" placeholder="Lecturer Name" value={courseData.lecturerName} onChange={handleCourseChange} />
            <input type="text" name="className" placeholder="Class Name" value={courseData.className} onChange={handleCourseChange} />
            <input type="date" name="dateOfLecture" value={courseData.dateOfLecture} onChange={handleCourseChange} />
            <input type="time" name="scheduledTime" value={courseData.scheduledTime} onChange={handleCourseChange} />
            <input type="text" name="venue" placeholder="Venue" value={courseData.venue} onChange={handleCourseChange} />
            <button className="action-btn" onClick={handleAddCourse}>
              {editingCourseIndex !== null ? "Update Course" : "Add Course"}
            </button>
          </div>
        )}

        {courses.length > 0 && (
          <table className="courses-table timetable-table">
            <thead>
              <tr>
                <th>Course Name</th>
                <th>Lecturer</th>
                <th>Class</th>
                <th>Date</th>
                <th>Time</th>
                <th>Venue</th>
                <th>Actions</th>
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
                  <td>
                    <button className="btn" onClick={() => handleEditCourse(i)}>Edit</button>
                    <button className="btn delete-btn" onClick={() => handleDeleteCourse(i)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="leader-back-container">
        <button className="leader-back-btn" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}

export default ProgramLeader;
