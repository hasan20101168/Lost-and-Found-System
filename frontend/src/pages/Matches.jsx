import {
  useEffect,
  useState
} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { createConversation } from "../services/conversationService";
import { getMatches } from "../services/matchService";

const formatDate = (date) =>
  new Date(date).toLocaleDateString();

const ItemSummary = ({
  item,
  type
}) => {
  const location =
    type === "lost"
      ? item.location
      : item.foundLocation;
  const date =
    type === "lost"
      ? item.dateLost
      : item.dateFound;

  return (
    <div className="match-item">
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt={item.title}
          className="match-image"
        />
      )}

      <h3>{item.title}</h3>

      <p>
        <strong>Category:</strong> {item.category}
      </p>

      <p>
        <strong>Location:</strong> {location}
      </p>

      <p>
        <strong>Date:</strong> {formatDate(date)}
      </p>

      <p>{item.description}</p>
    </div>
  );
};

const MatchReasons = ({ match }) => {
  const {
    details
  } = match;

  return (
    <div className="match-reasons">
      <span>
        Category: {details.category.score}/30
      </span>
      <span>
        Keywords: {details.keywords.score}/30
      </span>
      <span>
        Location: {details.location.score}/20
      </span>
      <span>
        Date: {details.date.score}/20
      </span>
    </div>
  );
};

function Matches() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minScore, setMinScore] = useState(30);
  const [messageError, setMessageError] =
    useState("");

  useEffect(() => {
    let isActive = true;

    const fetchMatches = async () => {
      try {
        setLoading(true);

        const data = await getMatches({
          minScore
        });

        if (isActive) {
          setMatches(data.matches || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchMatches();

    return () => {
      isActive = false;
    };
  }, [minScore]);

  const handleMessage = async (match) => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const conversation =
        await createConversation({
          lostItemId: match.lostItem.id,
          foundItemId: match.foundItem.id
        });

      navigate(`/messages/${conversation.id}`);
    } catch (error) {
      setMessageError(
        error.response?.data?.message ||
          "Could not start conversation"
      );
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Possible Matches</h1>

        <label className="score-filter">
          Minimum score
          <input
            type="number"
            min="1"
            max="100"
            value={minScore}
            onChange={(event) =>
              setMinScore(event.target.value)
            }
          />
        </label>
      </div>

      {loading ? (
        <h2>Loading...</h2>
      ) : matches.length === 0 ? (
        <p>No possible matches found.</p>
      ) : (
        matches.map((match) => (
          <article
            key={`${match.lostItem.id}-${match.foundItem.id}`}
            className="match-card"
          >
            <div className="match-card-header">
              <div>
                <strong>{match.score}% match</strong>
                <span>{match.confidence} confidence</span>
              </div>

              <div className="match-actions">
                <p>
                  Matched on{" "}
                  {match.matchedOn.join(", ")}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    handleMessage(match)
                  }
                >
                  Message
                </button>
              </div>
            </div>

            {messageError && (
              <p className="claim-message">
                {messageError}
              </p>
            )}

            <MatchReasons match={match} />

            {match.details.keywords.matches.length > 0 && (
              <p className="keyword-list">
                <strong>Shared keywords:</strong>{" "}
                {match.details.keywords.matches.join(", ")}
              </p>
            )}

            {match.details.date.daysApart !== null && (
              <p className="keyword-list">
                <strong>Date proximity:</strong>{" "}
                {match.details.date.daysApart} day(s)
              </p>
            )}

            <div className="match-grid">
              <ItemSummary
                item={match.lostItem}
                type="lost"
              />
              <ItemSummary
                item={match.foundItem}
                type="found"
              />
            </div>
          </article>
        ))
      )}
    </div>
  );
}

export default Matches;
