import {
  useEffect,
  useMemo,
  useState
} from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useSocket } from "../context/useSocket";
import {
  deleteFoundItem,
  getMyFoundItems,
  updateFoundItem
} from "../services/foundItemService";
import {
  deleteLostItem,
  getMyLostItems,
  updateLostItem
} from "../services/lostItemService";
import { getMyClaimRequests } from "../services/claimRequestService";
import {
  getNotifications,
  markNotificationRead
} from "../services/notificationService";
import { getConversations } from "../services/conversationService";

const itemStatuses = [
  "LOST",
  "FOUND",
  "CLAIMED",
  "RESOLVED"
];

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    : "";

const formatStatus = (status = "") =>
  status
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join(" ");

const formatRelative = (date) => {
  if (!date) {
    return "recently";
  }

  const timestamp = new Date(date).getTime();

  if (Number.isNaN(timestamp)) {
    return "recently";
  }

  const difference = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = minute * 60;
  const day = hour * 24;

  if (difference < minute) {
    return "just now";
  }

  if (difference < hour) {
    const minutes = Math.floor(difference / minute);
    return `${minutes} ${
      minutes === 1 ? "minute" : "minutes"
    } ago`;
  }

  if (difference < day) {
    const hours = Math.floor(difference / hour);
    return `${hours} ${
      hours === 1 ? "hour" : "hours"
    } ago`;
  }

  const days = Math.floor(difference / day);

  if (days === 1) {
    return "Yesterday";
  }

  if (days < 7) {
    return `${days} days ago`;
  }

  return formatDate(date);
};

const toDateInputValue = (date) =>
  date ? new Date(date).toISOString().slice(0, 10) : "";

const getOtherParticipant = (
  conversation,
  userId
) =>
  conversation.ownerId === userId
    ? conversation.finder
    : conversation.owner;

const buildLostForm = (item) => ({
  title: item.title || "",
  description: item.description || "",
  category: item.category || "",
  location: item.location || "",
  dateLost: toDateInputValue(item.dateLost),
  reward: item.reward ?? "",
  status: item.status || "LOST"
});

const buildFoundForm = (item) => ({
  title: item.title || "",
  description: item.description || "",
  category: item.category || "",
  foundLocation: item.foundLocation || "",
  dateFound: toDateInputValue(item.dateFound),
  storageLocation: item.storageLocation || "",
  contactInfo: item.contactInfo || "",
  status: item.status || "FOUND"
});

