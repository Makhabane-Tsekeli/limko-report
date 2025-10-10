import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LecturerReporting.css";

const LecturerReporting = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    facultyName: "",
    className: "",
    weekOfReporting: "",
    dateOfLecture: "",
    courseName: "",
    courseCode: "",
    lecturerName: "",
    actualStudents: "",
    totalRegistered: "",
    venue: "",
    scheduledTime: "",
    topicTaught: "",
    learningOutcomes: "",
    recommendations: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const userId = localStorage.getItem('userId');

      const response = await fetch('http://localhost:5000/api/lecturer-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          submittedBy: userId
        }),
      });

      if (response.ok) {
        const savedReport = await response.json();

        // Map DB response to match Lecturer.js keys
        const mappedReport = {
          id: savedReport.id || Date.now(),
          facultyName: savedReport.faculty_name || savedReport.facultyName,
          className: savedReport.class_name || savedReport.className,
          weekOfReporting: savedReport.week_of_reporting || savedReport.weekOfReporting,
          dateOfLecture: savedReport.date_of_lecture || savedReport.dateOfLecture,
          courseName: savedReport.course_name || savedReport.courseName,
          courseCode: savedReport.course_code || savedReport.courseCode,
          lecturerName: savedReport.lecturer_name || savedReport.lecturerName,
          actualStudents: savedReport.actual_students_present || savedReport.actualStudents,
          totalRegistered: savedReport.total_registered_students || savedReport.totalRegistered,
          venue: savedReport.venue,
          scheduledTime: savedReport.scheduled_time || savedReport.scheduledTime,
          topicTaught: savedReport.topic_taught || savedReport.topicTaught,
          learningOutcomes: savedReport.learning_outcomes || savedReport.learningOutcomes,
          recommendations: savedReport.recommendations,
        };

        // Update localStorage for all roles
        const lecturerReports = JSON.parse(localStorage.getItem("lecturerReports")) || [];
        lecturerReports.push(mappedReport);
        localStorage.setItem("lecturerReports", JSON.stringify(lecturerReports));

        const principalReports = JSON.parse(localStorage.getItem("principalReports")) || [];
        principalReports.push(mappedReport);
        localStorage.setItem("principalReports", JSON.stringify(principalReports));

        const programReports = JSON.parse(localStorage.getItem("programLeaderReports")) || [];
        programReports.push(mappedReport);
        localStorage.setItem("programLeaderReports", JSON.stringify(programReports));

        alert("Report submitted successfully!");
        navigate("/lecturer");
      } else {
        throw new Error('Failed to save to database');
      }
    } catch (error) {
      console.error('Error saving to database:', error);

      // Fallback to localStorage only
      const mappedReport = {
        id: Date.now(),
        ...formData
      };

      const lecturerReports = JSON.parse(localStorage.getItem("lecturerReports")) || [];
      lecturerReports.push(mappedReport);
      localStorage.setItem("lecturerReports", JSON.stringify(lecturerReports));

      const principalReports = JSON.parse(localStorage.getItem("principalReports")) || [];
      principalReports.push(mappedReport);
      localStorage.setItem("principalReports", JSON.stringify(principalReports));

      const programReports = JSON.parse(localStorage.getItem("programLeaderReports")) || [];
      programReports.push(mappedReport);
      localStorage.setItem("programLeaderReports", JSON.stringify(programReports));

      alert("Report submitted successfully!");
      navigate("/lecturer");
    }
  };

  return (
    <div className="report-container">
      <h2 className="page-title">Lecturer Reporting Form</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="facultyName" placeholder="Faculty Name" value={formData.facultyName} onChange={handleChange} className="form-control mb-2" required />
        <input type="text" name="className" placeholder="Class Name" value={formData.className} onChange={handleChange} className="form-control mb-2" required />
        <input type="week" name="weekOfReporting" value={formData.weekOfReporting} onChange={handleChange} className="form-control mb-2" required />
        <input type="date" name="dateOfLecture" value={formData.dateOfLecture} onChange={handleChange} className="form-control mb-2" required />
        <input type="text" name="courseName" placeholder="Course Name" value={formData.courseName} onChange={handleChange} className="form-control mb-2" required />
        <input type="text" name="courseCode" placeholder="Course Code" value={formData.courseCode} onChange={handleChange} className="form-control mb-2" required />
        <input type="text" name="lecturerName" placeholder="Lecturer Name" value={formData.lecturerName} onChange={handleChange} className="form-control mb-2" required />
        <input type="number" name="actualStudents" placeholder="Actual Number of Students Present" value={formData.actualStudents} onChange={handleChange} className="form-control mb-2" required />
        <input type="number" name="totalRegistered" placeholder="Total Number of Registered Students" value={formData.totalRegistered} onChange={handleChange} className="form-control mb-2" required />
        <input type="text" name="venue" placeholder="Venue of the Class" value={formData.venue} onChange={handleChange} className="form-control mb-2" required />
        <input type="time" name="scheduledTime" value={formData.scheduledTime} onChange={handleChange} className="form-control mb-2" required />
        <input type="text" name="topicTaught" placeholder="Topic Taught" value={formData.topicTaught} onChange={handleChange} className="form-control mb-2" required />
        <textarea name="learningOutcomes" placeholder="Learning Outcomes of the Topic" value={formData.learningOutcomes} onChange={handleChange} className="form-control mb-2" required></textarea>
        <textarea name="recommendations" placeholder="Lecturer’s Recommendations" value={formData.recommendations} onChange={handleChange} className="form-control mb-2" required></textarea>

        <div className="buttons-row">
          <button type="submit" className="btn">Submit Report</button>
          <button type="button" className="btn" onClick={() => navigate("/lecturer")}>
            Back 
          </button>
        </div>
      </form>
    </div>
  );
};

export default LecturerReporting;
