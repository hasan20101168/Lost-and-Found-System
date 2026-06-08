import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="container">
      <h1>
        Lost & Found System
      </h1>

      <Link to="/lost-items">
        Browse Lost Items
      </Link>
    </div>
  );
}

export default Home;