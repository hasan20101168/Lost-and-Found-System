import {
  Link,
  NavLink
} from "react-router-dom";

import { useAuth } from "../context/useAuth";

function Navbar() {
  const {
    user,
    logout
  } = useAuth();

  return (
    <header className="site-header">
      <nav className="site-nav">
        <Link
          className="site-brand"
          to="/"
        >
          FoundIt
        </Link>

        <div className="site-nav-links">
          <NavLink to="/">
            Dashboard
          </NavLink>

          <NavLink to="/lost-items">
            Search
          </NavLink>

          <NavLink to="/matches">
            Matches
          </NavLink>

          <NavLink to="/found-items">
            Found
          </NavLink>
        </div>

        <div className="site-nav-actions">
          {user ? (
            <>
              <NavLink to="/dashboard">
                My Dashboard
              </NavLink>

              {user.role === "ADMIN" && (
                <NavLink to="/admin">
                  Admin
                </NavLink>
              )}

              <NavLink to="/notifications">
                Alerts
              </NavLink>

              <NavLink to="/messages">
                Messages
              </NavLink>

              <button
                type="button"
                onClick={logout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">
                Login
              </NavLink>

              <NavLink
                className="site-nav-pill"
                to="/register"
              >
                Register
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
