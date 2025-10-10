import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Form.css";

function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!role) {
      alert("Please select a role!");
      return;
    }

    try {
      // Database authentication
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      // Store user info in localStorage
      localStorage.setItem("role", role);
      localStorage.setItem("username", data.user.username);
      localStorage.setItem("userId", data.user.id);

      // Redirect to dashboard based on role
      switch (role) {
        case "Student":
          navigate("/student");
          break;
        case "Lecturer":
          navigate("/lecturer");
          break;
        case "PrincipalLecture":
          navigate("/principallecture");
          break;
        case "ProgramLeader":
          navigate("/programleader");
          break;
        default:
          navigate("/login");
      }
    } catch (error) {
      console.error('Login error:', error);
      alert("Invalid username, password, or role.");
    }
  };

  return (
    <div className="form-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <label>Role</label>
        <select
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
        >
          <option value="">Select Role</option>
          <option value="Student">Student</option>
          <option value="Lecturer">Lecturer</option>
          <option value="PrincipalLecture">Principal Lecturer</option>
          <option value="ProgramLeader">Program Leader</option>
        </select>

        <label>Username</label>
        <input 
          type="text" 
          placeholder="Enter your username" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required 
        />

        <label>Password</label>
        <input 
          type="password" 
          placeholder="Enter your password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required 
        />

        {/* Login Button */}
        <button type="submit" className="form-btn">Login</button>

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

export default Login;