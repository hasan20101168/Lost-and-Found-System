import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

import LostItems from "./pages/LostItems";

import CreateLostItem from "./pages/CreateLostItem";

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
          path="/create-lost-item"
          element={
            <ProtectedRoute>
              <CreateLostItem />
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