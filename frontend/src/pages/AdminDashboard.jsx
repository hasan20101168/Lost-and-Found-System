import {
  useEffect,
  useState
} from "react";
import ClaimRequestCard from "../components/ClaimRequestCard";
import {
  deleteAdminPost,
  deleteAdminUser,
  getAdminClaims,
  getAdminMetrics,
  getAdminPosts,
  getAdminReports,
  getAdminUsers,
  updateAdminReportStatus
} from "../services/adminService";

const metricLabels = {
  totalUsers: "Total users",
  totalLostItems: "Total lost items",
  totalFoundItems: "Total found items",
  resolvedCases: "Resolved cases",
  pendingClaims: "Pending claims",
  openReports: "Open reports"
};

function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState({
    lostItems: [],
    foundItems: []
  });
  const [claims, setClaims] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] =
    useState(true);

  const loadDashboard = async () => {
    const [
      metricsData,
      usersData,
      postsData,
      claimsData,
      reportsData
    ] = await Promise.all([
      getAdminMetrics(),
      getAdminUsers(),
      getAdminPosts(),
      getAdminClaims(),
      getAdminReports()
    ]);

    setMetrics(metricsData);
    setUsers(usersData);
    setPosts(postsData);
    setClaims(claimsData);
    setReports(reportsData);
  };

  useEffect(() => {
    let isActive = true;

    const fetchDashboard = async () => {
      try {
        await loadDashboard();
      } catch (error) {
        console.error(error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      isActive = false;
    };
  }, []);

  const handleDeleteUser = async (id) => {
    try {
      await deleteAdminUser(id);
      setUsers((currentUsers) =>
        currentUsers.filter((user) => user.id !== id)
      );
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Could not remove user"
      );
    }
  };

  const handleDeletePost = async (type, id) => {
    try {
      await deleteAdminPost(type, id);

      setPosts((currentPosts) => ({
        lostItems:
          type === "lost"
            ? currentPosts.lostItems.filter(
                (item) => item.id !== id
              )
            : currentPosts.lostItems,
        foundItems:
          type === "found"
            ? currentPosts.foundItems.filter(
                (item) => item.id !== id
              )
            : currentPosts.foundItems
      }));
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Could not remove post"
      );
    }
  };

  const handleReportStatus = async (
    id,
    status
  ) => {
    try {
      const updatedReport =
        await updateAdminReportStatus(
          id,
          status
        );

      setReports((currentReports) =>
        currentReports.map((report) =>
          report.id === id
            ? updatedReport
            : report
        )
      );
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Could not update report"
      );
    }
  };

  const handleClaimStatusChange = (updatedClaim) => {
    setClaims((currentClaims) =>
      currentClaims.map((claim) =>
        claim.id === updatedClaim.id
          ? updatedClaim
          : claim.foundItemId ===
                updatedClaim.foundItemId &&
              updatedClaim.status === "ACCEPTED" &&
              claim.status === "PENDING"
            ? {
                ...claim,
                status: "REJECTED"
              }
            : claim
      )
    );
  };

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div className="container admin-container">
      <h1>Admin Dashboard</h1>

      <section className="metric-grid">
        {Object.entries(metricLabels).map(
          ([key, label]) => (
            <div
              className="metric-card"
              key={key}
            >
              <span>{label}</span>
              <strong>
                {metrics?.[key] ?? 0}
              </strong>
            </div>
          )
        )}
      </section>

      <section className="admin-section">
        <h2>Manage Users</h2>

        <div className="admin-list">
          {users.map((user) => (
            <article
              className="admin-row"
              key={user.id}
            >
              <div>
                <strong>{user.name}</strong>
                <p>
                  {user.email} | {user.role}
                </p>
              </div>

              {user.role !== "ADMIN" && (
                <button
                  type="button"
                  className="danger-button"
                  onClick={() =>
                    handleDeleteUser(user.id)
                  }
                >
                  Remove
                </button>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <h2>Remove Fake or Spam Posts</h2>

        {[{
          title: "Lost posts",
          type: "lost",
          items: posts.lostItems
        }, {
          title: "Found posts",
          type: "found",
          items: posts.foundItems
        }].map((group) => (
          <div key={group.type}>
            <h3>{group.title}</h3>

            {group.items.length === 0 ? (
              <p>No posts found.</p>
            ) : (
              group.items.map((item) => (
                <article
                  className="admin-row"
                  key={`${group.type}-${item.id}`}
                >
                  <div>
                    <strong>{item.title}</strong>
                    <p>
                      {item.category} | {item.status}
                    </p>
                    <p>
                      Posted by {item.user?.name}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="danger-button"
                    onClick={() =>
                      handleDeletePost(
                        group.type,
                        item.id
                      )
                    }
                  >
                    Remove Post
                  </button>
                </article>
              ))
            )}
          </div>
        ))}
      </section>

      <section className="admin-section">
        <h2>Moderate Claims</h2>

        {claims.length === 0 ? (
          <p>No claims to review.</p>
        ) : (
          claims.map((claim) => (
            <ClaimRequestCard
              key={claim.id}
              claim={claim}
              canReview
              onStatusChange={handleClaimStatusChange}
            />
          ))
        )}
      </section>

      <section className="admin-section">
        <h2>Monitor Reports</h2>

        {reports.length === 0 ? (
          <p>No reports submitted.</p>
        ) : (
          reports.map((report) => (
            <article
              className="admin-row"
              key={report.id}
            >
              <div>
                <strong>
                  {report.reason}
                </strong>
                <p>
                  {report.itemType} #{report.itemId} |{" "}
                  {report.status}
                </p>
                <p>
                  Reported by {report.reporter.name} (
                  {report.reporter.email})
                </p>
                {report.item && (
                  <p>
                    Item: {report.item.title}
                  </p>
                )}
                {report.details && (
                  <p>{report.details}</p>
                )}
              </div>

              <div className="admin-actions">
                <button
                  type="button"
                  onClick={() =>
                    handleReportStatus(
                      report.id,
                      "REVIEWED"
                    )
                  }
                >
                  Mark Reviewed
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    handleReportStatus(
                      report.id,
                      "DISMISSED"
                    )
                  }
                >
                  Dismiss
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

export default AdminDashboard;
