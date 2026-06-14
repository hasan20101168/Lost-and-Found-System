import { useNavigate } from "react-router-dom";
import { updateClaimRequestStatus } from "../services/claimRequestService";
import { createConversation } from "../services/conversationService";

const statusLabels = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected"
};

function ClaimRequestCard({
  claim,
  canReview = false,
  onStatusChange
}) {
  const navigate = useNavigate();

  const handleDecision = async (status) => {
    try {
      const updatedClaim =
        await updateClaimRequestStatus(
          claim.id,
          status
        );

      onStatusChange?.(updatedClaim);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Could not update claim"
      );
    }
  };

  const handleMessage = async () => {
    try {
      const conversation =
        await createConversation({
          claimRequestId: claim.id
        });

      navigate(`/messages/${conversation.id}`);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Could not start conversation"
      );
    }
  };

  return (
    <article className="claim-card">
      <div className="claim-card-header">
        <div>
          <h3>{claim.foundItem.title}</h3>
          <p>
            {claim.foundItem.category} at{" "}
            {claim.foundItem.foundLocation}
          </p>
        </div>

        <span
          className={`status-pill status-${claim.status.toLowerCase()}`}
        >
          {statusLabels[claim.status] ||
            claim.status}
        </span>
      </div>

      <p>
        <strong>Proof:</strong>{" "}
        {claim.proofOfOwnership}
      </p>

      <p>
        <strong>Claimant:</strong>{" "}
        {claim.claimant.name} (
        {claim.claimant.email})
      </p>

      <p>
        <strong>Item owner:</strong>{" "}
        {claim.foundItem.user.name} (
        {claim.foundItem.user.email})
      </p>

      {canReview &&
        claim.status === "PENDING" && (
          <div className="claim-actions">
            <button
              type="button"
              className="accept-button"
              onClick={() =>
                handleDecision("ACCEPTED")
              }
            >
              Accept
            </button>

            <button
              type="button"
              className="reject-button"
              onClick={() =>
                handleDecision("REJECTED")
              }
            >
              Reject
            </button>
          </div>
        )}

      <div className="claim-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={handleMessage}
        >
          Message
        </button>
      </div>
    </article>
  );
}

export default ClaimRequestCard;
