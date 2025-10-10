import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Form.css";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    role: "",
    username: "",
    email: "",
    password: "",
    fullName: "",
    phoneNumber: "",
    department: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      alert("Registration successful! Please login.");
      navigate("/login");
    } catch (error) {
      console.error('Registration error:', error);
      alert(error.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="form-container">
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <label>Role</label>
        <select 
          name="role" 
          value={formData.role}
          onChange={handleChange}
          required
        >
          <option value="">Select Role</option>
          <option value="Student">Student</option>
          <option value="Lecturer">Lecturer</option>
          <option value="PrincipalLecture">Principal Lecturer</option>
          <option value="ProgramLeader">Program Leader</option>
        </select>

        <label>Full Name</label>
        <input 
          type="text" 
          name="fullName"
          placeholder="Enter your full name" 
          value={formData.fullName}
          onChange={handleChange}
          required 
        />

        <label>Username</label>
        <input 
          type="text" 
          name="username"
          placeholder="Choose a username" 
          value={formData.username}
          onChange={handleChange}
          required 
        />

        <label>Email</label>
        <input 
          type="email" 
          name="email"
          placeholder="Enter your email" 
          value={formData.email}
          onChange={handleChange}
          required 
        />

        <label>Phone Number</label>
        <input 
          type="tel" 
          name="phoneNumber"
          placeholder="Enter your phone number" 
          value={formData.phoneNumber}
          onChange={handleChange}
        />

        <label>Department/Faculty</label>
        <input 
          type="text" 
          name="department"
          placeholder="Enter your department" 
          value={formData.department}
          onChange={handleChange}
        />

        <label>Password</label>
        <input 
          type="password" 
          name="password"
          placeholder="Enter your password" 
          value={formData.password}
          onChange={handleChange}
          required 
        />

        {/* Register Button */}
        <button type="submit" className="form-btn">Register</button>

        {/* Back Button aligned to right */}
        <div className="form-back-container">
          <button 
            type="button"
            className="form-btn-back"
            onClick={() => navigate("/")}
          >
            Back
          </button>
        </div>
      </form>
    </div>
  );
}

export default Register;