function Dashboard() {
  const {
    user,
    updateProfile
  } = useAuth();
  const socket = useSocket();
  const [lostItems, setLostItems] =
    useState([]);
  const [foundItems, setFoundItems] =
    useState([]);
  const [claims, setClaims] = useState([]);
  const [notifications, setNotifications] =
    useState([]);
  const [conversations, setConversations] =
    useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [profileForm, setProfileForm] =
    useState({
      name: user?.name || "",
      email: user?.email || ""
    });
  const [editingItem, setEditingItem] =
    useState(null);
  const [dashboardSearch, setDashboardSearch] =
    useState("");

  useEffect(() => {
    let isActive = true;

    const loadDashboard = async () => {
      try {
        const [
          lostData,
          foundData,
          claimData,
          notificationData,
          conversationData
        ] = await Promise.all([
          getMyLostItems(),
          getMyFoundItems(),
          getMyClaimRequests(),
          getNotifications(),
          getConversations()
        ]);

        if (isActive) {
          setLostItems(lostData);
          setFoundItems(foundData);
          setClaims(claimData);
          setNotifications(notificationData);
          setConversations(conversationData);
        }
      } catch (error) {
        setMessage(
          error.response?.data?.message ||
            "Could not load dashboard"
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const handleNotification = (
      notification
    ) => {
      setNotifications((current) => [
        notification,
        ...current
      ]);
    };

    const handleMessage = (newMessage) => {
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id ===
          newMessage.conversationId
            ? {
                ...conversation,
                messages: [newMessage],
                updatedAt: newMessage.createdAt
              }
            : conversation
        )
      );
    };

    socket.on(
      "notification:new",
      handleNotification
    );
    socket.on("message:new", handleMessage);

    return () => {
      socket.off(
        "notification:new",
        handleNotification
      );
      socket.off("message:new", handleMessage);
    };
  }, [socket]);

  const allPosts = useMemo(
    () =>
      [
        ...lostItems.map((item) => ({
          ...item,
          dashboardType: "lost"
        })),
        ...foundItems.map((item) => ({
          ...item,
          dashboardType: "found"
        }))
      ].sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      ),
    [lostItems, foundItems]
  );

  const unreadCount = notifications.filter(
    (notification) => !notification.readAt
  ).length;

  const pendingClaims = claims.filter(
    (claim) => claim.status === "PENDING"
  ).length;

  const filteredPosts = allPosts.filter((item) => {
    const searchValue = dashboardSearch
      .trim()
      .toLowerCase();

    if (!searchValue) {
      return true;
    }

    return [
      item.title,
      item.description,
      item.category,
      item.location,
      item.foundLocation
    ]
      .filter(Boolean)
      .some((value) =>
        value.toLowerCase().includes(searchValue)
      );
  });

  const openEditor = (type, item) => {
    setMessage("");
    setEditingItem({
      type,
      id: item.id,
      values:
        type === "lost"
          ? buildLostForm(item)
          : buildFoundForm(item)
    });
  };

  const updateEditingValue = (
    field,
    value
  ) => {
    setEditingItem((current) => ({
      ...current,
      values: {
        ...current.values,
        [field]: value
      }
    }));
  };

  const handleProfileSubmit = async (
    event
  ) => {
    event.preventDefault();
    setMessage("");

    try {
      const updatedUser =
        await updateProfile(profileForm);

      setProfileForm({
        name: updatedUser.name || "",
        email: updatedUser.email || ""
      });

      setMessage("Profile updated.");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Could not update profile"
      );
    }
  };

  const handleItemSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      if (editingItem.type === "lost") {
        const updatedItem =
          await updateLostItem(
            editingItem.id,
            editingItem.values
          );

        setLostItems((current) =>
          current.map((item) =>
            item.id === updatedItem.id
              ? updatedItem
              : item
          )
        );
      } else {
        const updatedItem =
          await updateFoundItem(
            editingItem.id,
            editingItem.values
          );

        setFoundItems((current) =>
          current.map((item) =>
            item.id === updatedItem.id
              ? updatedItem
              : item
          )
        );
      }

      setEditingItem(null);
      setMessage("Report updated.");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Could not update report"
      );
    }
  };

  const handleNotificationOpen = async (
    notification
  ) => {
    if (notification.readAt) {
      return;
    }

    await markNotificationRead(
      notification.id
    );

    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id
          ? {
              ...item,
              readAt: new Date().toISOString()
            }
          : item
      )
    );
  };

  const handleDeleteItem = async (
    type,
    item
  ) => {
    const confirmed = window.confirm(
      `Delete "${item.title}"? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setMessage("");

    try {
      if (type === "lost") {
        await deleteLostItem(item.id);
        setLostItems((current) =>
          current.filter(
            (lostItem) => lostItem.id !== item.id
          )
        );
      } else {
        await deleteFoundItem(item.id);
        setFoundItems((current) =>
          current.filter(
            (foundItem) => foundItem.id !== item.id
          )
        );
      }

      setMessage("Report deleted.");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Could not delete report"
      );
    }
  };

  if (loading) {
    return (
      <main className="dashboard-app">
        <div className="search-loading">
          <span />
          <h1>Loading dashboard...</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-app">
      <aside className="dashboard-side-nav">
        <div className="dashboard-side-brand">
          <Link to="/">FoundIt</Link>
          <span>Lost & Found Portal</span>
        </div>

        <nav>
          <Link to="/dashboard" className="active">
            <span aria-hidden="true">D</span>
            Dashboard
          </Link>
          <Link to="/my-items">
            <span aria-hidden="true">R</span>
            My Reports
          </Link>
          <Link to="/lost-items">
            <span aria-hidden="true">S</span>
            Search
          </Link>
          <Link to="/messages">
            <span aria-hidden="true">M</span>
            Messages
          </Link>
          <Link to="/matches">
            <span aria-hidden="true">X</span>
            Matches
          </Link>
        </nav>

        <div className="dashboard-side-footer">
          <a href="#profile-settings">
            <span aria-hidden="true">G</span>
            Settings
          </a>
          <Link to="/messages">
            <span aria-hidden="true">?</span>
            Help
          </Link>
        </div>
      </aside>

      <section className="dashboard-workspace">
        <header className="dashboard-topbar">
          <h1>Dashboard</h1>

          <div className="dashboard-top-actions">
            <label className="dashboard-search">
              <span aria-hidden="true">Q</span>
              <input
                type="search"
                placeholder="Search your items..."
                value={dashboardSearch}
                onChange={(event) =>
                  setDashboardSearch(
                    event.target.value
                  )
                }
              />
            </label>

            <Link
              to="/notifications"
              className="dashboard-alert-icon"
              aria-label="Notifications"
            >
              !
              {unreadCount > 0 && <span />}
            </Link>

            <div className="dashboard-user-chip">
              <span>
                {user?.name?.charAt(0)?.toUpperCase() ||
                  "U"}
              </span>
            </div>
          </div>
        </header>

        <div className="dashboard-content-grid">
          <section className="dashboard-main-column">
            {message && (
              <p className="dashboard-message">
                {message}
              </p>
            )}

            <div className="dashboard-section-heading">
              <h2>Quick Stats</h2>
            </div>

            <div className="dashboard-stat-row">
              <section>
                <span>Active Reports</span>
                <strong>
                  {String(allPosts.length).padStart(2, "0")}
                </strong>
                <small>
                  {lostItems.length} lost,{" "}
                  {foundItems.length} found
                </small>
              </section>

              <section>
                <span>Pending Claims</span>
                <strong>
                  {String(pendingClaims).padStart(2, "0")}
                </strong>
                <small>Requires action</small>
              </section>

              <section>
                <span>New Messages</span>
                <strong>
                  {String(conversations.length).padStart(
                    2,
                    "0"
                  )}
                </strong>
                <small>{unreadCount} unread alerts</small>
              </section>
            </div>

            <div className="dashboard-active-heading">
              <h2>My Active Reports</h2>
              <div>
                {user?.role === "ADMIN" && (
                  <Link to="/admin">Admin</Link>
                )}
                <Link to="/create-lost-item">
                  <span aria-hidden="true">+</span>
                  Report New Item
                </Link>
              </div>
            </div>

            {filteredPosts.length === 0 ? (
              <div className="dashboard-empty-card">
                <h3>No reports found</h3>
                <p>
                  Create a lost or found report, or adjust your
                  dashboard search.
                </p>
                <Link to="/create-lost-item">
                  Report Lost Item
                </Link>
              </div>
            ) : (
              <div className="dashboard-report-list">
                {filteredPosts.map((item) => (
                  <article
                    key={`${item.dashboardType}-${item.id}`}
                    className="dashboard-report-row"
                  >
                    <div className="dashboard-report-media">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                        />
                      ) : (
                        <span>
                          {item.category?.charAt(0) ||
                            item.title?.charAt(0) ||
                            "I"}
                        </span>
                      )}
                    </div>

                    <div className="dashboard-report-copy">
                      <h3>{item.title}</h3>
                      <p>
                        {item.dashboardType === "lost"
                          ? "Lost"
                          : "Found"}{" "}
                        at{" "}
                        {item.dashboardType === "lost"
                          ? item.location
                          : item.foundLocation}{" "}
                        -{" "}
                        {formatDate(
                          item.dashboardType === "lost"
                            ? item.dateLost
                            : item.dateFound
                        )}
                      </p>
                    </div>

                    <div className="dashboard-report-status">
                      <span
                        className={`dashboard-report-pill dashboard-report-pill-${item.status?.toLowerCase()}`}
                      >
                        {formatStatus(item.status)}
                      </span>
                      <Link
                        to={
                          item.dashboardType === "lost"
                            ? "/matches"
                            : "/review-claims"
                        }
                      >
                        {item.dashboardType === "lost"
                          ? "View Matches"
                          : "Verify Owner"}
                      </Link>
                    </div>

                    <div className="dashboard-report-tools">
                      <button
                        type="button"
                        className="dashboard-edit-icon"
                        aria-label={`Edit ${item.title}`}
                        onClick={() =>
                          openEditor(
                            item.dashboardType,
                            item
                          )
                        }
                      >
                        E
                      </button>
                      <button
                        type="button"
                        className="dashboard-delete-icon"
                        aria-label={`Delete ${item.title}`}
                        onClick={() =>
                          handleDeleteItem(
                            item.dashboardType,
                            item
                          )
                        }
                      >
                        D
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {editingItem && (
              <section className="dashboard-panel dashboard-editor-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Edit Report</h2>
                    <p>
                      Update the details shown to other
                      users.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setEditingItem(null)}
                  >
                    Cancel
                  </button>
                </div>

                <form
                  className="dashboard-form dashboard-edit-form"
                  onSubmit={handleItemSubmit}
                >
                  <label>
                    Title
                    <input
                      value={editingItem.values.title}
                      onChange={(event) =>
                        updateEditingValue(
                          "title",
                          event.target.value
                        )
                      }
                      required
                    />
                  </label>

                  <label>
                    Category
                    <input
                      value={editingItem.values.category}
                      onChange={(event) =>
                        updateEditingValue(
                          "category",
                          event.target.value
                        )
                      }
                      required
                    />
                  </label>

                  {editingItem.type === "lost" ? (
                    <>
                      <label>
                        Location
                        <input
                          value={
                            editingItem.values.location
                          }
                          onChange={(event) =>
                            updateEditingValue(
                              "location",
                              event.target.value
                            )
                          }
                          required
                        />
                      </label>

                      <label>
                        Date lost
                        <input
                          type="date"
                          value={
                            editingItem.values.dateLost
                          }
                          onChange={(event) =>
                            updateEditingValue(
                              "dateLost",
                              event.target.value
                            )
                          }
                          required
                        />
                      </label>

                      <label>
                        Reward
                        <input
                          type="number"
                          min="0"
                          value={editingItem.values.reward}
                          onChange={(event) =>
                            updateEditingValue(
                              "reward",
                              event.target.value
                            )
                          }
                        />
                      </label>
                    </>
                  ) : (
                    <>
                      <label>
                        Found location
                        <input
                          value={
                            editingItem.values
                              .foundLocation
                          }
                          onChange={(event) =>
                            updateEditingValue(
                              "foundLocation",
                              event.target.value
                            )
                          }
                          required
                        />
                      </label>

                      <label>
                        Date found
                        <input
                          type="date"
                          value={
                            editingItem.values.dateFound
                          }
                          onChange={(event) =>
                            updateEditingValue(
                              "dateFound",
                              event.target.value
                            )
                          }
                          required
                        />
                      </label>

                      <label>
                        Storage location
                        <input
                          value={
                            editingItem.values
                              .storageLocation
                          }
                          onChange={(event) =>
                            updateEditingValue(
                              "storageLocation",
                              event.target.value
                            )
                          }
                          required
                        />
                      </label>

                      <label>
                        Contact info
                        <input
                          value={
                            editingItem.values.contactInfo
                          }
                          onChange={(event) =>
                            updateEditingValue(
                              "contactInfo",
                              event.target.value
                            )
                          }
                          required
                        />
                      </label>
                    </>
                  )}

                  <label>
                    Status
                    <select
                      value={editingItem.values.status}
                      onChange={(event) =>
                        updateEditingValue(
                          "status",
                          event.target.value
                        )
                      }
                    >
                      {itemStatuses.map((status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="dashboard-wide-field">
                    Description
                    <textarea
                      value={
                        editingItem.values.description
                      }
                      onChange={(event) =>
                        updateEditingValue(
                          "description",
                          event.target.value
                        )
                      }
                      rows="4"
                      required
                    />
                  </label>

                  <button type="submit">
                    Save Report
                  </button>
                </form>
              </section>
            )}

            <div className="dashboard-lower-grid">
              <section
                id="profile-settings"
                className="dashboard-panel dashboard-profile-panel"
              >
                <div className="panel-heading">
                  <div>
                    <h2>Profile Settings</h2>
                    <p>Manage account details.</p>
                  </div>
                </div>

                <form
                  className="dashboard-form"
                  onSubmit={handleProfileSubmit}
                >
                  <label>
                    Name
                    <input
                      value={profileForm.name}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          name: event.target.value
                        }))
                      }
                      required
                    />
                  </label>

                  <label>
                    Email
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          email: event.target.value
                        }))
                      }
                      required
                    />
                  </label>

                  <button type="submit">
                    Save Profile
                  </button>
                </form>
              </section>

              <section className="dashboard-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Claims</h2>
                    <p>Track submitted claim requests.</p>
                  </div>

                  <Link to="/my-claims">View all</Link>
                </div>

                {claims.length === 0 ? (
                  <p className="empty-state">
                    No claims submitted yet.
                  </p>
                ) : (
                  claims.slice(0, 4).map((claim) => (
                    <article
                      key={claim.id}
                      className="dashboard-list-row"
                    >
                      <div>
                        <h3>
                          {claim.foundItem?.title ||
                            "Found item"}
                        </h3>
                        <p>
                          Submitted{" "}
                          {formatDate(claim.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`status-pill status-${claim.status.toLowerCase()}`}
                      >
                        {claim.status}
                      </span>
                    </article>
                  ))
                )}
              </section>
            </div>
          </section>

          <aside className="dashboard-notification-panel">
            <h2>Notifications</h2>

            {notifications.length === 0 ? (
              <p className="empty-state">
                No notifications yet.
              </p>
            ) : (
              <div className="dashboard-activity-list">
                {notifications
                  .slice(0, 5)
                  .map((notification, index) => (
                    <article
                      key={notification.id}
                      className="dashboard-activity-item"
                    >
                      <span
                        className={`dashboard-activity-icon dashboard-activity-icon-${index % 4}`}
                        aria-hidden="true"
                      >
                        {index === 0
                          ? "M"
                          : index === 1
                            ? "C"
                            : index === 2
                              ? "V"
                              : "+"}
                      </span>
                      <div>
                        <h3>{notification.title}</h3>
                        <p>{notification.message}</p>
                        <small>
                          {formatRelative(
                            notification.createdAt
                          )}
                        </small>

                        {notification.link ? (
                          <Link
                            to={notification.link}
                            onClick={() =>
                              handleNotificationOpen(
                                notification
                              )
                            }
                          >
                            Open
                          </Link>
                        ) : (
                          !notification.readAt && (
                            <button
                              type="button"
                              onClick={() =>
                                handleNotificationOpen(
                                  notification
                                )
                              }
                            >
                              Mark read
                            </button>
                          )
                        )}
                      </div>
                    </article>
                  ))}
              </div>
            )}

            <Link
              to="/notifications"
              className="dashboard-view-all"
            >
              View all activity
            </Link>
          </aside>
        </div>

        <section className="dashboard-chat-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent Messages</h2>
              <p>Recent claim and match chats.</p>
            </div>

            <Link to="/messages">View all</Link>
          </div>

          {conversations.length === 0 ? (
            <p className="empty-state">
              No conversations yet.
            </p>
          ) : (
            <div className="dashboard-chat-grid">
              {conversations
                .slice(0, 4)
                .map((conversation) => {
                  const other =
                    getOtherParticipant(
                      conversation,
                      user.id
                    );
                  const latest =
                    conversation.messages?.[0];

                  return (
                    <Link
                      key={conversation.id}
                      to={`/messages/${conversation.id}`}
                      className="dashboard-chat-card"
                    >
                      <strong>
                        {other?.name || "Conversation"}
                      </strong>
                      <p>
                        {conversation.lostItem?.title ||
                          conversation.foundItem?.title ||
                          "Claim conversation"}
                      </p>
                      <span>
                        {latest?.body ||
                          "No messages yet"}
                      </span>
                    </Link>
                  );
                })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default Dashboard;
