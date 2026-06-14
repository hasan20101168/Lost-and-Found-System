import {
  useEffect,
  useState
} from "react";
import { Link } from "react-router-dom";
import { useSocket } from "../context/useSocket";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "../services/notificationService";

const formatDate = (date) =>
  new Date(date).toLocaleString();

function Notifications() {
  const socket = useSocket();
  const [notifications, setNotifications] =
    useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadNotifications = async () => {
      try {
        const data =
          await getNotifications();

        if (isActive) {
          setNotifications(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadNotifications();

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

    socket.on(
      "notification:new",
      handleNotification
    );

    return () => {
      socket.off(
        "notification:new",
        handleNotification
      );
    };
  }, [socket]);

  const unreadCount = notifications.filter(
    (notification) => !notification.readAt
  ).length;

  const handleRead = async (notification) => {
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

  const handleReadAll = async () => {
    await markAllNotificationsRead();

    const readAt = new Date().toISOString();

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        readAt:
          notification.readAt || readAt
      }))
    );
  };

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>{unreadCount} unread</p>
        </div>

        {unreadCount > 0 && (
          <button
            className="secondary-button"
            onClick={handleReadAll}
          >
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        notifications.map((notification) => (
          <article
            key={notification.id}
            className={`notification-card ${
              notification.readAt
                ? ""
                : "notification-unread"
            }`}
          >
            <div>
              <h3>{notification.title}</h3>
              <p>{notification.message}</p>
              <span>
                {formatDate(
                  notification.createdAt
                )}
              </span>
            </div>

            <div className="notification-actions">
              {notification.link && (
                <Link
                  to={notification.link}
                  onClick={() =>
                    handleRead(notification)
                  }
                >
                  Open
                </Link>
              )}

              {!notification.readAt && (
                <button
                  onClick={() =>
                    handleRead(notification)
                  }
                >
                  Mark read
                </button>
              )}
            </div>
          </article>
        ))
      )}
    </div>
  );
}

export default Notifications;
