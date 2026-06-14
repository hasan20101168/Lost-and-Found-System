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
  date ? new Date(date).toLocaleDateString() : "";

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
    () => [
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

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div className="container dashboard-container">
      <div className="dashboard-header">
        <div>
          <span className="dashboard-kicker">
            User Dashboard
          </span>
          <h1>Welcome, {user?.name}</h1>
          <p>
            Manage your reports, claims,
            notifications, profile, and messages
            from one place.
          </p>
        </div>

        <div className="dashboard-header-actions">
          {user?.role === "ADMIN" && (
            <Link
              to="/admin"
              className="btn"
            >
              Admin Dashboard
            </Link>
          )}

          <Link
            to="/create-lost-item"
            className="btn"
          >
            Report Lost Item
          </Link>

          <Link
            to="/create-found-item"
            className="secondary-button"
          >
            Report Found Item
          </Link>
        </div>
      </div>

      {message && (
        <p className="dashboard-message">
          {message}
        </p>
      )}

      <div className="dashboard-stats">
        <section>
          <span>Total posts</span>
          <strong>{allPosts.length}</strong>
        </section>

        <section>
          <span>Active claims</span>
          <strong>{pendingClaims}</strong>
        </section>

        <section>
          <span>Unread alerts</span>
          <strong>{unreadCount}</strong>
        </section>

        <section>
          <span>Chats</span>
          <strong>{conversations.length}</strong>
        </section>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel dashboard-profile-panel">
          <div className="panel-heading">
            <div>
              <h2>Profile</h2>
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

      <section className="dashboard-panel">
        <div className="panel-heading">
          <div>
            <h2>My Posts</h2>
            <p>
              View, edit, or delete your lost and
              found reports.
            </p>
          </div>

          <div className="panel-links">
            <Link to="/my-items">Lost</Link>
            <Link to="/my-found-items">Found</Link>
          </div>
        </div>

        {allPosts.length === 0 ? (
          <p className="empty-state">
            You have not posted any reports yet.
          </p>
        ) : (
          <div className="dashboard-post-grid">
            {allPosts.map((item) => (
              <article
                key={`${item.dashboardType}-${item.id}`}
                className="dashboard-post-card"
              >
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                  />
                )}

                <div>
                  <span className="dashboard-kicker">
                    {item.dashboardType === "lost"
                      ? "Lost report"
                      : "Found report"}
                  </span>
                  <h3>{item.title}</h3>
                  <p>
                    {item.dashboardType === "lost"
                      ? item.location
                      : item.foundLocation}
                  </p>
                  <p>{item.description}</p>
                </div>

                <div className="dashboard-card-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      openEditor(
                        item.dashboardType,
                        item
                      )
                    }
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="danger-button"
                    onClick={() =>
                      handleDeleteItem(
                        item.dashboardType,
                        item
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {editingItem && (
        <section className="dashboard-panel">
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
                    value={
                      editingItem.values.reward
                    }
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

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <h2>Notifications</h2>
              <p>{unreadCount} unread updates.</p>
            </div>

            <Link to="/notifications">
              View all
            </Link>
          </div>

          {notifications.length === 0 ? (
            <p className="empty-state">
              No notifications yet.
            </p>
          ) : (
            notifications
              .slice(0, 5)
              .map((notification) => (
                <article
                  key={notification.id}
                  className={`dashboard-list-row ${
                    notification.readAt
                      ? ""
                      : "dashboard-unread"
                  }`}
                >
                  <div>
                    <h3>{notification.title}</h3>
                    <p>{notification.message}</p>
                  </div>

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
                        className="secondary-button"
                        onClick={() =>
                          handleNotificationOpen(
                            notification
                          )
                        }
                      >
                        Read
                      </button>
                    )
                  )}
                </article>
              ))
          )}
        </section>

        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <h2>Chat History</h2>
              <p>Recent claim and match chats.</p>
            </div>

            <Link to="/messages">View all</Link>
          </div>

          {conversations.length === 0 ? (
            <p className="empty-state">
              No conversations yet.
            </p>
          ) : (
            conversations
              .slice(0, 5)
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
                    className="dashboard-list-row dashboard-chat-row"
                  >
                    <div>
                      <h3>
                        {other?.name ||
                          "Conversation"}
                      </h3>
                      <p>
                        {conversation.lostItem
                          ?.title ||
                          conversation.foundItem
                            ?.title ||
                          "Claim conversation"}
                      </p>
                    </div>
                    <span>
                      {latest?.body ||
                        "No messages yet"}
                    </span>
                  </Link>
                );
              })
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
