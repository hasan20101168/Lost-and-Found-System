import { Link } from "react-router-dom";

import { useAuth } from "../context/useAuth";

function Navbar() {
  const {
    user,
    logout
  } = useAuth();

  return (
    <nav
      style={{
        padding: "15px",
        display: "flex",
        gap: "15px"
      }}
    >
      <Link to="/">
        Home
      </Link>

      <Link to="/lost-items">
        Lost Items
      </Link>

      {user ? (
      <>
        <Link to="/dashboard">
          Dashboard
        </Link>

        <Link to="/create-lost-item">
          Report Lost Item
        </Link>

        <button onClick={logout}>
          Logout
        </button>
      </>
    ) : (
      <>
        <Link to="/login">
          Login
        </Link>

        <Link to="/register">
          Register
        </Link>
      </>
    )}
    </nav>
  );
}

export default Navbar;
