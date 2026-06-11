import {
  useEffect,
  useState
} from "react";
import ClaimRequestCard from "../components/ClaimRequestCard";
import { getMyClaimRequests } from "../services/claimRequestService";

function MyClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let isActive = true;

    const fetchClaims = async () => {
      try {
        const data =
          await getMyClaimRequests();

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

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div className="container">
      <h1>My Claim Requests</h1>

      {claims.length === 0 ? (
        <p>You have not submitted any claims.</p>
      ) : (
        claims.map((claim) => (
          <ClaimRequestCard
            key={claim.id}
            claim={claim}
          />
        ))
      )}
    </div>
  );
}

export default MyClaims;
