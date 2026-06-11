import {
  useEffect,
  useState
} from "react";
import ClaimRequestCard from "../components/ClaimRequestCard";
import { getReviewClaimRequests } from "../services/claimRequestService";

function ReviewClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let isActive = true;

    const fetchClaims = async () => {
      try {
        const data =
          await getReviewClaimRequests();

        if (isActive) {
          setClaims(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchClaims();

    return () => {
      isActive = false;
    };
  }, []);

  const handleStatusChange = (updatedClaim) => {
    setClaims((currentClaims) =>
      currentClaims.map((claim) =>
        claim.id === updatedClaim.id
          ? updatedClaim
          : claim.foundItemId ===
                updatedClaim.foundItemId &&
              updatedClaim.status === "ACCEPTED" &&
              claim.status === "PENDING"
            ? {
                ...claim,
                status: "REJECTED"
              }
            : claim
      )
    );
  };

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div className="container">
      <h1>Review Claim Requests</h1>

      {claims.length === 0 ? (
        <p>No claim requests to review.</p>
      ) : (
        claims.map((claim) => (
          <ClaimRequestCard
            key={claim.id}
            claim={claim}
            canReview
            onStatusChange={handleStatusChange}
          />
        ))
      )}
    </div>
  );
}

export default ReviewClaims;
