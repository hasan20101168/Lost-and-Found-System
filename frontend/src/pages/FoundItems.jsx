import {
  useEffect,
  useMemo,
  useState
} from "react";
import { Link } from "react-router-dom";
import {
  getFoundItemFilters,
  getFoundItems
} from "../services/foundItemService";
import { useAuth } from "../context/useAuth";
import { createClaimRequest } from "../services/claimRequestService";
import { createReport } from "../services/reportService";

const defaultFilters = {
  keyword: "",
  category: "",
  location: "",
  date: "",
  status: "",
  sort: "latest"
};

const defaultOptions = {
  categories: [],
  locations: [],
  statuses: []
};

function FoundItems() {
  const {
    user
  } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(defaultFilters);
  const [draftFilters, setDraftFilters] =
    useState(defaultFilters);
  const [filterOptions, setFilterOptions] =
    useState(defaultOptions);
  const [openClaimForms, setOpenClaimForms] =
    useState({});
  const [claimProofs, setClaimProofs] = useState({});
  const [claimMessages, setClaimMessages] =
    useState({});
  const [reportMessages, setReportMessages] =
    useState({});
  const [submittingClaims, setSubmittingClaims] =
    useState({});

  const activeFilterCount = useMemo(
    () =>
      Object.entries(filters).filter(
        ([key, value]) =>
          key !== "sort" && value?.trim()
      ).length,
    [filters]
  );

  useEffect(() => {
    let isActive = true;

    const fetchItems = async () => {
      setFetching(true);
      setError("");

      try {
        const data = await getFoundItems(filters);

        if (isActive) {
          setItems(data);
        }
      } catch (error) {
        console.error(error);
        if (isActive) {
          setError(
            error.response?.data?.message ||
              "Could not load found items."
          );
        }
      } finally {
        if (isActive) {
          setLoading(false);
          setFetching(false);
        }
      }
    };

    fetchItems();

    return () => {
      isActive = false;
    };
  }, [filters]);

  useEffect(() => {
    let isActive = true;

    const fetchFilters = async () => {
      try {
        const data = await getFoundItemFilters();

        if (isActive) {
          setFilterOptions(data);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchFilters();

    return () => {
      isActive = false;
    };
  }, []);

  const handleDraftChange = (event) => {
    setDraftFilters({
      ...draftFilters,
      [event.target.name]: event.target.value
    });
  };

  const handleCategoryChange = (category) => {
    setDraftFilters({
      ...draftFilters,
      category:
        draftFilters.category === category
          ? ""
          : category
    });
  };

  const handleStatusChange = (status) => {
    setDraftFilters({
      ...draftFilters,
      status
    });
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setFilters(draftFilters);
  };

  const resetFilters = () => {
    setDraftFilters(defaultFilters);
    setFilters(defaultFilters);
  };

  const toggleClaimForm = (itemId) => {
    setOpenClaimForms((current) => ({
      ...current,
      [itemId]: !current[itemId]
    }));
  };

  const handleClaimSubmit = async (event, item) => {
    event.preventDefault();

    setSubmittingClaims((current) => ({
      ...current,
      [item.id]: true
    }));
    setClaimMessages((current) => ({
      ...current,
      [item.id]: ""
    }));

    try {
      await createClaimRequest({
        foundItemId: item.id,
        proofOfOwnership: claimProofs[item.id]
      });

      setClaimProofs((current) => ({
        ...current,
        [item.id]: ""
      }));
      setOpenClaimForms((current) => ({
        ...current,
        [item.id]: false
      }));
      setClaimMessages((current) => ({
        ...current,
        [item.id]: "Claim request submitted."
      }));
    } catch (error) {
      setClaimMessages((current) => ({
        ...current,
        [item.id]:
          error.response?.data?.message ||
          "Could not submit claim"
      }));
    } finally {
      setSubmittingClaims((current) => ({
        ...current,
        [item.id]: false
      }));
    }
  };

  const handleReport = async (item) => {
    const reason = window.prompt(
      "Why are you reporting this found item?"
    );

    if (!reason?.trim()) {
      return;
    }

    try {
      await createReport({
        itemType: "FOUND_ITEM",
        itemId: item.id,
        reason
      });

      setReportMessages((current) => ({
        ...current,
        [item.id]: "Report submitted."
      }));
    } catch (error) {
      setReportMessages((current) => ({
        ...current,
        [item.id]:
          error.response?.data?.message ||
          "Could not submit report"
      }));
    }
  };

  if (loading) {
    return (
      <main className="search-page">
        <div className="search-loading">
          <span />
          <h1>Loading found items...</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="search-page">
      <aside className="search-sidebar">
        <form onSubmit={applyFilters}>
          <div className="filter-title-row">
            <h2>Advanced Filters</h2>
            {activeFilterCount > 0 && (
              <span>{activeFilterCount}</span>
            )}
          </div>

          <section className="filter-block">
            <h3>Category</h3>
            <div className="filter-check-list">
              {filterOptions.categories.length === 0 ? (
                <p>No categories yet</p>
              ) : (
                filterOptions.categories.map((category) => (
                  <label key={category}>
                    <input
                      type="checkbox"
                      checked={
                        draftFilters.category === category
                      }
                      onChange={() =>
                        handleCategoryChange(category)
                      }
                    />
                    <span>{category}</span>
                  </label>
                ))
              )}
            </div>
          </section>

          <section className="filter-block">
            <h3>Status</h3>
            <div className="status-filter-row">
              <button
                type="button"
                className={
                  draftFilters.status === ""
                    ? "active"
                    : ""
                }
                onClick={() => handleStatusChange("")}
              >
                All
              </button>

              {filterOptions.statuses.map((status) => (
                <button
                  type="button"
                  className={
                    draftFilters.status === status
                      ? "active"
                      : ""
                  }
                  key={status}
                  onClick={() =>
                    handleStatusChange(status)
                  }
                >
                  {formatStatus(status)}
                </button>
              ))}
            </div>
          </section>

          <section className="filter-block">
            <h3>Location Found</h3>
            <select
              name="location"
              value={draftFilters.location}
              onChange={handleDraftChange}
            >
              <option value="">Entire City</option>
              {filterOptions.locations.map((location) => (
                <option
                  key={location}
                  value={location}
                >
                  {location}
                </option>
              ))}
            </select>
          </section>

          <section className="filter-block">
            <h3>Date Found</h3>
            <input
              type="date"
              name="date"
              value={draftFilters.date}
              onChange={handleDraftChange}
            />
          </section>

          <div className="filter-actions">
            <button type="submit">
              Apply Filters
            </button>
            <button
              type="button"
              onClick={resetFilters}
            >
              Reset
            </button>
          </div>
        </form>

        <div className="search-sidebar-footer">
          <Link to="/dashboard">Settings</Link>
          <Link to="/messages">Help Center</Link>
        </div>
      </aside>

      <section className="search-content">
        <div className="search-toolbar">
          <label className="search-input-wrap">
            <span aria-hidden="true">Q</span>
            <input
              type="search"
              name="keyword"
              placeholder="Search found items..."
              value={draftFilters.keyword}
              onChange={handleDraftChange}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  applyFilters(event);
                }
              }}
            />
          </label>
        </div>

        <div className="search-results-header">
          <div>
            <h1>Found Items</h1>
            <p>
              Showing {items.length}{" "}
              {items.length === 1 ? "item" : "items"}
              {filters.keyword
                ? ` found for "${filters.keyword}"`
                : " from the found items database"}
            </p>
          </div>

          <label className="sort-control">
            <span>Sort by:</span>
            <select
              name="sort"
              value={draftFilters.sort}
              onChange={(event) => {
                const nextFilters = {
                  ...draftFilters,
                  sort: event.target.value
                };
                setDraftFilters(nextFilters);
                setFilters(nextFilters);
              }}
            >
              <option value="latest">
                Latest Reports
              </option>
              <option value="relevant">
                Most Relevant
              </option>
              <option value="updated">
                Recently Updated
              </option>
            </select>
          </label>
        </div>

        {error && (
          <p className="search-message search-error">
            {error}
          </p>
        )}

        {fetching && (
          <p className="search-message">
            Refreshing results...
          </p>
        )}

        {items.length === 0 ? (
          <div className="search-empty">
            <h2>No found items reported</h2>
            <p>
              Try a different keyword, category, location, or
              date filter.
            </p>
            <Link to="/create-found-item">
              Report a Found Item
            </Link>
          </div>
        ) : (
          <div className="search-results-grid">
            {items.map((item) => {
              const canClaim =
                user &&
                item.status === "FOUND" &&
                item.userId !== user.id;

              return (
                <article
                  className="search-result-card"
                  key={item.id}
                >
                  <div className="search-result-media">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                      />
                    ) : (
                      <div className="search-result-placeholder">
                        {item.category?.charAt(0) || "F"}
                      </div>
                    )}
                    <span
                      className={`search-result-badge search-result-badge-${item.status?.toLowerCase()}`}
                    >
                      {formatStatus(item.status)}
                    </span>
                  </div>

                  <div className="search-result-body">
                    <div>
                      <h2>{item.title}</h2>
                      <p className="search-result-line">
                        <span aria-hidden="true">O</span>
                        {item.foundLocation}
                      </p>
                      <p className="search-result-line">
                        <span aria-hidden="true">C</span>
                        Found {formatDate(item.dateFound)}
                      </p>
                      <p className="search-result-description">
                        {item.description}
                      </p>
                    </div>

                    <div className="search-result-meta">
                      <span>{item.category}</span>
                      <span>
                        Reported{" "}
                        {formatRelative(item.createdAt)}
                      </span>
                    </div>

                    {(item.storageLocation ||
                      item.contactInfo) && (
                      <div className="found-result-details">
                        {item.storageLocation && (
                          <span>
                            Storage: {item.storageLocation}
                          </span>
                        )}
                        {item.contactInfo && (
                          <span>
                            Contact: {item.contactInfo}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="search-result-actions">
                      {canClaim ? (
                        <button
                          type="button"
                          onClick={() =>
                            toggleClaimForm(item.id)
                          }
                        >
                          Claim Item
                        </button>
                      ) : (
                        <Link to="/create-lost-item">
                          Report Lost Match
                        </Link>
                      )}

                      {user && user.id !== item.userId && (
                        <button
                          type="button"
                          onClick={() =>
                            handleReport(item)
                          }
                        >
                          Report Post
                        </button>
                      )}
                    </div>

                    {openClaimForms[item.id] && (
                      <form
                        className="found-claim-form"
                        onSubmit={(event) =>
                          handleClaimSubmit(event, item)
                        }
                      >
                        <textarea
                          value={claimProofs[item.id] || ""}
                          onChange={(event) =>
                            setClaimProofs(
                              (current) => ({
                                ...current,
                                [item.id]:
                                  event.target.value
                              })
                            )
                          }
                          placeholder="Describe proof of ownership"
                          rows="4"
                          required
                        />

                        <div className="claim-actions">
                          <button
                            type="submit"
                            disabled={
                              submittingClaims[item.id]
                            }
                          >
                            {submittingClaims[item.id]
                              ? "Submitting..."
                              : "Send Claim"}
                          </button>

                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() =>
                              toggleClaimForm(item.id)
                            }
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    {claimMessages[item.id] && (
                      <p className="claim-message">
                        {claimMessages[item.id]}
                      </p>
                    )}

                    {reportMessages[item.id] && (
                      <p className="claim-message">
                        {reportMessages[item.id]}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

const formatStatus = (status = "") =>
  status
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join(" ");

const formatDate = (date) => {
  if (!date) {
    return "date unavailable";
  }

  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
};

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
    return "yesterday";
  }

  if (days < 7) {
    return `${days} days ago`;
  }

  return formatDate(date);
};

export default FoundItems;
