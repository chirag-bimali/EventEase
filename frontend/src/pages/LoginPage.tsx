import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(username, password);
      navigate("/dashboard");
    } catch (err) {
      console.log("Login error:", err);
      setError("Invalid username or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
        >
          <h2 className="text-center text-2xl font-semibold mb-6">LOGIN</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label
              className="block text-gray-600 text-xs font-medium mb-2 uppercase"
              htmlFor="username"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-purple-400 outline-none transition-colors"
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="mb-6">
            <label
              className="block text-gray-600 text-xs font-medium mb-2 uppercase"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-purple-400 outline-none transition-colors"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-300 hover:bg-purple-400 text-gray-800 font-medium py-3 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "LOGGING IN..." : "LOGIN"}
          </button>

          <div className="text-center mt-4">
            <a
              href="/register"
              className="text-sm text-gray-600 hover:text-purple-600 underline"
            >
              Don't have an account? Register here!
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
