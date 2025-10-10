import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";

// Pages / Components
import Home from "./pages/Home"; // Landing/overview page
import Login from "./pages/Login";
import Register from "./pages/Register";
import Student from "./pages/Student";
import Lecturer from "./pages/Lecturer";
import PrincipalLecture from "./pages/PrincipalLecture";
import ProgramLeader from "./pages/ProgramLeader";
import LecturerReporting from "./pages/LecturerReporting";

// === Protected Route Wrapper ===
const ProtectedRoute = ({ element: Element, role }) => {
  const userRole = localStorage.getItem("role"); // Get role dynamically

  if (!userRole) {
    // Not logged in → redirect to login
    return <Navigate to="/login" />;
  }

  if (role && role !== userRole) {
    // Wrong role → redirect to correct dashboard
    return <Navigate to={`/${userRole.toLowerCase()}`} />;
  }

  return <Element />;
};

function App() {
  return (
    <Router>
      {/* Header visible on all pages */}
      <Header />

      {/* Main Content Area */}
      <div className="content-wrapper">
        <Routes>
          {/* Default route → show Home page */}
          <Route path="/" element={<Home />} />

          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Role-based protected pages */}
          <Route path="/student" element={<ProtectedRoute element={Student} role="Student" />} />
          <Route path="/lecturer" element={<ProtectedRoute element={Lecturer} role="Lecturer" />} />
          <Route path="/principallecture" element={<ProtectedRoute element={PrincipalLecture} role="PrincipalLecture" />} />
          <Route path="/programleader" element={<ProtectedRoute element={ProgramLeader} role="ProgramLeader" />} />

          {/* Lecturer Reporting Form */}
          <Route path="/lecturer/report" element={<ProtectedRoute element={LecturerReporting} role="Lecturer" />} />

          {/* Catch-all */}
          <Route path="*" element={<h2 className="text-center mt-5">Page Not Found</h2>} />
        </Routes>
      </div>

      {/* Footer visible on all pages */}
      <Footer />
    </Router>
  );
}

export default App;
