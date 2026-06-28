import { Link } from "react-router-dom";

const recentReports = [
  {
    title: "Brown Leather Wallet",
    location: "Central Station Platform 4",
    time: "2 hours ago",
    status: "Lost",
    action: "Claim",
    image:
      "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80"
  },
  {
    title: "Golden Retriever",
    location: "Riverside Park",
    time: "5 hours ago",
    status: "Found",
    action: "View Details",
    image:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80"
  },
  {
    title: "Mercedes Car Keys",
    location: "Starbucks Downtown",
    time: "Yesterday",
    status: "Found",
    action: "View Details",
    image:
      "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=600&q=80"
  },
  {
    title: "Apple Watch Series 8",
    location: "Fitness First Gym",
    time: "Yesterday",
    status: "Lost",
    action: "Claim",
    image:
      "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?auto=format&fit=crop&w=600&q=80"
  }
];

const steps = [
  {
    icon: "P",
    title: "Report the Item",
    text: "Provide a clear description, photo, and location where the item was lost or found."
  },
  {
    icon: "S",
    title: "Smart Matching",
    text: "FoundIt compares your report with community posts and highlights likely matches."
  },
  {
    icon: "H",
    title: "Safe Handover",
    text: "Connect through the portal and arrange a secure return or collection."
  }
];

const stories = [
  {
    name: "David S., Seattle",
    text:
      "I lost my wedding ring while jogging in the park. I thought it was gone forever, but someone found it and reached out within hours."
  },
  {
    name: "Sarah L., New York",
    text:
      "I found an expensive camera left on a bus. Posting it on FoundIt was easy, and the verification process made the handoff feel secure."
  }
];

function Home() {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-shell">
          <div className="hero-copy">
            <p className="home-kicker">
              Community lost and found
            </p>

            <h1>
              Reconnecting you with
              <span> what matters most.</span>
            </h1>

            <p>
              Lost something valuable? Found an item that belongs to
              someone else? FoundIt is the trusted community hub for
              returning lost items to their rightful owners.
            </p>

            <div className="hero-actions">
              <Link
                className="home-button home-button-primary"
                to="/create-lost-item"
              >
                <span aria-hidden="true">Q</span>
                Report Lost Item
              </Link>

              <Link
                className="home-button home-button-success"
                to="/create-found-item"
              >
                <span aria-hidden="true">+</span>
                Report Found Item
              </Link>
            </div>
          </div>

          <form className="home-search">
            <label>
              <span aria-hidden="true">Q</span>
              <input
                type="search"
                placeholder='Search for items, e.g. "Golden Retriever"'
              />
            </label>

            <select defaultValue="all">
              <option value="all">All Categories</option>
              <option value="electronics">Electronics</option>
              <option value="pets">Pets</option>
              <option value="documents">Documents</option>
              <option value="accessories">Accessories</option>
            </select>

            <label>
              <span aria-hidden="true">O</span>
              <input
                type="text"
                placeholder="Location"
              />
            </label>

            <button type="button">
              Filter
            </button>
          </form>
        </div>
      </section>

      <section className="home-shell home-section">
        <div className="section-heading">
          <div>
            <h2>Recent Reports</h2>
            <p>Items recently reported in your community</p>
          </div>

          <Link to="/lost-items">
            View All
          </Link>
        </div>

        <div className="report-grid">
          {recentReports.map((report) => (
            <article
              className="report-card"
              key={report.title}
            >
              <div className="report-image-wrap">
                <img
                  src={report.image}
                  alt={report.title}
                />
                <span
                  className={`report-badge report-badge-${report.status.toLowerCase()}`}
                >
                  {report.status}
                </span>
              </div>

              <div className="report-body">
                <h3>{report.title}</h3>
                <p>{report.location}</p>
                <div className="report-meta">
                  <span>{report.time}</span>
                  <Link to="/matches">
                    {report.action}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="how-it-works">
        <div className="home-shell">
          <div className="center-heading">
            <h2>How FoundIt Works</h2>
            <p>Reuniting people with their belongings in three simple steps.</p>
          </div>

          <div className="steps-grid">
            {steps.map((step) => (
              <article
                className="step-card"
                key={step.title}
              >
                <div className="step-icon">
                  {step.icon}
                </div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-shell home-section">
        <div className="center-heading">
          <h2>Community Success Stories</h2>
        </div>

        <div className="story-grid">
          {stories.map((story) => (
            <article
              className="story-card"
              key={story.name}
            >
              <div className="story-avatar">
                {story.name.charAt(0)}
              </div>
              <div>
                <p>"{story.text}"</p>
                <strong>- {story.name}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-shell">
        <div className="home-cta">
          <h2>Ready to help your community?</h2>
          <p>
            Join neighbors making local lost and found faster, safer,
            and easier to trust.
          </p>
          <div className="cta-actions">
            <Link
              className="home-button home-button-light"
              to="/register"
            >
              Get Started Today
            </Link>
            <Link
              className="home-button home-button-outline"
              to="/matches"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <div className="home-shell footer-grid">
          <div>
            <Link
              className="footer-brand"
              to="/"
            >
              FoundIt
            </Link>
            <p>
              Making lost items a thing of the past through community
              action and smart technology.
            </p>
          </div>

          <div>
            <h3>Platform</h3>
            <Link to="/lost-items">Search Items</Link>
            <Link to="/create-lost-item">Report Lost</Link>
            <Link to="/create-found-item">Report Found</Link>
            <Link to="/matches">How It Works</Link>
          </div>

          <div>
            <h3>Company</h3>
            <Link to="/register">About Us</Link>
            <Link to="/register">Community Guidelines</Link>
            <Link to="/login">Privacy Policy</Link>
            <Link to="/login">Contact</Link>
          </div>

          <div>
            <h3>Social</h3>
            <div className="social-row">
              <span>f</span>
              <span>in</span>
            </div>
          </div>
        </div>

        <p className="footer-bottom">
          © 2026 FoundIt. All rights reserved. Built for communities worldwide.
        </p>
      </footer>
    </main>
  );
}

export default Home;
