import {
  useEffect,
  useMemo,
  useState
} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { createClaimRequest } from "../services/claimRequestService";
import { createConversation } from "../services/conversationService";
import { getMatches } from "../services/matchService";

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    : "Date unavailable";

const formatRelative = (date) => {
  if (!date) {
    return "recently";
  }

  const timestamp = new Date(date).getTime();

  if (Number.isNaN(timestamp)) {
    return "recently";
  }

  const difference = Date.now() - timestamp;
  const day = 24 * 60 * 60 * 1000;
  const days = Math.floor(difference / day);

  if (days <= 0) {
    return "today";
  }

  if (days === 1) {
    return "yesterday";
  }

  if (days < 7) {
    return `${days} days ago`;
  }

  return formatDate(date);
};

const getScoreTone = (score) => {
  if (score >= 90) {
    return "excellent";
  }

  if (score >= 75) {
    return "strong";
  }

  return "possible";
};

const getItemLocation = (item, type) =>
  type === "lost" ? item.location : item.foundLocation;

const getItemDate = (item, type) =>
  type === "lost" ? item.dateLost : item.dateFound;

const ItemSummary = ({
  item,
  type
}) => {
  const location = getItemLocation(item, type);
  const date = getItemDate(item, type);
  const attributes = [
    item.color,
    item.brand,
    item.storageLocation
  ].filter(Boolean);

  return (
    <aside className="match-report-card">
      <div className="match-report-kicker">
        <span>Your reported item</span>
        <strong>{type === "lost" ? "Lost" : "Found"}</strong>
      </div>

      <div className="match-report-media">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
          />
        ) : (
          <div className="match-image-placeholder">
            {item.category?.charAt(0) || "I"}
          </div>
        )}
      </div>

      <h2>{item.title}</h2>
      <p className="match-report-date">
        Reported {formatRelative(item.createdAt || date)}
      </p>

      <div className="match-report-facts">
        <div>
          <span>Category</span>
          <strong>{item.category}</strong>
        </div>
        <div>
          <span>Location</span>
          <strong>{location}</strong>
        </div>
      </div>

      {attributes.length > 0 && (
        <div className="match-attribute-list">
          <span>Key attributes</span>
          <div>
            {attributes.map((attribute) => (
              <strong key={attribute}>
                {attribute}
              </strong>
            ))}
          </div>
        </div>
      )}
    </aside>
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

const MatchMeta = ({
  label,
  value
}) => (
  <span className="match-meta-item">
    <span aria-hidden="true" />
    {label}: {value}
  </span>
);

