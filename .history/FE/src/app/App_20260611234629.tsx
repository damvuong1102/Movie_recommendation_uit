//src/app/App.tsx
import {
  HashRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Home from "../pages/Home";
import MovieDetail from "../pages/MovieDetail";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ProtectedRoute from "../routes/ProtectedRoute";

export default function App() {
  return (
    <HashRouter basename="/recommend_movies_website">

      <Routes>

        {/* default route */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* protected home */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* protected movie detail */}
        <Route
          path="/movie/:id"
          element={
            <ProtectedRoute>
              <MovieDetail />
            </ProtectedRoute>
          }
        />

      </Routes>

    </HashRouter>
  );
}