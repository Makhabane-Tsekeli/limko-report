import React, { useState, useEffect } from "react";
import "../styles/Home.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileAlt, faStar, faChalkboardTeacher, faUserGraduate } from "@fortawesome/free-solid-svg-icons";

function Home() {
  const [overviewData, setOverviewData] = useState({
    totalReports: 0,
    averageRating: 0,
    totalLecturers: 0,
    totalStudents: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/dashboard-stats');
      if (response.ok) {
        const data = await response.json();
        setOverviewData({
          totalReports: data.totalReports,
          averageRating: data.averageRating,
          totalLecturers: data.totalLecturers,
          totalStudents: data.totalStudents
        });
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to static data
      setOverviewData({
        totalReports: 128,
        averageRating: 4.5,
        totalLecturers: 12,
        totalStudents: 450
      });
    }
  };

  return (
    <div className="home-container">
      <h2 className="page-title">Welcome - LUCT Reports </h2>
      <p className="page-subtitle">Overview of reports, ratings, and more</p>

      {/* Overview Cards - Same as before */}
      <div className="overview-cards">
        <div className="card">
          <FontAwesomeIcon icon={faFileAlt} size="2x" className="card-icon" />
          <h3>Total Reports</h3>
          <p>{overviewData.totalReports}</p>
        </div>
        <div className="card">
          <FontAwesomeIcon icon={faStar} size="2x" className="card-icon" />
          <h3>Average Rating</h3>
          <p>{overviewData.averageRating} / 5</p>
        </div>
        <div className="card">
          <FontAwesomeIcon icon={faChalkboardTeacher} size="2x" className="card-icon" />
          <h3>Total Lecturers</h3>
          <p>{overviewData.totalLecturers}</p>
        </div>
        <div className="card">
          <FontAwesomeIcon icon={faUserGraduate} size="2x" className="card-icon" />
          <h3>Total Students</h3>
          <p>{overviewData.totalStudents}</p>
        </div>
      </div>
    </div>
  );
}

export default Home;