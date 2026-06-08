import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="container">
      <h1>Dashboard</h1>

      <h3>Welcome, {user?.name}</h3>

      <div className="dashboard-actions">
        <Link
          to="/create-lost-item"
          className="btn"
        >
          Report Lost Item
        </Link> <br />

        <Link
          to="/lost-items"
          className="btn"
        >
          Browse Lost Items
        </Link> <br />

        <Link
          to="/my-items"
          className="btn"
        >
          My Lost Items
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;