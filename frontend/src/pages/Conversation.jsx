import {
  useEffect,
  useRef,
  useState
} from "react";
import {
  useParams
} from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useSocket } from "../context/useSocket";
import { getMessages } from "../services/conversationService";

function Conversation() {
  const { id } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    let isActive = true;

    const loadMessages = async () => {
      try {
        const data = await getMessages(id);

        if (isActive) {
          setMessages(data);
        }
      } catch (loadError) {
        setError(
          loadError.response?.data?.message ||
            "Unable to load messages"
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadMessages();

    return () => {
      isActive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    socket.emit(
      "conversation:join",
      Number(id)
    );

    const handleMessage = (message) => {
      if (
        message.conversationId !== Number(id)
      ) {
        return;
      }

      setMessages((current) => {
        if (
          current.some(
            (item) => item.id === message.id
          )
        ) {
          return current;
        }

        return [...current, message];
      });
    };

    socket.on("message:new", handleMessage);

    return () => {
      socket.off("message:new", handleMessage);
    };
  }, [id, socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedBody = body.trim();

    if (!trimmedBody || !socket) {
      return;
    }

    socket.emit(
      "message:send",
      {
        conversationId: Number(id),
        body: trimmedBody
      },
      (response) => {
        if (!response?.ok) {
          setError(
            response?.message ||
              "Unable to send message"
          );
          return;
        }

        setBody("");
        setError("");
      }
    );
  };

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div className="container chat-container">
      <h1>Conversation</h1>

      {error && (
        <p className="claim-message">{error}</p>
      )}

      <div className="message-list">
        {messages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message-bubble ${
                message.senderId === user.id
                  ? "message-own"
                  : ""
              }`}
            >
              <strong>
                {message.sender?.name}
              </strong>
              <p>{message.body}</p>
              <span>
                {new Date(
                  message.createdAt
                ).toLocaleString()}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="message-form"
        onSubmit={handleSubmit}
      >
        <textarea
          value={body}
          onChange={(event) =>
            setBody(event.target.value)
          }
          placeholder="Write a message"
          rows="3"
        />
        <button type="submit">
          Send
        </button>
      </form>
    </div>
  );
}

export default Conversation;
