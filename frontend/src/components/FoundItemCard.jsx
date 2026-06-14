import {
  useState
} from "react";
import { useAuth } from "../context/useAuth";
import { createClaimRequest } from "../services/claimRequestService";
import { createReport } from "../services/reportService";

function FoundItemCard({ item }) {
  const {
    user
  } = useAuth();
  const [showClaimForm, setShowClaimForm] =
    useState(false);
  const [proofOfOwnership, setProofOfOwnership] =
    useState("");
  const [claimMessage, setClaimMessage] =
    useState("");
  const [reportMessage, setReportMessage] =
    useState("");
  const [submitting, setSubmitting] =
    useState(false);

  const canClaim =
    user &&
    item.status === "FOUND" &&
    item.userId !== user.id;

  const handleClaimSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setClaimMessage("");

    try {
      await createClaimRequest({
        foundItemId: item.id,
        proofOfOwnership
      });

      setProofOfOwnership("");
      setShowClaimForm(false);
      setClaimMessage(
        "Claim request submitted."
      );
    } catch (error) {
      setClaimMessage(
        error.response?.data?.message ||
          "Could not submit claim"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async () => {
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

      setReportMessage("Report submitted.");
    } catch (error) {
      setReportMessage(
        error.response?.data?.message ||
          "Could not submit report"
      );
    }
  };

  return (
    <div className="item-card">
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt={item.title}
          className="item-image"
        />
      )}

      <h3>{item.title}</h3>

      <p>
        <strong>Category:</strong> {item.category}
      </p>

      <p>
        <strong>Found location:</strong> {item.foundLocation}
      </p>

      <p>
        <strong>Date found:</strong>{" "}
        {new Date(item.dateFound).toLocaleDateString()}
      </p>

      <p>
        <strong>Storage location:</strong> {item.storageLocation}
      </p>

      <p>
        <strong>Contact:</strong> {item.contactInfo}
      </p>

      <p>{item.description}</p>

      <p>
        <strong>Status:</strong> {item.status}
      </p>

      {canClaim && (
        <div className="claim-box">
          {showClaimForm ? (
            <form
              className="claim-form"
              onSubmit={handleClaimSubmit}
            >
              <textarea
                value={proofOfOwnership}
                onChange={(event) =>
                  setProofOfOwnership(
                    event.target.value
                  )
                }
                placeholder="Describe proof of ownership"
                rows="4"
                required
              />

              <div className="claim-actions">
                <button
                  type="submit"
                  disabled={submitting}
                >
                  {submitting
                    ? "Submitting..."
                    : "Send Claim"}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowClaimForm(false)
                  }
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() =>
                setShowClaimForm(true)
              }
            >
              Claim Item
            </button>
          )}
        </div>
      )}

      {user && user.id !== item.userId && (
        <button
          type="button"
          className="secondary-button report-button"
          onClick={handleReport}
        >
          Report Post
        </button>
      )}

      {claimMessage && (
        <p className="claim-message">
          {claimMessage}
        </p>
      )}

      {reportMessage && (
        <p className="claim-message">
          {reportMessage}
        </p>
      )}
    </div>
  );
}

export default FoundItemCard;
