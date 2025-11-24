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
    { email: "superadmin@test.com", password: "Test@123456", name: "Super Admin", role: "SUPERADMIN", company: "Platform" },
    { email: "companyadmin@test.com", password: "Test@123456", name: "Company Admin", role: "COMPANY_ADMIN", company: "TechVision Inc" },
    { email: "accountant@testcompany.com", password: "Test@123456", name: "Accountant", role: "ACCOUNTANT", company: "TechVision Inc" },
    { email: "manager@testcompany.com", password: "Test@123456", name: "Manager", role: "MANAGER", company: "TechVision Inc" },
    { email: "sales@testcompany.com", password: "Test@123456", name: "Sales User", role: "SALES_USER", company: "TechVision Inc" },
    { email: "admin@globalretail.com", password: "Test@123456", name: "Retail Admin", role: "COMPANY_ADMIN", company: "Global Retail Co" },
    { email: "accountant@globalretail.com", password: "Test@123456", name: "Retail Accountant", role: "ACCOUNTANT", company: "Global Retail Co" },
    { email: "admin@mfgsolutions.com", password: "Test@123456", name: "Manufacturing Admin", role: "COMPANY_ADMIN", company: "Manufacturing Solutions" },
    { email: "accountant@mfgsolutions.com", password: "Test@123456", name: "Manufacturing Accountant", role: "ACCOUNTANT", company: "Manufacturing Solutions" },
  ];

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard!`);
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

              {/* Demo Credentials Display */}
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-blue-900 flex items-center">
                    <i className="fas fa-key mr-2"></i>
                    Demo Login Credentials
                  </div>
                  <button
                    onClick={() => setShowAllUsers(!showAllUsers)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {showAllUsers ? "Hide" : "Show All"}
                  </button>
                </div>

                <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  <i className="fas fa-info-circle mr-1"></i>
                  All passwords: <strong>Test@123456</strong>
                </div>

                {showAllUsers ? (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {allTestUsers.map((user, index) => (
                      <div key={index} className="bg-white p-3 rounded border border-gray-200 hover:border-blue-300 transition">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 text-sm">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.company}</div>
                            <div className={`text-xs font-semibold mt-1 ${
                              user.role === 'SUPERADMIN' ? 'text-purple-600' :
                              user.role === 'COMPANY_ADMIN' ? 'text-blue-600' :
                              user.role === 'ACCOUNTANT' ? 'text-green-600' :
                              user.role === 'MANAGER' ? 'text-orange-600' :
                              'text-pink-600'
                            }`}>
                              {user.role.replace('_', ' ')}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] text-gray-500 font-medium">Email</div>
                              <div className="text-xs text-gray-800 truncate font-mono">{user.email}</div>
                            </div>
                            <button
                              onClick={() => copyToClipboard(user.email, 'Email')}
                              className="ml-2 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs transition"
                              title="Copy email"
                            >
                              <i className="fas fa-copy"></i>
                            </button>
                          </div>

                          <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <div className="flex-1">
                              <div className="text-[10px] text-gray-500 font-medium">Password</div>
                              <div className="text-xs text-gray-800 font-mono">{user.password}</div>
                            </div>
                            <button
                              onClick={() => copyToClipboard(user.password, 'Password')}
                              className="ml-2 px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs transition"
                              title="Copy password"
                            >
                              <i className="fas fa-copy"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-600 text-center py-3 bg-white rounded border border-dashed border-gray-300">
                    <i className="fas fa-arrow-up mr-1"></i>
                    Click "Show All" to see all {allTestUsers.length} demo users
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