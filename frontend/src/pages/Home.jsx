import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="container">
      <h1>
        Lost & Found System
      </h1>

      <div className="actions">
        <Link to="/lost-items">
          Browse Lost Items
        </Link>

        <Link to="/found-items">
          Browse Found Items
        </Link>

        <Link to="/matches">
          View Matches
        </Link>
      </div>
    </div>
  );
}

export default Home;
