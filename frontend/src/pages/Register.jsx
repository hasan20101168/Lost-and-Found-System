import { useState } from "react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/useAuth";

function Register() {
  const navigate = useNavigate();

  const { register } =
    useAuth();

  const [formData, setFormData] =
    useState({
      name: "",
      email: "",
      password: ""
    });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]:
        e.target.value
    }));
  };

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    try {
      await register(
        formData.name,
        formData.email,
        formData.password
      );

      navigate("/dashboard");
    } catch (error) {
      alert(
        error.response?.data
          ?.message ||
          "Registration failed"
      );
    }
  };

  return (
    <div className="container">
      <h1>Register</h1>

      <form
        className="form"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          name="name"
          placeholder="Name"
          onChange={handleChange}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
        />

        <button type="submit">
          Register
        </button>
      </form>
    </div>
  );
}

export default Register;