function Matches() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minScore, setMinScore] = useState(30);
  const [messageError, setMessageError] = useState("");
  const [selectedLostItemId, setSelectedLostItemId] =
    useState("");
  const [openDetails, setOpenDetails] = useState({});
  const [openClaim, setOpenClaim] = useState({});
  const [claimProofs, setClaimProofs] = useState({});
  const [claimMessages, setClaimMessages] =
    useState({});
  const [submittingClaims, setSubmittingClaims] =
    useState({});
  const [showFilterPanel, setShowFilterPanel] =
    useState(false);

  useEffect(() => {
    let isActive = true;

    const fetchMatches = async () => {
      try {
        setLoading(true);

        const data = await getMatches({
          minScore
        });

        if (isActive) {
          const nextMatches = data.matches || [];
          setMatches(nextMatches);
          setSelectedLostItemId((currentId) => {
            if (
              currentId &&
              nextMatches.some(
                (match) =>
                  String(match.lostItem.id) ===
                  String(currentId)
              )
            ) {
              return currentId;
            }

            return nextMatches[0]?.lostItem.id || "";
          });
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

  const lostItems = useMemo(() => {
    const uniqueItems = new Map();

    matches.forEach((match) => {
      uniqueItems.set(match.lostItem.id, match.lostItem);
    });

    return Array.from(uniqueItems.values());
  }, [matches]);

  const selectedLostItem =
    lostItems.find(
      (item) =>
        String(item.id) === String(selectedLostItemId)
    ) || lostItems[0];

  const visibleMatches = selectedLostItem
    ? matches.filter(
        (match) =>
          String(match.lostItem.id) ===
          String(selectedLostItem.id)
      )
    : matches;

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

  const toggleDetails = (matchKey) => {
    setOpenDetails((current) => ({
      ...current,
      [matchKey]: !current[matchKey]
    }));
  };

  const toggleClaim = (matchKey) => {
    setOpenClaim((current) => ({
      ...current,
      [matchKey]: !current[matchKey]
    }));
  };

  const handleClaimSubmit = async (event, match, matchKey) => {
    event.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    setSubmittingClaims((current) => ({
      ...current,
      [matchKey]: true
    }));
    setClaimMessages((current) => ({
      ...current,
      [matchKey]: ""
    }));

    try {
      await createClaimRequest({
        foundItemId: match.foundItem.id,
        proofOfOwnership: claimProofs[matchKey]
      });

      setClaimProofs((current) => ({
        ...current,
        [matchKey]: ""
      }));
      setOpenClaim((current) => ({
        ...current,
        [matchKey]: false
      }));
      setClaimMessages((current) => ({
        ...current,
        [matchKey]: "Claim request submitted."
      }));
    } catch (error) {
      setClaimMessages((current) => ({
        ...current,
        [matchKey]:
          error.response?.data?.message ||
          "Could not submit claim"
      }));
    } finally {
      setSubmittingClaims((current) => ({
        ...current,
        [matchKey]: false
      }));
    }
  };

  return (
    <main className="matches-page">
      <section className="matches-shell">
        <div className="matches-hero">
          <div>
            <h1>Item Matching</h1>
            <p>
              We scanned found-item reports that closely match
              your lost report. Review the strongest
              possibilities below.
            </p>
          </div>

          <label className="matches-score-filter">
            <span>Minimum score</span>
            <input
              type="range"
              min="1"
              max="100"
              value={minScore}
              onChange={(event) =>
                setMinScore(event.target.value)
              }
            />
            <strong>{minScore}%</strong>
          </label>
        </div>

      {loading ? (
        <div className="matches-loading">
          <span />
          <h2>Loading matches...</h2>
        </div>
      ) : matches.length === 0 ? (
        <div className="matches-empty">
          <h2>No possible matches found</h2>
          <p>
            Try lowering the minimum score or check back when
            new found-item reports are added.
          </p>
        </div>
      ) : (
        <div className="matches-layout">
          <div className="matches-sidebar">
            {lostItems.length > 1 && (
              <label className="matches-lost-picker">
                <span>Choose report</span>
                <select
                  value={selectedLostItem?.id || ""}
                  onChange={(event) =>
                    setSelectedLostItemId(
                      event.target.value
                    )
                  }
                >
                  {lostItems.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.title}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {selectedLostItem && (
              <ItemSummary
                item={selectedLostItem}
                type="lost"
              />
            )}
          </div>

          <section className="matches-results">
            <div className="matches-results-header">
              <div>
                <h2>Suggested Found Items</h2>
                <span>
                  {visibleMatches.length}{" "}
                  {visibleMatches.length === 1
                    ? "Potential"
                    : "Potential"}
                </span>
              </div>

              <button
                type="button"
                className="matches-filter-button"
                aria-label="Filter matches"
                onClick={() =>
                  setShowFilterPanel(
                    (current) => !current
                  )
                }
              >
                <span />
              </button>
            </div>

            {showFilterPanel && (
              <label className="matches-inline-filter">
                <span>Minimum score</span>
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
            )}

            {messageError && (
              <p className="matches-message matches-message-error">
                {messageError}
              </p>
            )}

            {visibleMatches.map((match) => {
              const matchKey = `${match.lostItem.id}-${match.foundItem.id}`;
              const foundItem = match.foundItem;
              const scoreTone = getScoreTone(match.score);

              return (
                <article
                  key={matchKey}
                  className="match-card"
                >
                  <div className="match-card-main">
                    <div className="match-found-media">
                      {foundItem.imageUrl ? (
                        <img
                          src={foundItem.imageUrl}
                          alt={foundItem.title}
                        />
                      ) : (
                        <div className="match-image-placeholder">
                          {foundItem.category?.charAt(0) ||
                            "F"}
                        </div>
                      )}
                    </div>

                    <div className="match-card-copy">
                      <div className="match-title-row">
                        <h3>{foundItem.title}</h3>
                        <strong
                          className={`match-score-pill match-score-${scoreTone}`}
                        >
                          {match.score}% Match
                        </strong>
                      </div>

                      <p className="match-description">
                        {foundItem.description}
                      </p>

                      <div className="match-meta-row">
                        <MatchMeta
                          label="Category"
                          value={foundItem.category}
                        />
                        <MatchMeta
                          label="Location"
                          value={foundItem.foundLocation}
                        />
                        <MatchMeta
                          label="Found"
                          value={formatDate(
                            foundItem.dateFound
                          )}
                        />
                      </div>

                      <div className="match-actions">
                        <button
                          type="button"
                          onClick={() =>
                            toggleClaim(matchKey)
                          }
                        >
                          Start Claim
                        </button>
                        <button
                          type="button"
                          className="match-outline-button"
                          onClick={() =>
                            toggleDetails(matchKey)
                          }
                        >
                          View Details
                        </button>
                        <button
                          type="button"
                          className="match-icon-button"
                          aria-label="Message finder"
                          onClick={() =>
                            handleMessage(match)
                          }
                        >
                          @
                        </button>
                      </div>
                    </div>
                  </div>

                  {openClaim[matchKey] && (
                    <form
                      className="match-claim-form"
                      onSubmit={(event) =>
                        handleClaimSubmit(
                          event,
                          match,
                          matchKey
                        )
                      }
                    >
                      <label>
                        <span>Proof of ownership</span>
                        <textarea
                          rows="3"
                          value={
                            claimProofs[matchKey] || ""
                          }
                          onChange={(event) =>
                            setClaimProofs(
                              (current) => ({
                                ...current,
                                [matchKey]:
                                  event.target.value
                              })
                            )
                          }
                          placeholder="Describe a detail only the owner would know."
                          required
                        />
                      </label>

                      <div>
                        <button
                          type="submit"
                          disabled={
                            submittingClaims[matchKey]
                          }
                        >
                          {submittingClaims[matchKey]
                            ? "Submitting..."
                            : "Send Claim"}
                        </button>
                        <button
                          type="button"
                          className="match-outline-button"
                          onClick={() =>
                            toggleClaim(matchKey)
                          }
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {claimMessages[matchKey] && (
                    <p className="matches-message">
                      {claimMessages[matchKey]}
                    </p>
                  )}

                  {openDetails[matchKey] && (
                    <div className="match-detail-panel">
                      <MatchReasons match={match} />

                      <p>
                        <strong>Confidence:</strong>{" "}
                        {match.confidence}
                      </p>
                      <p>
                        <strong>Matched on:</strong>{" "}
                        {match.matchedOn.join(", ")}
                      </p>

                      {match.details.keywords.matches
                        .length > 0 && (
                        <p>
                          <strong>Shared keywords:</strong>{" "}
                          {match.details.keywords.matches.join(
                            ", "
                          )}
                        </p>
                      )}

                      {match.details.date.daysApart !==
                        null && (
                        <p>
                          <strong>Date proximity:</strong>{" "}
                          {match.details.date.daysApart}{" "}
                          day(s)
                        </p>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        </div>
      )}
      </section>
    </main>
  );
}

export default Matches;
