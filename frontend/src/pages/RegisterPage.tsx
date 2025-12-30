import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

import { useRoles } from "../hooks/useRoles";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [selectedRoleId, setSelectedRoleId] = useState<number | "">("");
  const { roles, loading: rolesLoading, error: rolesError } = useRoles();

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await register(username, password, Number(selectedRoleId));
      // After successful registration, user is auto-logged in via AuthContext
      navigate("/dashboard");
    } catch (err) {
      console.log("Registration error:", err);
      setError("Registration failed. Username may already exist.");
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
          <h2 className="text-center text-2xl font-semibold mb-6">REGISTER</h2>

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
              placeholder="Sundye Eyee"
              required
            />
          </div>

          <div className="mb-4">
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
              placeholder="••••••••••••"
              required
            />
          </div>

          <div className="mb-6">
            <label
              className="block text-gray-600 text-xs font-medium mb-2 uppercase"
              htmlFor="role"
            >
              Role
            </label>
            {rolesLoading && (
              <div className="text-xs text-gray-500">Loading roles…</div>
            )}

            {rolesError && (
              <div className="text-xs text-red-600">Failed to load roles</div>
            )}
            <select
              id="role"
              value={selectedRoleId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedRoleId(val ? Number(val) : "");
              }}
              className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-purple-400 outline-none transition-colors"
            >
              <option value="">Select a role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-300 hover:bg-purple-400 text-gray-800 font-medium py-3 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "REGISTERING..." : "REGISTER"}
          </button>

          <div className="text-center mt-4">
            <a
              href="/login"
              className="text-sm text-gray-600 hover:text-purple-600 underline"
            >
              Already have an account? Login here!
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
