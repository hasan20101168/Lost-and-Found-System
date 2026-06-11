import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

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
          to="/create-found-item"
          className="btn"
        >
          Report Found Item
        </Link> <br />

        <Link
          to="/lost-items"
          className="btn"
        >
          Browse Lost Items
        </Link> <br />

        <Link
          to="/found-items"
          className="btn"
        >
          Browse Found Items
        </Link> <br />

        <Link
          to="/matches"
          className="btn"
        >
          View Matches
        </Link> <br />

        <Link
          to="/my-items"
          className="btn"
        >
          My Lost Items
        </Link> <br />

        <Link
          to="/my-found-items"
          className="btn"
        >
          My Found Items
        </Link> <br />

        <Link
          to="/my-claims"
          className="btn"
        >
          My Claim Requests
        </Link> <br />

        <Link
          to="/review-claims"
          className="btn"
        >
          Review Claim Requests
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;
