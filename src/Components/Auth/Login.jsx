import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import newlogo from "../../assets/newlogozirakbook.jpeg";
import right from "../../assets/account.jpg";
import BaseUrl from "../../Api/BaseUrl";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const navigate = useNavigate();

  // All available test users with their credentials
  const allTestUsers = [
    { email: "superadmin@test.com", password: "Test@123456", name: "Super Admin", role: "SUPERADMIN" },
    { email: "companyadmin@test.com", password: "Test@123456", name: "Company Admin", role: "COMPANY_ADMIN" },
    { email: "accountant@testcompany.com", password: "Test@123456", name: "Test Accountant", role: "ACCOUNTANT" },
    { email: "manager@testcompany.com", password: "Test@123456", name: "Test Manager", role: "MANAGER" },
  ];

  // Demo credentials
  const demoCredentials = {
    superadmin: { email: "superadmin@test.com", password: "Test@123456" },
    company: { email: "companyadmin@test.com", password: "Test@123456" }
  };

  const fillDemoCredentials = (type) => {
    setEmail(demoCredentials[type].email);
    setPassword(demoCredentials[type].password);
    toast.info(`Demo ${type} credentials filled!`);
  };

  const autoLogin = async (user) => {
    setEmail(user.email);
    setPassword(user.password);
    setLoading(true);

    try {
      const response = await axios.post(`${BaseUrl}/auth/login`, {
        email: user.email,
        password: user.password,
      });

      const { message, data } = response.data;
      const { user: userData, tokens } = data;
      const { accessToken } = tokens;

      if (accessToken && userData && userData.id) {
        localStorage.setItem("authToken", accessToken);
        localStorage.setItem("CompanyId", userData.id.toString());
        localStorage.setItem("role", userData.role);

        toast.success(`Logged in as ${user.name}!`);

        if (userData.role === "SUPERADMIN") {
          navigate("/dashboard");
        } else {
          navigate("/company/dashboard");
        }
      } else {
        toast.error("Login failed");
      }
    } catch (error) {
      console.error("Auto-login Error:", error);
      toast.error(error.response?.data?.message || "Auto-login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${BaseUrl}/auth/login`, {
        email,
        password,
      });

      // ✅ Fixed response destructuring to match actual API response
      const { message, data } = response.data;
      const { user, tokens } = data; // API returns tokens object
      const { accessToken } = tokens; // Extract accessToken from tokens

      if (accessToken && user && user.id) {
        // Save auth data
        localStorage.setItem("authToken", accessToken);
        localStorage.setItem("CompanyId", user.id.toString()); // Ensure it's a string
        localStorage.setItem("role", user.role);

        toast.success(message || "Login successful!");

        // ✅ Fixed role comparison to match uppercase API response
        if (user.role === "SUPERADMIN") {
          navigate("/dashboard");
        } else {
          navigate("/company/dashboard");
        }
      } else {
        toast.error("Invalid email or password");
      }
    } catch (error) {
      console.error("Login Error:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "#023047" }}
    >
      <div className="min-h-screen flex items-center justify-center px-4 py-8 md:py-16 bg-[#023047]">
        <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-xl flex flex-col md:flex-row">
          <ToastContainer position="top-right" autoClose={2000} />

          {/* Left Panel - Login Form */}
          <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center">
            <div className="mb-6">
              <div className="flex items-center mb-8">
                <img src={newlogo} alt="ZirakBook Logo" className="max-h-12" />
              </div>

              <h6 className="text-xl font-semibold text-gray-800 mb-6">
                Welcome Back
              </h6>

              <div className="border-b border-gray-300 mb-4"></div>

              {/* Quick Login - All Users */}
              <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-blue-800 flex items-center">
                    <i className="fas fa-users mr-2"></i>
                    Quick Login - All Test Users
                  </div>
                  <button
                    onClick={() => setShowAllUsers(!showAllUsers)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {showAllUsers ? "Hide" : "Show All"}
                  </button>
                </div>

                {showAllUsers ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {allTestUsers.map((user, index) => (
                      <div key={index} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-gray-200 hover:border-blue-300 transition">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{user.name}</div>
                          <div className="text-gray-600 text-[10px]">{user.email}</div>
                          <div className={`text-[10px] font-semibold ${
                            user.role === 'SUPERADMIN' ? 'text-purple-600' :
                            user.role === 'COMPANY_ADMIN' ? 'text-blue-600' :
                            user.role === 'ACCOUNTANT' ? 'text-green-600' :
                            'text-orange-600'
                          }`}>
                            {user.role.replace('_', ' ')}
                          </div>
                        </div>
                        <button
                          onClick={() => autoLogin(user)}
                          disabled={loading}
                          className={`ml-2 px-3 py-1 rounded text-xs font-medium transition ${
                            user.role === 'SUPERADMIN' ? 'bg-purple-600 hover:bg-purple-700' :
                            user.role === 'COMPANY_ADMIN' ? 'bg-blue-600 hover:bg-blue-700' :
                            user.role === 'ACCOUNTANT' ? 'bg-green-600 hover:bg-green-700' :
                            'bg-orange-600 hover:bg-orange-700'
                          } text-white disabled:opacity-50`}
                        >
                          {loading ? "..." : "Login"}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-600 text-center py-2">
                    Click "Show All" to see all test users
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Your Email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <input
                  type="password"
                  placeholder="Your Password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <label className="flex items-center text-sm text-gray-600">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded mr-2"
                    checked={keepLoggedIn}
                    onChange={() => setKeepLoggedIn(!keepLoggedIn)}
                  />
                  Keep me logged in
                </label>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full text-white py-3 rounded-lg flex items-center justify-center text-base font-medium"
                  style={{ backgroundColor: "#023047" }}
                >
                  {loading ? "Logging in..." : "Log in"}
                  <i className="fas fa-arrow-right ml-2"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Illustration */}
          <div className="hidden md:flex md:w-1/2 p-6 md:p-10 relative items-center justify-center bg-gray-50">
            <img
              src={right}
              alt="Digital Connection"
              className="max-w-full max-h-full object-contain"
            />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-200 rounded-full -mr-10 -mb-10 opacity-70"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;