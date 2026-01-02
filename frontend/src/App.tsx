import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/auth.provider";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import { EventsPage } from "./pages/EventPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { POSPage } from "./pages/POSPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <EventsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:id"
            element={
              <ProtectedRoute>
                <EventDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets"
            element={
              <ProtectedRoute>
                <div>Tickets Page</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pos"
            element={
              <ProtectedRoute>
                <POSPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/validator"
            element={
              <ProtectedRoute>
                <div>Validator Page</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales"
            element={
              <ProtectedRoute>
                <div>Sales Page</div>
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
