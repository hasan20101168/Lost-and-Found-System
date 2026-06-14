import {
  useEffect,
  useState
} from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useSocket } from "../context/useSocket";
import { getConversations } from "../services/conversationService";

const getOtherParticipant = (
  conversation,
  userId
) =>
  conversation.ownerId === userId
    ? conversation.finder
    : conversation.owner;

function Messages() {
  const { user } = useAuth();
  const socket = useSocket();
  const [conversations, setConversations] =
    useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadConversations = async () => {
      try {
        const data =
          await getConversations();

        if (isActive) {
          setConversations(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadConversations();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const handleMessage = (message) => {
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id ===
          message.conversationId
            ? {
                ...conversation,
                messages: [message],
                updatedAt: message.createdAt
              }
            : conversation
        )
      );
    };

    socket.on("message:new", handleMessage);

    return () => {
      socket.off("message:new", handleMessage);
    };
  }, [socket]);

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div className="container">
      <h1>Messages</h1>

      {conversations.length === 0 ? (
        <p>No conversations yet.</p>
      ) : (
        conversations.map((conversation) => {
          const other = getOtherParticipant(
            conversation,
            user.id
          );
          const latest =
            conversation.messages?.[0];

          return (
            <Link
              key={conversation.id}
              to={`/messages/${conversation.id}`}
              className="conversation-card"
            >
              <div>
                <h3>{other?.name}</h3>
                <p>
                  {conversation.lostItem?.title ||
                    "Claim conversation"}{" "}
                  {conversation.foundItem
                    ? `and ${conversation.foundItem.title}`
                    : ""}
                </p>
              </div>

              <span>
                {latest
                  ? latest.body
                  : "No messages yet"}
              </span>
            </Link>
          );
        })
      )}
    </div>
  );
}

export default Messages;
