import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

import LostItems from "./pages/LostItems";
import FoundItems from "./pages/FoundItems";
import Matches from "./pages/Matches";

import CreateLostItem from "./pages/CreateLostItem";
import CreateFoundItem from "./pages/CreateFoundItem";
import MyItems from "./pages/MyItems";
import MyFoundItems from "./pages/MyFoundItems";
import MyClaims from "./pages/MyClaims";
import ReviewClaims from "./pages/ReviewClaims";

import Navbar from "./components/Navbar";

import ProtectedRoute from "./routes/ProtectedRoute";

import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/lost-items"
          element={<LostItems />}
        />

        <Route
          path="/found-items"
          element={<FoundItems />}
        />

        <Route
          path="/matches"
          element={<Matches />}
        />

        <Route
          path="/create-lost-item"
          element={
            <ProtectedRoute>
              <CreateLostItem />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-found-item"
          element={
            <ProtectedRoute>
              <CreateFoundItem />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-items"
          element={
            <ProtectedRoute>
              <MyItems />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-found-items"
          element={
            <ProtectedRoute>
              <MyFoundItems />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-claims"
          element={
            <ProtectedRoute>
              <MyClaims />
            </ProtectedRoute>
          }
        />

        <Route
          path="/review-claims"
          element={
            <ProtectedRoute>
              <ReviewClaims />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
